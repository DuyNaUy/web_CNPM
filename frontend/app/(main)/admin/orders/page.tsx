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

    const updateOrderStatus = (newStatus: string) => {
        if (order) {
            let _orders = [...orders];
            const index = _orders.findIndex((o) => o.id === order.id);
            _orders[index].status = newStatus;
            setOrders(_orders);
            setOrder({ ...order, status: newStatus });
            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật trạng thái đơn hàng thành công',
                life: 3000
            });
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
            processing: { label: 'Đang xử lý', severity: 'info' },
            shipping: { label: 'Đang giao', severity: 'primary' },
            completed: { label: 'Hoàn thành', severity: 'success' },
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
            <Button label="Đóng" icon="pi pi-times" outlined onClick={hideDialog} />
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
                        <Column field="created_at" header="Ngày đặt" sortable style={{ minWidth: '10rem' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }}></Column>
                    </DataTable>

                    <Dialog visible={orderDialog} style={{ width: '50rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Chi Tiết Đơn Hàng" modal className="p-fluid" footer={orderDialogFooter} onHide={hideDialog}>
                        {order && (
                            <div className="grid">
                                <div className="col-12">
                                    <div className="card">
                                        <h5>Thông tin đơn hàng</h5>
                                        <div className="p-fluid formgrid grid">
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Mã đơn hàng:</strong>
                                                </label>
                                                <p>{order.order_code}</p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Ngày đặt:</strong>
                                                </label>
                                                <p>{order.created_at}</p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Khách hàng:</strong>
                                                </label>
                                                <p>{order.full_name}</p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Số điện thoại:</strong>
                                                </label>
                                                <p>{order.phone}</p>
                                            </div>
                                            <div className="field col-12">
                                                <label>
                                                    <strong>Địa chỉ giao hàng:</strong>
                                                </label>
                                                <p>{order.address}</p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Phương thức thanh toán:</strong>
                                                </label>
                                                <p>{order.payment_method === 'cod' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Tổng tiền:</strong>
                                                </label>
                                                <p className="text-2xl text-primary font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="card">
                                        <h5>Cập nhật trạng thái</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {statuses.map((status) => (
                                                <Button key={status.value} label={status.label} severity={order.status === status.value ? 'success' : 'secondary'} onClick={() => updateOrderStatus(status.value)} />
                                            ))}
                                        </div>
                                    </div>
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
