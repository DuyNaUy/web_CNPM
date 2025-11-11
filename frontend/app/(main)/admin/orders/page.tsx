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
import React, { useRef, useState } from 'react';
import { Tag } from 'primereact/tag';

interface Order {
    id: number;
    orderCode: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    status: string;
    paymentMethod: string;
    orderDate: string;
    address: string;
}

const OrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([
        {
            id: 1,
            orderCode: 'DH001',
            customerName: 'Hoàng Văn Quang',
            customerPhone: '0123456789',
            totalAmount: 1500000,
            status: 'pending',
            paymentMethod: 'cod',
            orderDate: '2024-11-08',
            address: '123 Đường ABC, Quận 1, TP.HCM'
        },
        {
            id: 2,
            orderCode: 'DH002',
            customerName: 'Nguyễn Hoàng Dương',
            customerPhone: '0987654321',
            totalAmount: 2300000,
            status: 'processing',
            paymentMethod: 'transfer',
            orderDate: '2024-11-07',
            address: '456 Đường XYZ, Quận 2, TP.HCM'
        },
        {
            id: 3,
            orderCode: 'DH003',
            customerName: 'Lê Thu Mai',
            customerPhone: '0912345678',
            totalAmount: 850000,
            status: 'completed',
            paymentMethod: 'cod',
            orderDate: '2024-11-06',
            address: '789 Đường DEF, Quận 3, TP.HCM'
        },
        {
            id: 4,
            orderCode: 'DH004',
            customerName: 'Lương Trọng Duy',
            customerPhone: '0923456789',
            totalAmount: 1200000,
            status: 'cancelled',
            paymentMethod: 'transfer',
            orderDate: '2024-11-05',
            address: '321 Đường GHI, Quận 4, TP.HCM'
        }
    ]);

    const [orderDialog, setOrderDialog] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef<Toast>(null);

    const statuses = [
        { label: 'Chờ xác nhận', value: 'pending' },
        { label: 'Đang xử lý', value: 'processing' },
        { label: 'Đang giao', value: 'shipping' },
        { label: 'Hoàn thành', value: 'completed' },
        { label: 'Đã hủy', value: 'cancelled' }
    ];

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
        return rowData.paymentMethod === 'cod' ? 'Tiền mặt' : 'Chuyển khoản';
    };

    const totalAmountBodyTemplate = (rowData: Order) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.totalAmount);
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
                    >
                        <Column field="orderCode" header="Mã đơn" sortable style={{ minWidth: '8rem' }}></Column>
                        <Column field="customerName" header="Khách hàng" sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="customerPhone" header="SĐT" sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="totalAmount" header="Tổng tiền" body={totalAmountBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="paymentMethod" header="Thanh toán" body={paymentMethodBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="status" header="Trạng thái" body={statusBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="orderDate" header="Ngày đặt" sortable style={{ minWidth: '10rem' }}></Column>
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
                                                <p>{order.orderCode}</p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Ngày đặt:</strong>
                                                </label>
                                                <p>{order.orderDate}</p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Khách hàng:</strong>
                                                </label>
                                                <p>{order.customerName}</p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Số điện thoại:</strong>
                                                </label>
                                                <p>{order.customerPhone}</p>
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
                                                <p>{order.paymentMethod === 'cod' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Tổng tiền:</strong>
                                                </label>
                                                <p className="text-2xl text-primary font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</p>
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
