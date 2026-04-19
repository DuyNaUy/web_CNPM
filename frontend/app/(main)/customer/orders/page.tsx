/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI } from '@/services/api';

interface OrderItem {
    product_name: string;
    product_price: number;
    quantity: number;
    unit: string;
}

interface Order {
    id: number;
    order_code: string;
    created_at: string;
    updated_at?: string;
    status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'returned';
    total_amount: number;
    items: OrderItem[];
    address: string;
    payment_method: string;
    full_name: string;
    phone: string;
    email: string;
}

const OrdersPage = () => {
    const RETURN_WINDOW_DAYS = 3;
    const RETURN_WINDOW_MS = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailDialog, setDetailDialog] = useState(false);
    const toast = useRef<Toast>(null);

    // Load orders on mount
    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await orderAPI.getMyOrders();
            console.log('Orders response:', response);
            
            let ordersList = response;
            // Handle if response has data property
            if (response && response.data) {
                ordersList = response.data;
            }
            
            if (ordersList && Array.isArray(ordersList)) {
                setOrders(ordersList);
            } else if (!ordersList) {
                setOrders([]);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể tải đơn hàng',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const statusMap: { [key: string]: { label: string; severity: any } } = {
        pending: { label: 'Chờ xác nhận', severity: 'warning' },
        confirmed: { label: 'Đã xác nhận', severity: 'info' },
        shipping: { label: 'Đang giao', severity: 'primary' },
        delivered: { label: 'Đã giao', severity: 'success' },
        cancelled: { label: 'Đã hủy', severity: 'danger' },
        returned: { label: 'Đã hoàn', severity: 'secondary' }
    };

    const statusBodyTemplate = (rowData: Order) => {
        const status = statusMap[rowData.status];
        return <Tag value={status.label} severity={status.severity} />;
    };

    const totalBodyTemplate = (rowData: Order) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.total_amount);
    };

    const getDeliveredTime = (order: Order) => {
        // Prefer updated_at because it reflects status transition time better than created_at.
        const deliveredTime = order.updated_at || order.created_at;
        return new Date(deliveredTime).getTime();
    };

    const canReturnOrder = (order: Order) => {
        if (order.status !== 'delivered') {
            return false;
        }

        const deliveredAt = getDeliveredTime(order);
        if (Number.isNaN(deliveredAt)) {
            return false;
        }

        return Date.now() - deliveredAt <= RETURN_WINDOW_MS;
    };

    const actionBodyTemplate = (rowData: Order) => {
        const isReturnAllowed = canReturnOrder(rowData);
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-eye" rounded outlined onClick={() => viewOrderDetail(rowData)} tooltip="Xem chi tiết" />
                {(rowData.status === 'pending' || rowData.status === 'confirmed') && <Button icon="pi pi-times" rounded outlined severity="danger" onClick={() => cancelOrder(rowData)} tooltip="Hủy đơn" />}
                {rowData.status === 'delivered' && isReturnAllowed && (
                    <Button
                        icon="pi pi-replay"
                        rounded
                        outlined
                        severity="warning"
                        onClick={() => returnOrder(rowData)}
                        tooltip="Hoàn hàng"
                    />
                )}
            </div>
        );
    };

    const viewOrderDetail = (order: Order) => {
        setSelectedOrder(order);
        setDetailDialog(true);
    };

    const cancelOrder = (order: Order) => {
        confirmDialog({
            message: `Bạn có chắc chắn muốn hủy đơn hàng ${order.order_code}?`,
            header: 'Xác nhận hủy đơn',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await orderAPI.cancelOrder(order.id);
                    await loadOrders();
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Đã hủy',
                        detail: 'Đơn hàng đã được hủy thành công',
                        life: 3000
                    });
                } catch (error: any) {
                    console.error('Error cancelling order:', error);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: error.response?.data?.error || 'Không thể hủy đơn hàng',
                        life: 3000
                    });
                }
            },
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const returnOrder = (order: Order) => {
        if (!canReturnOrder(order)) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Không thể hoàn hàng',
                detail: `Đơn hàng đã quá ${RETURN_WINDOW_DAYS} ngày kể từ khi nhận hàng`,
                life: 3500
            });
            return;
        }

        confirmDialog({
            message: `Bạn có muốn yêu cầu hoàn hàng cho đơn hàng ${order.order_code}?`,
            header: 'Yêu cầu hoàn hàng',
            icon: 'pi pi-question-circle',
            accept: () => {
                const firstItem = order.items?.[0];
                const totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 1;
                const itemNames = order.items?.map((item) => item.product_name).join(', ') || 'sản phẩm trong đơn hàng';
                const firstItemPrice = Number(firstItem?.product_price || 0);
                const fallbackImage = (firstItem as any)?.product_image || (firstItem as any)?.image || null;

                sessionStorage.setItem('ai_product_context', JSON.stringify({
                    source: 'order-return',
                    product_id: order.id,
                    product_name: firstItem?.product_name || `Đơn hàng ${order.order_code}`,
                    category: 'hoàn hàng',
                    description: `Yêu cầu hoàn hàng cho đơn ${order.order_code}. Sản phẩm: ${itemNames}`,
                    detail_description: `Mã đơn: ${order.order_code} | Ngày đặt: ${new Date(order.created_at).toLocaleString('vi-VN')} | Người nhận: ${order.full_name} | SĐT: ${order.phone} | Địa chỉ: ${order.address}`,
                    selected_size: firstItem?.unit || 'không áp dụng',
                    quantity: totalQuantity,
                    price: firstItemPrice > 0 ? firstItemPrice : order.total_amount,
                    min_price: firstItemPrice > 0 ? firstItemPrice : order.total_amount,
                    max_price: firstItemPrice > 0 ? firstItemPrice : order.total_amount,
                    image: fallbackImage,
                    timestamp: new Date().toISOString(),
                    order_id: order.id,
                    order_code: order.order_code,
                    order_created_at: order.created_at,
                    auto_send: true
                }));

                toast.current?.show({
                    severity: 'info',
                    summary: 'Đang chuyển tư vấn',
                    detail: 'Bạn sẽ được chuyển đến chatbot để trao đổi hoàn hàng với admin',
                    life: 2500
                });

                setTimeout(() => {
                    router.push('/customer/ai-agent');
                }, 300);
            },
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const customizedMarker = (item: any) => {
        return (
            <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1" style={{ backgroundColor: '#22C55E' }}>
                <i className="pi pi-check"></i>
            </span>
        );
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* Header Section */}
            <div className="col-12">
                <div className="card" style={{ background: 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)', color: 'white' }}>
                    <div className="flex align-items-center justify-content-between">
                        <div>
                            <h2 className="mb-2" style={{ color: 'white' }}>📦 Đơn Hàng Của Tôi</h2>
                            <p className="mb-0 text-white-alpha-90">Theo dõi và quản lý tất cả đơn hàng của bạn</p>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-white-alpha-20 border-round" style={{ width: '4rem', height: '4rem' }}>
                            <i className="pi pi-shopping-bag text-white" style={{ fontSize: '2rem' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="col-12">
                <div className="card shadow-3">
                    <DataTable 
                        value={orders} 
                        paginator 
                        rows={10} 
                        dataKey="id" 
                        loading={loading} 
                        emptyMessage="🛍️ Bạn chưa có đơn hàng nào"
                        stripedRows
                        showGridlines
                        className="custom-datatable"
                    >
                        <Column 
                            field="order_code" 
                            header="Mã đơn hàng" 
                            sortable 
                            body={(rowData) => (
                                <span className="font-bold text-primary">{rowData.order_code}</span>
                            )}
                        />
                        <Column 
                            field="created_at" 
                            header="Ngày đặt" 
                            sortable 
                            body={(rowData) => (
                                <div>
                                    <i className="pi pi-calendar mr-2 text-500"></i>
                                    {new Date(rowData.created_at).toLocaleDateString('vi-VN')}
                                </div>
                            )} 
                        />
                        <Column header="Trạng thái" body={statusBodyTemplate} sortable field="status" />
                        <Column 
                            field="payment_method" 
                            header="Thanh toán" 
                            body={(rowData) => (
                                <div className="flex align-items-center">
                                    <i className="pi pi-credit-card mr-2 text-600"></i>
                                    {rowData.payment_method}
                                </div>
                            )}
                        />
                        <Column 
                            header="Tổng tiền" 
                            body={(rowData) => (
                                <span className="font-bold text-pink-600">{totalBodyTemplate(rowData)}</span>
                            )} 
                            sortable 
                        />
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '150px' }} />
                    </DataTable>
                </div>
            </div>

            {/* Order Detail Dialog */}
            <Dialog 
                visible={detailDialog} 
                style={{ width: '950px' }} 
                header={
                    <div className="flex align-items-center">
                        <i className="pi pi-receipt mr-2 text-pink-500" style={{ fontSize: '1.5rem' }}></i>
                        <span>Chi tiết đơn hàng {selectedOrder?.order_code}</span>
                    </div>
                } 
                modal 
                className="p-fluid" 
                onHide={() => setDetailDialog(false)} 
                maximizable
            >
                {selectedOrder && (
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            {/* Order Info Card */}
                            <div className="surface-50 p-4 border-round-lg mb-3 shadow-2" style={{ borderLeft: '4px solid #FF69B4' }}>
                                <h6 className="mt-0 mb-4 flex align-items-center text-pink-600">
                                    <i className="pi pi-info-circle mr-2"></i>
                                    Thông tin đơn hàng
                                </h6>
                                <div className="mb-3">
                                    <div className="flex align-items-center">
                                        <i className="pi pi-hashtag text-500 mr-2"></i>
                                        <span className="text-600">Mã đơn hàng:</span>
                                    </div>
                                    <span className="ml-4 font-bold text-900">{selectedOrder.order_code}</span>
                                </div>
                                <div className="mb-3">
                                    <div className="flex align-items-center">
                                        <i className="pi pi-calendar text-500 mr-2"></i>
                                        <span className="text-600">Ngày đặt:</span>
                                    </div>
                                    <span className="ml-4 text-900">{new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</span>
                                </div>
                                <div className="mb-3">
                                    <div className="flex align-items-center mb-2">
                                        <i className="pi pi-tag text-500 mr-2"></i>
                                        <span className="text-600">Trạng thái:</span>
                                    </div>
                                    <Tag value={statusMap[selectedOrder.status].label} severity={statusMap[selectedOrder.status].severity} className="ml-4" />
                                </div>
                                <div className="mb-3">
                                    <div className="flex align-items-center">
                                        <i className="pi pi-credit-card text-500 mr-2"></i>
                                        <span className="text-600">Phương thức thanh toán:</span>
                                    </div>
                                    <span className="ml-4 text-900">{selectedOrder.payment_method}</span>
                                </div>
                                <div className="mb-3">
                                    <div className="flex align-items-center">
                                        <i className="pi pi-map-marker text-500 mr-2"></i>
                                        <span className="text-600">Địa chỉ giao hàng:</span>
                                    </div>
                                    <span className="ml-4 text-900">{selectedOrder.address}</span>
                                </div>
                                <div className="mb-3">
                                    <div className="flex align-items-center">
                                        <i className="pi pi-user text-500 mr-2"></i>
                                        <span className="text-600">Người nhận:</span>
                                    </div>
                                    <span className="ml-4 text-900">{selectedOrder.full_name}</span>
                                </div>
                                <div className="mb-3">
                                    <div className="flex align-items-center">
                                        <i className="pi pi-phone text-500 mr-2"></i>
                                        <span className="text-600">Số điện thoại:</span>
                                    </div>
                                    <span className="ml-4 text-900">{selectedOrder.phone}</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-6">
                            {/* Products Card */}
                            <div className="surface-50 p-4 border-round-lg mb-3 shadow-2" style={{ borderLeft: '4px solid #9C27B0' }}>
                                <h6 className="mt-0 mb-4 flex align-items-center text-purple-600">
                                    <i className="pi pi-shopping-cart mr-2"></i>
                                    Sản phẩm
                                </h6>
                                {selectedOrder.items.map((item, index) => (
                                    <div key={index} className="flex align-items-start mb-3 pb-3 border-bottom-1 surface-border">
                                        <div className="flex-1">
                                            <div className="font-bold text-900 mb-1">🧸 {item.product_name}</div>
                                            <div className="text-600 text-sm mb-1">
                                                <i className="pi pi-tag mr-1"></i>
                                                Size: {item.unit}
                                            </div>
                                            <div className="text-600 text-sm">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.product_price)} × {item.quantity}
                                            </div>
                                        </div>
                                        <div className="font-bold text-pink-600 text-lg">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.product_price * item.quantity)}
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-content-between align-items-center mt-4 pt-3 border-top-2 surface-border bg-pink-50 p-3 border-round">
                                    <span className="font-bold text-xl">Tổng cộng:</span>
                                    <span className="font-bold text-2xl text-pink-600">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.total_amount)}
                                    </span>
                                </div>
                            </div>

                            {/* Status Card */}
                            <div className="surface-50 p-4 border-round-lg shadow-2" style={{ borderLeft: '4px solid #009688' }}>
                                <h6 className="mt-0 mb-3 flex align-items-center text-teal-600">
                                    <i className="pi pi-truck mr-2"></i>
                                    Trạng thái đơn hàng
                                </h6>
                                <div className="mb-3">
                                    <p className="text-600 mb-2">
                                        Trạng thái hiện tại: 
                                        <Tag value={statusMap[selectedOrder.status].label} severity={statusMap[selectedOrder.status].severity} className="ml-2" />
                                    </p>
                                </div>
                                {selectedOrder.status === 'pending' && (
                                    <div className="bg-yellow-50 p-3 border-round-lg border-1 border-yellow-300">
                                        <div className="flex align-items-start">
                                            <i className="pi pi-info-circle text-yellow-600 mr-2 mt-1"></i>
                                            <span className="text-yellow-700 text-sm">
                                                Đơn hàng đang chờ xác nhận từ cửa hàng. Chúng tôi sẽ liên hệ với bạn sớm nhất!
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {selectedOrder.status === 'confirmed' && (
                                    <div className="bg-blue-50 p-3 border-round-lg border-1 border-blue-300">
                                        <div className="flex align-items-start">
                                            <i className="pi pi-check-circle text-blue-600 mr-2 mt-1"></i>
                                            <span className="text-blue-700 text-sm">
                                                Đơn hàng đã được xác nhận và đang được chuẩn bị!
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {selectedOrder.status === 'shipping' && (
                                    <div className="bg-indigo-50 p-3 border-round-lg border-1 border-indigo-300">
                                        <div className="flex align-items-start">
                                            <i className="pi pi-truck text-indigo-600 mr-2 mt-1"></i>
                                            <span className="text-indigo-700 text-sm">
                                                Đơn hàng đang trên đường giao đến bạn!
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {selectedOrder.status === 'delivered' && (
                                    <div className="bg-green-50 p-3 border-round-lg border-1 border-green-300">
                                        <div className="flex align-items-start">
                                            <i className="pi pi-check-circle text-green-600 mr-2 mt-1"></i>
                                            <span className="text-green-700 text-sm">
                                                Đơn hàng đã được giao thành công! Cảm ơn bạn đã mua hàng.
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default OrdersPage;
