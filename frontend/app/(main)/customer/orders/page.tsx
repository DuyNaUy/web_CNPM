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
import React, { useRef, useState } from 'react';

interface OrderItem {
    productId: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

interface Order {
    id: number;
    orderNumber: string;
    date: string;
    status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'returned';
    total: number;
    items: OrderItem[];
    shippingAddress: string;
    paymentMethod: string;
    trackingEvents?: {
        status: string;
        date: string;
        description: string;
    }[];
}

const OrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([
        {
            id: 1,
            orderNumber: 'DH001234',
            date: '2024-11-05',
            status: 'delivered',
            total: 415000,
            paymentMethod: 'COD',
            shippingAddress: '123 Nguyễn Văn Linh, Q.7, TP.HCM',
            items: [
                {
                    productId: 1,
                    name: 'Cải Thảo Hữu Cơ',
                    price: 25000,
                    quantity: 2,
                    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300'
                },
                {
                    productId: 4,
                    name: 'Trứng Gà Organic',
                    price: 65000,
                    quantity: 1,
                    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300'
                }
            ],
            trackingEvents: [
                { status: 'Đã đặt hàng', date: '2024-11-05 10:30', description: 'Đơn hàng đã được tiếp nhận' },
                { status: 'Đã xác nhận', date: '2024-11-05 11:00', description: 'Đơn hàng đã được xác nhận' },
                { status: 'Đang giao', date: '2024-11-05 14:00', description: 'Đơn hàng đang được giao đến bạn' },
                { status: 'Đã giao', date: '2024-11-05 16:30', description: 'Đơn hàng đã được giao thành công' }
            ]
        },
        {
            id: 2,
            orderNumber: 'DH001235',
            date: '2024-11-06',
            status: 'shipping',
            total: 1200000,
            paymentMethod: 'VNPay',
            shippingAddress: '456 Lê Văn Việt, Q.9, TP.HCM',
            items: [
                {
                    productId: 2,
                    name: 'Thịt Bò Úc',
                    price: 350000,
                    quantity: 2,
                    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=300'
                },
                {
                    productId: 5,
                    name: 'Gạo ST25',
                    price: 120000,
                    quantity: 1,
                    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300'
                }
            ],
            trackingEvents: [
                { status: 'Đã đặt hàng', date: '2024-11-06 09:15', description: 'Đơn hàng đã được tiếp nhận' },
                { status: 'Đã xác nhận', date: '2024-11-06 09:45', description: 'Đơn hàng đã được xác nhận' },
                { status: 'Đang giao', date: '2024-11-06 13:00', description: 'Đơn hàng đang được giao đến bạn' }
            ]
        },
        {
            id: 3,
            orderNumber: 'DH001236',
            date: '2024-11-07',
            status: 'confirmed',
            total: 560000,
            paymentMethod: 'Momo',
            shippingAddress: '789 Võ Văn Ngân, Thủ Đức, TP.HCM',
            items: [
                {
                    productId: 3,
                    name: 'Tôm Sú Sống',
                    price: 280000,
                    quantity: 2,
                    image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300'
                }
            ],
            trackingEvents: [
                { status: 'Đã đặt hàng', date: '2024-11-07 08:20', description: 'Đơn hàng đã được tiếp nhận' },
                { status: 'Đã xác nhận', date: '2024-11-07 08:50', description: 'Đơn hàng đã được xác nhận' }
            ]
        },
        {
            id: 4,
            orderNumber: 'DH001237',
            date: '2024-11-08',
            status: 'pending',
            total: 840000,
            paymentMethod: 'COD',
            shippingAddress: '321 Điện Biên Phủ, Q.3, TP.HCM',
            items: [
                {
                    productId: 8,
                    name: 'Cá Hồi Na Uy',
                    price: 420000,
                    quantity: 2,
                    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300'
                }
            ],
            trackingEvents: [{ status: 'Đã đặt hàng', date: '2024-11-08 10:00', description: 'Đơn hàng đã được tiếp nhận' }]
        }
    ]);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailDialog, setDetailDialog] = useState(false);
    const toast = useRef<Toast>(null);

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
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.total);
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

    const customizedContent = (item: any) => {
        return (
            <Card className="mt-3 mb-3">
                <div className="flex flex-column">
                    <div className="font-bold text-lg mb-2">{item.status}</div>
                    <div className="text-600 mb-1">{item.date}</div>
                    <div className="text-700">{item.description}</div>
                </div>
            </Card>
        );
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="col-12">
                <div className="card">
                    <h5>Đơn Hàng Của Tôi</h5>

                    <DataTable value={orders} paginator rows={10} dataKey="id" emptyMessage="Bạn chưa có đơn hàng nào">
                        <Column field="orderNumber" header="Mã đơn hàng" sortable />
                        <Column field="date" header="Ngày đặt" sortable />
                        <Column header="Trạng thái" body={statusBodyTemplate} sortable field="status" />
                        <Column field="paymentMethod" header="Thanh toán" />
                        <Column header="Tổng tiền" body={totalBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '150px' }} />
                    </DataTable>
                </div>
            </div>

            {/* Order Detail Dialog */}
            <Dialog visible={detailDialog} style={{ width: '900px' }} header={`Chi tiết đơn hàng ${selectedOrder?.orderNumber}`} modal className="p-fluid" onHide={() => setDetailDialog(false)} maximizable>
                {selectedOrder && (
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="surface-100 p-3 border-round mb-3">
                                <h6 className="mt-0 mb-3">Thông tin đơn hàng</h6>
                                <div className="mb-2">
                                    <span className="text-600">Mã đơn hàng:</span>
                                    <span className="ml-2 font-bold">{selectedOrder.orderNumber}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-600">Ngày đặt:</span>
                                    <span className="ml-2">{selectedOrder.date}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-600">Trạng thái:</span>
                                    <Tag value={statusMap[selectedOrder.status].label} severity={statusMap[selectedOrder.status].severity} className="ml-2" />
                                </div>
                                <div className="mb-2">
                                    <span className="text-600">Phương thức thanh toán:</span>
                                    <span className="ml-2">{selectedOrder.paymentMethod}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-600">Địa chỉ giao hàng:</span>
                                    <span className="ml-2">{selectedOrder.shippingAddress}</span>
                                </div>
                            </div>

                            <div className="surface-100 p-3 border-round">
                                <h6 className="mt-0 mb-3">Sản phẩm</h6>
                                {selectedOrder.items.map((item, index) => (
                                    <div key={index} className="flex align-items-center mb-3 pb-3 border-bottom-1 surface-border">
                                        <img src={item.image} alt={item.name} className="w-4rem h-4rem border-round mr-3" style={{ objectFit: 'cover' }} />
                                        <div className="flex-1">
                                            <div className="font-bold">{item.name}</div>
                                            <div className="text-600">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)} x {item.quantity}
                                            </div>
                                        </div>
                                        <div className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}</div>
                                    </div>
                                ))}
                                <div className="flex justify-content-between mt-3 pt-3 border-top-1 surface-border">
                                    <span className="font-bold text-xl">Tổng cộng:</span>
                                    <span className="font-bold text-xl text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-6">
                            <div className="surface-100 p-3 border-round">
                                <h6 className="mt-0 mb-3">Lịch sử theo dõi</h6>
                                {selectedOrder.trackingEvents && selectedOrder.trackingEvents.length > 0 ? (
                                    <Timeline value={selectedOrder.trackingEvents} content={customizedContent} marker={customizedMarker} />
                                ) : (
                                    <p className="text-600">Chưa có thông tin theo dõi</p>
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
