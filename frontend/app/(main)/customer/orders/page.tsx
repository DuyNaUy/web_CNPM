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
    status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
    total_amount: number;
    items: OrderItem[];
    address: string;
    payment_method: string;
    full_name: string;
    phone: string;
    email: string;
}

const OrdersPage = () => {
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
            if (response && Array.isArray(response)) {
                setOrders(response);
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

    const actionBodyTemplate = (rowData: Order) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-eye" rounded outlined onClick={() => viewOrderDetail(rowData)} tooltip="Xem chi tiết" />
                {rowData.status === 'pending' && <Button icon="pi pi-times" rounded outlined severity="danger" onClick={() => cancelOrder(rowData)} tooltip="Hủy đơn" />}
                {rowData.status === 'delivered' && <Button icon="pi pi-replay" rounded outlined severity="warning" onClick={() => returnOrder(rowData)} tooltip="Hoàn hàng" />}
            </div>
        );
    };

    const viewOrderDetail = (order: Order) => {
        setSelectedOrder(order);
        setDetailDialog(true);
    };

    const cancelOrder = (order: Order) => {
        confirmDialog({
            message: `Bạn có chắc chắn muốn hủy đơn hàng ${order.orderNumber}?`,
            header: 'Xác nhận hủy đơn',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelled' } : o)));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Đã hủy',
                    detail: 'Đơn hàng đã được hủy thành công',
                    life: 3000
                });
            },
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const returnOrder = (order: Order) => {
        confirmDialog({
            message: `Bạn có muốn yêu cầu hoàn hàng cho đơn hàng ${order.orderNumber}?`,
            header: 'Yêu cầu hoàn hàng',
            icon: 'pi pi-question-circle',
            accept: () => {
                setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'returned' } : o)));
                toast.current?.show({
                    severity: 'info',
                    summary: 'Đã gửi yêu cầu',
                    detail: 'Yêu cầu hoàn hàng đã được gửi, chúng tôi sẽ liên hệ với bạn sớm',
                    life: 4000
                });
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

            <div className="col-12">
                <div className="card">
                    <h5>Đơn Hàng Của Tôi</h5>

                    <DataTable value={orders} paginator rows={10} dataKey="id" loading={loading} emptyMessage="Bạn chưa có đơn hàng nào">
                        <Column field="order_code" header="Mã đơn hàng" sortable />
                        <Column field="created_at" header="Ngày đặt" sortable body={(rowData) => new Date(rowData.created_at).toLocaleDateString('vi-VN')} />
                        <Column header="Trạng thái" body={statusBodyTemplate} sortable field="status" />
                        <Column field="payment_method" header="Thanh toán" />
                        <Column header="Tổng tiền" body={totalBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '150px' }} />
                    </DataTable>
                </div>
            </div>

            {/* Order Detail Dialog */}
            <Dialog visible={detailDialog} style={{ width: '900px' }} header={`Chi tiết đơn hàng ${selectedOrder?.order_code}`} modal className="p-fluid" onHide={() => setDetailDialog(false)} maximizable>
                {selectedOrder && (
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="surface-100 p-3 border-round mb-3">
                                <h6 className="mt-0 mb-3">Thông tin đơn hàng</h6>
                                <div className="mb-2">
                                    <span className="text-600">Mã đơn hàng:</span>
                                    <span className="ml-2 font-bold">{selectedOrder.order_code}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-600">Ngày đặt:</span>
                                    <span className="ml-2">{new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-600">Trạng thái:</span>
                                    <Tag value={statusMap[selectedOrder.status].label} severity={statusMap[selectedOrder.status].severity} className="ml-2" />
                                </div>
                                <div className="mb-2">
                                    <span className="text-600">Phương thức thanh toán:</span>
                                    <span className="ml-2">{selectedOrder.payment_method}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-600">Địa chỉ giao hàng:</span>
                                    <span className="ml-2">{selectedOrder.address}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-600">Người nhận:</span>
                                    <span className="ml-2">{selectedOrder.full_name}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-600">Số điện thoại:</span>
                                    <span className="ml-2">{selectedOrder.phone}</span>
                                </div>
                            </div>

                            <div className="surface-100 p-3 border-round">
                                <h6 className="mt-0 mb-3">Sản phẩm</h6>
                                {selectedOrder.items.map((item, index) => (
                                    <div key={index} className="flex align-items-center mb-3 pb-3 border-bottom-1 surface-border">
                                        <div className="flex-1">
                                            <div className="font-bold">{item.product_name}</div>
                                            <div className="text-600">Size: {item.unit}</div>
                                            <div className="text-600">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.product_price)} x {item.quantity}
                                            </div>
                                        </div>
                                        <div className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.product_price * item.quantity)}</div>
                                    </div>
                                ))}
                                <div className="flex justify-content-between mt-3 pt-3 border-top-1 surface-border">
                                    <span className="font-bold text-xl">Tổng cộng:</span>
                                    <span className="font-bold text-xl text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.total_amount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-6">
                            <div className="surface-100 p-3 border-round">
                                <h6 className="mt-0 mb-3">Trạng thái đơn hàng</h6>
                                <div className="mb-3">
                                    <p className="text-600 mb-2">Trạng thái hiện tại: <strong>{statusMap[selectedOrder.status].label}</strong></p>
                                    <p className="text-500 text-sm">Vui lòng chờ cửa hàng xác nhận đơn hàng của bạn.</p>
                                </div>
                                {selectedOrder.status === 'pending' && (
                                    <div className="bg-yellow-50 p-3 border-round border-1 border-yellow-200">
                                        <i className="pi pi-info-circle text-yellow-600 mr-2"></i>
                                        <span className="text-yellow-600 text-sm">Đơn hàng đang chờ xác nhận từ cửa hàng</span>
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
