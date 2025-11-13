/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useRef, useState, useEffect } from 'react';
import { Tag } from 'primereact/tag';
import { orderAPI } from '@/services/api';

interface OrderItem {
    id: number;
    product_name: string;
    product_price: number;
    quantity: number;
    unit: string;
}

interface Order {
    id: number;
    order_code: string;
    full_name: string;
    phone: string;
    total_amount: number;
    status: string;
    payment_method: string;
    created_at: string;
    address: string;
    email: string;
    city: string;
    district: string;
    note: string;
    payment_status: string;
    subtotal: number;
    shipping_fee: number;
    items: OrderItem[];
}

const OrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [orderDialog, setOrderDialog] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef<Toast>(null);

    const statuses = [
        { label: 'Chờ xác nhận', value: 'pending' },
        { label: 'Đã xác nhận', value: 'confirmed' },
        { label: 'Đang giao', value: 'shipping' },
        { label: 'Đã giao', value: 'delivered' },
        { label: 'Đã hủy', value: 'cancelled' }
    ];

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            console.log('Loading orders...');
            const response = await orderAPI.getAllOrders();
            console.log('Orders response:', response);
            
            if (Array.isArray(response)) {
                console.log('Orders are array:', response.length);
                setOrders(response);
            } else if (response.data && Array.isArray(response.data)) {
                console.log('Orders in data:', response.data.length);
                setOrders(response.data);
            } else if (response.error) {
                console.error('API error:', response.error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: response.error || 'Không thể tải danh sách đơn hàng',
                    life: 3000
                });
            }
        } catch (error: any) {
            console.error('Loading orders error:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể tải danh sách đơn hàng',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const viewOrder = (order: Order) => {
        setOrder({ ...order });
        setOrderDialog(true);
    };

    const hideDialog = () => {
        setOrderDialog(false);
    };

    const updateOrderStatus = async (newStatus: string) => {
        if (order) {
            try {
                const response = await orderAPI.updateOrderStatus(order.id, newStatus);
                if (response && response.id) {
                    // Update local state
                    let _orders = [...orders];
                    const index = _orders.findIndex((o) => o.id === order.id);
                    if (index >= 0) {
                        _orders[index].status = newStatus;
                        setOrders(_orders);
                    }
                    setOrder({ ...order, status: newStatus });
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Thành công',
                        detail: 'Cập nhật trạng thái đơn hàng thành công',
                        life: 3000
                    });
                }
            } catch (error: any) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: error.message || 'Không thể cập nhật trạng thái',
                    life: 3000
                });
            }
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <h4 className="m-0">Danh Sách Đơn Hàng</h4>
            </div>
        );
    };

    const actionBodyTemplate = (rowData: Order) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-eye" rounded outlined className="mr-2" onClick={() => viewOrder(rowData)} />
            </React.Fragment>
        );
    };

    const statusBodyTemplate = (rowData: Order) => {
        const statusMap: { [key: string]: { label: string; severity: any } } = {
            pending: { label: 'Chờ xác nhận', severity: 'warning' },
            confirmed: { label: 'Đã xác nhận', severity: 'info' },
            shipping: { label: 'Đang giao', severity: 'primary' },
            delivered: { label: 'Đã giao', severity: 'success' },
            cancelled: { label: 'Đã hủy', severity: 'danger' }
        };
        const status = statusMap[rowData.status] || statusMap['pending'];
        return <Tag value={status.label} severity={status.severity} />;
    };

    const paymentMethodBodyTemplate = (rowData: Order) => {
        const methods: { [key: string]: string } = {
            'cod': 'Tiền mặt',
            'vnpay': 'VNPay',
            'momo': 'Momo',
            'banking': 'Chuyển khoản'
        };
        return methods[rowData.payment_method] || rowData.payment_method;
    };

    const totalAmountBodyTemplate = (rowData: Order) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.total_amount);
    };

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <h4 className="m-0">Quản Lý Đơn Hàng</h4>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" placeholder="Tìm kiếm..." onInput={(e) => setGlobalFilter((e.target as HTMLInputElement).value)} />
            </span>
        </div>
    );

    const orderDialogFooter = (
        <React.Fragment>
            <div className="flex flex-wrap gap-2 justify-content-between align-items-center w-full">
                <div className="flex flex-wrap gap-2">
                    {order && statuses.map((status) => (
                        <Button 
                            key={status.value} 
                            label={status.label} 
                            severity={order.status === status.value ? 'success' : 'secondary'}
                            onClick={() => updateOrderStatus(status.value)}
                            icon={order.status === status.value ? 'pi pi-check' : ''}
                            size="small"
                        />
                    ))}
                </div>
                <Button label="Đóng" icon="pi pi-times" outlined onClick={hideDialog} />
            </div>
        </React.Fragment>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />

                    <DataTable
                        value={orders}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} đơn hàng"
                        globalFilter={globalFilter}
                        header={header}
                        loading={loading}
                    >
                        <Column field="order_code" header="Mã đơn" sortable style={{ minWidth: '8rem' }}></Column>
                        <Column field="full_name" header="Khách hàng" sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="phone" header="SĐT" sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="total_amount" header="Tổng tiền" body={totalAmountBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="payment_method" header="Thanh toán" body={paymentMethodBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="status" header="Trạng thái" body={statusBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="created_at" header="Ngày đặt" body={(rowData: Order) => {
                            const date = new Date(rowData.created_at.split('.')[0]);
                            const dateStr = date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
                            const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                            return `${dateStr} ${timeStr}`;
                        }} sortable style={{ minWidth: '12rem' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }}></Column>
                    </DataTable>

                    <Dialog visible={orderDialog} style={{ width: '70rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header={`Chi Tiết Đơn Hàng - ${order?.order_code}`} modal className="p-fluid" footer={orderDialogFooter} onHide={hideDialog} maximizable>
                        {order && (
                            <div className="grid">
                                {/* Thông tin đơn hàng */}
                                <div className="col-12 md:col-6">
                                    <div className="surface-100 p-4 border-round mb-3">
                                        <h6 className="mt-0 mb-3 text-primary">Thông Tin Đơn Hàng</h6>
                                        <div className="mb-3">
                                            <span className="text-600 block mb-1">Mã đơn hàng:</span>
                                            <span className="font-bold text-xl">{order.order_code}</span>
                                        </div>
                                        <div className="mb-3">
                                            <span className="text-600 block mb-1">Ngày đặt:</span>
                                            <div>
                                                <div className="font-semibold text-lg mb-1">{new Date(order.created_at.split('.')[0]).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                                <div className="text-primary font-bold">Lúc {new Date(order.created_at.split('.')[0]).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <span className="text-600 block mb-1">Trạng thái:</span>
                                            <Tag value={(() => {
                                                const statusMap: { [key: string]: { label: string; severity: any } } = {
                                                    pending: { label: 'Chờ xác nhận', severity: 'warning' },
                                                    confirmed: { label: 'Đã xác nhận', severity: 'info' },
                                                    shipping: { label: 'Đang giao', severity: 'primary' },
                                                    delivered: { label: 'Đã giao', severity: 'success' },
                                                    cancelled: { label: 'Đã hủy', severity: 'danger' }
                                                };
                                                return statusMap[order.status]?.label || 'Không xác định';
                                            })()} severity={(() => {
                                                const statusMap: { [key: string]: { label: string; severity: any } } = {
                                                    pending: { label: 'Chờ xác nhận', severity: 'warning' },
                                                    confirmed: { label: 'Đã xác nhận', severity: 'info' },
                                                    shipping: { label: 'Đang giao', severity: 'primary' },
                                                    delivered: { label: 'Đã giao', severity: 'success' },
                                                    cancelled: { label: 'Đã hủy', severity: 'danger' }
                                                };
                                                return statusMap[order.status]?.severity || 'secondary';
                                            })()} />
                                        </div>
                                        <div className="mb-3">
                                            <span className="text-600 block mb-1">Phương thức thanh toán:</span>
                                            <span>{paymentMethodBodyTemplate(order)}</span>
                                        </div>
                                    </div>

                                    {/* Thông tin khách hàng */}
                                    <div className="surface-100 p-4 border-round">
                                        <h6 className="mt-0 mb-3 text-primary">Thông Tin Khách Hàng</h6>
                                        <div className="mb-3">
                                            <span className="text-600 block mb-1">Tên:</span>
                                            <span className="font-semibold">{order.full_name}</span>
                                        </div>
                                        <div className="mb-3">
                                            <span className="text-600 block mb-1">Số điện thoại:</span>
                                            <span>{order.phone}</span>
                                        </div>
                                        <div className="mb-3">
                                            <span className="text-600 block mb-1">Email:</span>
                                            <span>{order.email}</span>
                                        </div>
                                        <div className="mb-3">
                                            <span className="text-600 block mb-1">Địa chỉ:</span>
                                            <span>{order.address}</span>
                                        </div>
                                        <div>
                                            <span className="text-600 block mb-1">Quận/Huyện - Tỉnh/Thành phố:</span>
                                            <span>{order.district} - {order.city}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Danh sách sản phẩm */}
                                <div className="col-12 md:col-6">
                                    <div className="surface-100 p-4 border-round mb-3">
                                        <h6 className="mt-0 mb-3 text-primary">Sản Phẩm</h6>
                                        {order.items.map((item, index) => (
                                            <div key={index} className="mb-3 pb-3 border-bottom-1 surface-border">
                                                <div className="flex justify-content-between align-items-start mb-2">
                                                    <div className="flex-1">
                                                        <div className="font-semibold">{item.product_name}</div>
                                                        <div className="text-600 text-sm">Size: {item.unit}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.product_price)}</div>
                                                        <div className="text-600 text-sm">x {item.quantity}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right font-bold text-lg text-primary">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.product_price * item.quantity)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tổng tiền */}
                                    <div className="surface-100 p-4 border-round mb-3">
                                        <div className="flex justify-content-between mb-2">
                                            <span className="text-600">Tạm tính:</span>
                                            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-content-between mb-3 pb-3 border-bottom-1 surface-border">
                                            <span className="text-600">Phí vận chuyển:</span>
                                            <span className={order.shipping_fee === 0 ? 'text-green-500 font-semibold' : ''}>
                                                {order.shipping_fee === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.shipping_fee)}
                                            </span>
                                        </div>
                                        <div className="flex justify-content-between">
                                            <span className="font-bold text-lg">Tổng cộng:</span>
                                            <span className="font-bold text-xl text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}</span>
                                        </div>
                                    </div>

                                    {/* Ghi chú */}
                                    {order.note && (
                                        <div className="surface-100 p-4 border-round">
                                            <h6 className="mt-0 mb-2 text-primary">Ghi Chú</h6>
                                            <p className="text-600 m-0">{order.note}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;
