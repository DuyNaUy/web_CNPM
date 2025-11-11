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
import { Password } from 'primereact/password';
import React, { useRef, useState, useEffect } from 'react';
import { Tag } from 'primereact/tag';
import { userManagementAPI } from '../../../../services/api';

interface Account {
    id: number;
    username?: string;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    is_active: boolean;
    address?: string;
    created_at: string;
    password?: string;
    confirm_password?: string;
}

const AccountsPage = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountDialog, setAccountDialog] = useState(false);
    const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
    const [account, setAccount] = useState<Account>({
        id: 0,
        username: '',
        full_name: '',
        email: '',
        phone: '',
        role: 'customer',
        is_active: true,
        address: '',
        created_at: '',
        password: '',
        confirm_password: ''
    });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({});
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<boolean | null>(null);
    const toast = useRef<Toast>(null);

    // Load accounts on mount
    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const response = await userManagementAPI.getAll();
            console.log('API Response:', response);
            console.log('Response data:', response.data);
            console.log('Response success:', response.success);

            if (response.success && response.data) {
                console.log('Setting accounts:', response.data);
                setAccounts(response.data);
            } else {
                console.error('Response not successful:', response);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: response.message || 'Không thể tải danh sách tài khoản',
                    life: 3000
                });
            }
        } catch (error: any) {
            console.error('Load accounts error:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Có lỗi xảy ra khi tải dữ liệu',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { label: 'Quản trị viên', value: 'admin' },
        { label: 'Người bán', value: 'seller' },
        { label: 'Khách hàng', value: 'customer' }
    ];

    const filterRoles = [
        { label: 'Tất cả vai trò', value: null },
        { label: 'Quản trị viên', value: 'admin' },
        { label: 'Người bán', value: 'seller' },
        { label: 'Khách hàng', value: 'customer' }
    ];

    const statuses = [
        { label: 'Hoạt động', value: true },
        { label: 'Ngừng hoạt động', value: false }
    ];

    const filterStatuses = [
        { label: 'Tất cả trạng thái', value: null },
        { label: 'Hoạt động', value: true },
        { label: 'Ngừng hoạt động', value: false }
    ];

    const openNew = () => {
        setAccount({
            id: 0,
            username: '',
            full_name: '',
            email: '',
            phone: '',
            role: 'customer',
            is_active: true,
            address: '',
            created_at: '',
            password: '',
            confirm_password: ''
        });
        setIsEdit(false);
        setAccountDialog(true);
    };

    const hideDialog = () => {
        setAccountDialog(false);
    };

    const hideDeleteAccountDialog = () => {
        setDeleteAccountDialog(false);
    };

    const saveAccount = async () => {
        // Validation
        if (!account.full_name.trim()) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng nhập họ tên',
                life: 3000
            });
            return;
        }

        if (!account.email.trim()) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng nhập email',
                life: 3000
            });
            return;
        }

        if (!account.phone.trim()) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng nhập số điện thoại',
                life: 3000
            });
            return;
        }

        // Validation for new account (password required)
        if (!isEdit) {
            if (!account.password) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: 'Vui lòng nhập mật khẩu',
                    life: 3000
                });
                return;
            }

            if (account.password !== account.confirm_password) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: 'Mật khẩu xác nhận không khớp',
                    life: 3000
                });
                return;
            }

            if (!account.username) {
                account.username = account.email.split('@')[0];
            }
        }

        setLoading(true);
        try {
            let response;
            if (isEdit) {
                // Update existing account
                const updateData: any = {
                    full_name: account.full_name,
                    phone: account.phone,
                    role: account.role,
                    is_active: account.is_active,
                    address: account.address
                };

                response = await userManagementAPI.update(account.id, updateData);
            } else {
                // Create new account
                const createData = {
                    username: account.username,
                    email: account.email,
                    full_name: account.full_name,
                    phone: account.phone,
                    password: account.password,
                    confirm_password: account.confirm_password,
                    role: account.role,
                    address: account.address
                };

                response = await userManagementAPI.create(createData);
            }

            if (response.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: isEdit ? 'Cập nhật tài khoản thành công' : 'Thêm tài khoản thành công',
                    life: 3000
                });

                loadAccounts(); // Reload list
                hideDialog();
            } else {
                const errorDetail = response.errors ? Object.values(response.errors).flat().join(', ') : response.message || 'Có lỗi xảy ra!';

                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: errorDetail,
                    life: 5000
                });
            }
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Có lỗi xảy ra!',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const editAccount = (account: Account) => {
        setAccount({ ...account, password: '', confirm_password: '' });
        setIsEdit(true);
        setAccountDialog(true);
    };

    const confirmDeleteAccount = (account: Account) => {
        setAccount(account);
        setDeleteAccountDialog(true);
    };

    const deleteAccount = async () => {
        setLoading(true);
        try {
            const response = await userManagementAPI.delete(account.id);

            if (response.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Xóa tài khoản thành công',
                    life: 3000
                });

                loadAccounts(); // Reload list
                hideDeleteAccountDialog();
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: response.message || 'Không thể xóa tài khoản',
                    life: 3000
                });
            }
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Có lỗi xảy ra!',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
        const val = (e.target && e.target.value) || '';
        let _account = { ...account };
        (_account as any)[name] = val;
        setAccount(_account);
    };

    const onDropdownChange = (e: any, name: string) => {
        const val = e.value || '';
        let _account = { ...account };
        (_account as any)[name] = val;
        setAccount(_account);
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="Thêm mới" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: Account) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editAccount(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteAccount(rowData)} />
            </React.Fragment>
        );
    };

    const statusBodyTemplate = (rowData: Account) => {
        return <Tag value={rowData.is_active ? 'Hoạt động' : 'Ngừng'} severity={rowData.is_active ? 'success' : 'danger'} />;
    };

    const roleBodyTemplate = (rowData: Account) => {
        const roleLabels: any = {
            admin: 'Admin',
            seller: 'Người bán',
            customer: 'Khách hàng'
        };
        const roleSeverities: any = {
            admin: 'danger',
            seller: 'info',
            customer: 'warning'
        };
        return <Tag value={roleLabels[rowData.role]} severity={roleSeverities[rowData.role]} />;
    };

    const createdAtBodyTemplate = (rowData: Account) => {
        return new Date(rowData.created_at).toLocaleDateString('vi-VN');
    };

    const clearFilters = () => {
        setGlobalFilter('');
        setSelectedRole(null);
        setSelectedStatus(null);
    };

    const filteredAccounts = accounts.filter((account) => {
        // Filter by role
        if (selectedRole !== null && account.role !== selectedRole) {
            return false;
        }

        // Filter by status
        if (selectedStatus !== null && account.is_active !== selectedStatus) {
            return false;
        }

        return true;
    });

    const header = (
        <div className="flex flex-column gap-3">
            <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
                <h4 className="m-0">Quản Lý Tài Khoản</h4>
                <div className="flex gap-2">
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText type="search" placeholder="Tìm kiếm..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                    </span>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap gap-3 align-items-center">
                <div className="flex align-items-center gap-2">
                    <label htmlFor="roleFilter" className="font-semibold text-sm">
                        Vai trò:
                    </label>
                    <Dropdown id="roleFilter" value={selectedRole} options={filterRoles} onChange={(e) => setSelectedRole(e.value)} placeholder="Chọn vai trò" style={{ width: '180px' }} />
                </div>

                <div className="flex align-items-center gap-2">
                    <label htmlFor="statusFilter" className="font-semibold text-sm">
                        Trạng thái:
                    </label>
                    <Dropdown id="statusFilter" value={selectedStatus} options={filterStatuses} onChange={(e) => setSelectedStatus(e.value)} placeholder="Chọn trạng thái" style={{ width: '180px' }} />
                </div>

                {(globalFilter || selectedRole !== null || selectedStatus !== null) && <Button type="button" icon="pi pi-filter-slash" label="Xóa bộ lọc" outlined onClick={clearFilters} size="small" />}

                <div className="ml-auto">
                    <Tag value={`${filteredAccounts.length} tài khoản`} severity="info" icon="pi pi-users" />
                </div>
            </div>
        </div>
    );

    const accountDialogFooter = (
        <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} disabled={loading} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveAccount} loading={loading} disabled={loading} />
        </React.Fragment>
    );

    const deleteAccountDialogFooter = (
        <React.Fragment>
            <Button label="Không" icon="pi pi-times" outlined onClick={hideDeleteAccountDialog} disabled={loading} />
            <Button label="Có" icon="pi pi-check" severity="danger" onClick={deleteAccount} loading={loading} disabled={loading} />
        </React.Fragment>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <DataTable
                        value={filteredAccounts}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} tài khoản"
                        filters={filters}
                        globalFilter={globalFilter || null}
                        globalFilterFields={['full_name', 'email', 'phone', 'username']}
                        header={header}
                        loading={loading}
                        emptyMessage="Không tìm thấy tài khoản nào"
                    >
                        <Column field="id" header="ID" sortable style={{ minWidth: '4rem' }}></Column>
                        <Column field="full_name" header="Họ và tên" sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="email" header="Email" sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="phone" header="Số điện thoại" sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="role" header="Vai trò" body={roleBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="is_active" header="Trạng thái" body={statusBodyTemplate} sortable style={{ minWidth: '8rem' }}></Column>
                        <Column field="created_at" header="Ngày tạo" body={createdAtBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '12rem' }}></Column>
                    </DataTable>

                    <Dialog
                        visible={accountDialog}
                        style={{ width: '32rem' }}
                        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                        header={isEdit ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
                        modal
                        className="p-fluid"
                        footer={accountDialogFooter}
                        onHide={hideDialog}
                    >
                        <div className="field">
                            <label htmlFor="full_name">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <InputText id="full_name" value={account.full_name} onChange={(e) => onInputChange(e, 'full_name')} required autoFocus />
                        </div>
                        <div className="field">
                            <label htmlFor="email">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <InputText id="email" value={account.email} onChange={(e) => onInputChange(e, 'email')} required disabled={isEdit} />
                        </div>
                        <div className="field">
                            <label htmlFor="phone">
                                Số điện thoại <span className="text-red-500">*</span>
                            </label>
                            <InputText id="phone" value={account.phone} onChange={(e) => onInputChange(e, 'phone')} required maxLength={10} />
                        </div>
                        {!isEdit && (
                            <>
                                <div className="field">
                                    <label htmlFor="password">
                                        Mật khẩu <span className="text-red-500">*</span>
                                    </label>
                                    <Password id="password" value={account.password || ''} onChange={(e) => onInputChange(e, 'password')} toggleMask feedback={false} />
                                </div>
                                <div className="field">
                                    <label htmlFor="confirm_password">
                                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                                    </label>
                                    <Password id="confirm_password" value={account.confirm_password || ''} onChange={(e) => onInputChange(e, 'confirm_password')} toggleMask feedback={false} />
                                </div>
                            </>
                        )}
                        <div className="field">
                            <label htmlFor="address">Địa chỉ</label>
                            <InputText id="address" value={account.address || ''} onChange={(e) => onInputChange(e, 'address')} />
                        </div>
                        <div className="field">
                            <label htmlFor="role">
                                Vai trò <span className="text-red-500">*</span>
                            </label>
                            <Dropdown id="role" value={account.role} options={roles} onChange={(e) => onDropdownChange(e, 'role')} placeholder="Chọn vai trò" />
                        </div>
                        <div className="field">
                            <label htmlFor="is_active">
                                Trạng thái <span className="text-red-500">*</span>
                            </label>
                            <Dropdown id="is_active" value={account.is_active} options={statuses} onChange={(e) => onDropdownChange(e, 'is_active')} placeholder="Chọn trạng thái" />
                        </div>
                    </Dialog>

                    <Dialog visible={deleteAccountDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Xác nhận" modal footer={deleteAccountDialogFooter} onHide={hideDeleteAccountDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {account && (
                                <span>
                                    Bạn có chắc chắn muốn xóa tài khoản <b>{account.full_name}</b>?
                                </span>
                            )}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default AccountsPage;
