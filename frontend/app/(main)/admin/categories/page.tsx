/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useRef, useState, useEffect } from 'react';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { categoryAPI } from '@/services/api';

interface Category {
    id: number;
    name: string;
    description: string;
    status: string;
    product_count: number;
    created_at: string;
}

const CategoriesPage = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);

    const [categoryDialog, setCategoryDialog] = useState(false);
    const [deleteCategoryDialog, setDeleteCategoryDialog] = useState(false);
    const [category, setCategory] = useState<Category>({
        id: 0,
        name: '',
        description: '',
        status: 'active',
        product_count: 0,
        created_at: ''
    });
    const [globalFilter, setGlobalFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const toast = useRef<Toast>(null);

    const loadCategories = async (params: { searchText: string; status: string | null; page: number; pageSize: number }) => {
        try {
            setLoading(true);
            const response = await categoryAPI.getAll({
                search: params.searchText.trim() || undefined,
                status: params.status || undefined,
                page: params.page,
                page_size: params.pageSize
            });

            if (response.results) {
                setCategories(response.results);
                setTotalRecords(response.count || response.results.length);
            } else if (Array.isArray(response)) {
                setCategories(response);
                setTotalRecords(response.length);
            } else if (response.data && Array.isArray(response.data)) {
                setCategories(response.data);
                setTotalRecords(response.count || response.data.length);
            } else {
                setCategories([]);
                setTotalRecords(0);
            }
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể tải danh sách danh mục',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(globalFilter);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [globalFilter]);

    useEffect(() => {
        const page = Math.floor(first / rows) + 1;
        loadCategories({
            searchText: debouncedSearch,
            status: selectedStatus,
            page,
            pageSize: rows
        });
    }, [debouncedSearch, selectedStatus, first, rows]);

    const statuses = [
        { label: 'Hoạt động', value: 'active' },
        { label: 'Ngừng hoạt động', value: 'inactive' }
    ];

    const filterStatuses = [
        { label: 'Tất cả trạng thái', value: null },
        { label: 'Hoạt động', value: 'active' },
        { label: 'Ngừng hoạt động', value: 'inactive' }
    ];

    const clearFilters = () => {
        setGlobalFilter('');
        setSelectedStatus(null);
        setFirst(0);
    };

    const handleSearchChange = (value: string) => {
        setGlobalFilter(value);
        setFirst(0);
    };

    const handleStatusChange = (value: string | null) => {
        setSelectedStatus(value);
        setFirst(0);
    };

    const handlePageChange = (event: any) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    const reloadCurrentPage = async () => {
        const page = Math.floor(first / rows) + 1;
        await loadCategories({
            searchText: debouncedSearch,
            status: selectedStatus,
            page,
            pageSize: rows
        });
    };

    const openNew = () => {
        setCategory({
            id: 0,
            name: '',
            description: '',
            status: 'active',
            product_count: 0,
            created_at: ''
        });
        setCategoryDialog(true);
    };

    const hideDialog = () => {
        setCategoryDialog(false);
    };

    const hideDeleteCategoryDialog = () => {
        setDeleteCategoryDialog(false);
    };

    const saveCategory = async () => {
        if (category.name.trim()) {
            try {
                setLoading(true);

                let response: any;

                if (category.id) {
                    // Update existing category
                    response = await categoryAPI.update(category.id, {
                        name: category.name,
                        description: category.description,
                        status: category.status
                    });
                } else {
                    // Create new category
                    response = await categoryAPI.create({
                        name: category.name,
                        description: category.description,
                        status: category.status
                    });
                }

                const backendError = response?.error || response?.detail || (response?.success === false ? response?.message : null);
                const isFailed = !!(response?.error || response?.detail || response?.success === false);

                if (isFailed) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: backendError || 'Không thể lưu danh mục',
                        life: 5000
                    });
                    return;
                }

                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: response?.message || (category.id ? 'Cập nhật danh mục thành công' : 'Thêm danh mục thành công'),
                    life: 3000
                });

                // Reload categories list
                await reloadCurrentPage();
                setCategoryDialog(false);
                setCategory({
                    id: 0,
                    name: '',
                    description: '',
                    status: 'active',
                    product_count: 0,
                    created_at: ''
                });
            } catch (error: any) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: error.message || 'Có lỗi xảy ra khi lưu danh mục',
                    life: 3000
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const editCategory = (category: Category) => {
        setCategory({ ...category });
        setCategoryDialog(true);
    };

    const confirmDeleteCategory = (category: Category) => {
        setCategory(category);
        setDeleteCategoryDialog(true);
    };

    const deleteCategory = async () => {
        try {
            setLoading(true);
            const response = await categoryAPI.delete(category.id);

            // API wrapper có thể trả JSON lỗi cho non-2xx, nên cần bắt đủ key lỗi phổ biến.
            const backendError = response?.error || response?.detail || response?.message;
            const isFailed = !!(response?.error || response?.detail || response?.success === false);

            if (isFailed) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: backendError || 'Không thể xóa danh mục',
                    life: 5000
                });
                setDeleteCategoryDialog(false);
                return;
            }

            // Thành công
            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: response.message || 'Xóa danh mục thành công',
                life: 3000
            });

            if (categories.length === 1 && first > 0) {
                setFirst(Math.max(first - rows, 0));
            } else {
                await reloadCurrentPage();
            }
            setDeleteCategoryDialog(false);
            setCategory({
                id: 0,
                name: '',
                description: '',
                status: 'active',
                product_count: 0,
                created_at: ''
            });
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể xóa danh mục',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: string) => {
        const val = (e.target && e.target.value) || '';
        let _category = { ...category };
        (_category as any)[name] = val;
        setCategory(_category);
    };

    const onDropdownChange = (e: any, name: string) => {
        const val = e.value || '';
        let _category = { ...category };
        (_category as any)[name] = val;
        setCategory(_category);
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="Thêm mới" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: Category) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editCategory(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteCategory(rowData)} />
            </React.Fragment>
        );
    };

    const statusBodyTemplate = (rowData: Category) => {
        return <Tag value={rowData.status === 'active' ? 'Hoạt động' : 'Ngừng'} severity={rowData.status === 'active' ? 'success' : 'danger'} />;
    };

    const header = (
        <div className="flex flex-column gap-3">
            <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
                <h4 className="m-0">Quản Lý Danh Mục</h4>
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" placeholder="Tìm kiếm nhanh..." value={globalFilter} onChange={(e) => handleSearchChange(e.target.value)} />
                </span>
            </div>

            <div className="flex flex-wrap gap-3 align-items-center">
                <div className="flex align-items-center gap-2">
                    <label htmlFor="statusFilter" className="font-semibold text-sm">
                        Trạng thái:
                    </label>
                    <Dropdown id="statusFilter" value={selectedStatus} options={filterStatuses} onChange={(e) => handleStatusChange(e.value)} placeholder="Chọn trạng thái" style={{ width: '180px' }} />
                </div>

                {(globalFilter || selectedStatus !== null) && <Button type="button" icon="pi pi-filter-slash" label="Xóa bộ lọc" outlined onClick={clearFilters} size="small" />}

                <div className="ml-auto">
                    <Tag value={`${totalRecords} danh mục`} severity="info" icon="pi pi-tags" />
                </div>
            </div>
        </div>
    );

    const categoryDialogFooter = (
        <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveCategory} />
        </React.Fragment>
    );

    const deleteCategoryDialogFooter = (
        <React.Fragment>
            <Button label="Không" icon="pi pi-times" outlined onClick={hideDeleteCategoryDialog} />
            <Button label="Có" icon="pi pi-check" severity="danger" onClick={deleteCategory} />
        </React.Fragment>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <DataTable
                        value={categories}
                        dataKey="id"
                        lazy
                        paginator
                        first={first}
                        rows={rows}
                        totalRecords={totalRecords}
                        onPage={handlePageChange}
                        rowsPerPageOptions={[5, 10, 25]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} danh mục"
                        header={header}
                        loading={loading}
                    >
                        <Column field="id" header="ID" sortable style={{ minWidth: '4rem' }}></Column>
                        <Column field="name" header="Tên danh mục" sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="description" header="Mô tả" sortable style={{ minWidth: '16rem' }}></Column>
                        <Column field="product_count" header="Số sản phẩm" sortable style={{ minWidth: '8rem' }}></Column>
                        <Column field="status" header="Trạng thái" body={statusBodyTemplate} sortable style={{ minWidth: '8rem' }}></Column>
                        <Column field="created_at" header="Ngày tạo" sortable style={{ minWidth: '10rem' }} body={(rowData) => new Date(rowData.created_at).toLocaleDateString('vi-VN')}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '12rem' }}></Column>
                    </DataTable>

                    <Dialog visible={categoryDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Thông tin danh mục" modal className="p-fluid" footer={categoryDialogFooter} onHide={hideDialog}>
                        <div className="field">
                            <label htmlFor="name">Tên danh mục</label>
                            <InputText id="name" value={category.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus />
                        </div>
                        <div className="field">
                            <label htmlFor="description">Mô tả</label>
                            <InputTextarea id="description" value={category.description} onChange={(e) => onInputChange(e, 'description')} rows={3} />
                        </div>
                        <div className="field">
                            <label htmlFor="status">Trạng thái</label>
                            <Dropdown id="status" value={category.status} options={statuses} onChange={(e) => onDropdownChange(e, 'status')} placeholder="Chọn trạng thái" />
                        </div>
                    </Dialog>

                    <Dialog visible={deleteCategoryDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Xác nhận" modal footer={deleteCategoryDialogFooter} onHide={hideDeleteCategoryDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {category && (
                                <span>
                                    Bạn có chắc chắn muốn xóa danh mục <b>{category.name}</b>?
                                </span>
                            )}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default CategoriesPage;
