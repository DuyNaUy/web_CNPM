/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { FileUpload, FileUploadUploadEvent, FileUploadHeaderTemplateOptions } from 'primereact/fileupload';
import { Image } from 'primereact/image';
import { TabView, TabPanel } from 'primereact/tabview';
import { Checkbox } from 'primereact/checkbox';
import React, { useRef, useState, useEffect } from 'react';
import { Tag } from 'primereact/tag';
import { productAPI, categoryAPI } from '@/services/api';
import { ProgressBar } from 'primereact/progressbar';

interface ProductImage {
    id: number;
    image: string;
    image_url: string;
    is_main: boolean;
    order: number;
}

interface Product {
    id: number;
    name: string;
    slug?: string;
    category: number;
    category_name?: string;
    price: number;
    old_price?: number;
    stock: number;
    unit: string;
    rating?: number;
    reviews_count?: number;
    sold_count?: number;
    description: string;
    detail_description?: string;
    main_image?: string;
    main_image_url?: string;
    images?: string;
    product_images?: ProductImage[];
    specifications?: string;
    origin?: string;
    weight?: string;
    preservation?: string;
    expiry?: string;
    certification?: string;
    status: string;
    is_featured?: boolean;
    created_at?: string;
    updated_at?: string;
}

interface Category {
    id: number;
    name: string;
    status?: string;
}

const ProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [productDialog, setProductDialog] = useState(false);
    const [deleteProductDialog, setDeleteProductDialog] = useState(false);
    const [product, setProduct] = useState<Product>({
        id: 0,
        name: '',
        category: 0,
        price: 0,
        old_price: 0,
        stock: 0,
        unit: 'kg',
        status: 'active',
        description: '',
        detail_description: '',
        origin: '',
        weight: '',
        preservation: '',
        expiry: '',
        certification: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [additionalImages, setAdditionalImages] = useState<File[]>([]);
    const [productImages, setProductImages] = useState<ProductImage[]>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [totalRecords, setTotalRecords] = useState(0);
    const toast = useRef<Toast>(null);
    const fileUploadRef = useRef<FileUpload>(null);
    const galleryUploadRef = useRef<FileUpload>(null);

    const units = [
        { label: 'Kg', value: 'kg' },
        { label: 'Gram', value: 'gram' },
        { label: 'Gói', value: 'gói' },
        { label: 'Hộp', value: 'hộp' },
        { label: 'Chai', value: 'chai' },
        { label: 'Túi', value: 'túi' },
        { label: 'Thùng', value: 'thùng' }
    ];

    const statuses = [
        { label: 'Đang bán', value: 'active' },
        { label: 'Ngừng bán', value: 'inactive' }
    ];

    // Load data once on mount
    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await productAPI.getAll({ page_size: 1000 });

            if (response.results) {
                setProducts(response.results);
                setTotalRecords(response.count || response.results.length);
            } else if (Array.isArray(response)) {
                setProducts(response);
                setTotalRecords(response.length);
            } else if (response.data) {
                // Handle wrapped response
                setProducts(Array.isArray(response.data) ? response.data : []);
                setTotalRecords(response.data.length || 0);
            }
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể tải danh sách sản phẩm',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setGlobalFilter('');
        setSelectedCategory(null);
        setSelectedStatus(null);
    };

    // Client-side filtering
    const filteredProducts = products.filter((product) => {
        // Filter by category
        if (selectedCategory !== null && product.category !== selectedCategory) {
            return false;
        }

        // Filter by status
        if (selectedStatus !== null && product.status !== selectedStatus) {
            return false;
        }

        // Filter by search text (name, description, category_name)
        if (globalFilter) {
            const searchLower = globalFilter.toLowerCase();
            const matchName = product.name.toLowerCase().includes(searchLower);
            const matchDescription = product.description?.toLowerCase().includes(searchLower);
            const matchCategory = product.category_name?.toLowerCase().includes(searchLower);

            if (!matchName && !matchDescription && !matchCategory) {
                return false;
            }
        }

        return true;
    });

    const loadCategories = async () => {
        try {
            const response = await categoryAPI.getActive();
            if (response.results) {
                setCategories(response.results);
            } else if (Array.isArray(response)) {
                setCategories(response);
            }
        } catch (error: any) {
            console.error('Error loading categories:', error);
        }
    };

    const openNew = () => {
        setProduct({
            id: 0,
            name: '',
            category: 0,
            price: 0,
            old_price: 0,
            stock: 0,
            unit: 'kg',
            status: 'active',
            description: '',
            detail_description: '',
            origin: '',
            weight: '',
            preservation: '',
            expiry: '',
            certification: ''
        });
        setSelectedFile(null);
        setPreviewImage(null);
        setAdditionalImages([]);
        setProductImages([]);
        setProductDialog(true);
    };

    const hideDialog = () => {
        setProductDialog(false);
        setSelectedFile(null);
        setPreviewImage(null);
        setAdditionalImages([]);
        setProductImages([]);
    };

    const hideDeleteProductDialog = () => {
        setDeleteProductDialog(false);
    };

    const saveProduct = async () => {
        if (!product.name.trim()) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng nhập tên sản phẩm',
                life: 3000
            });
            return;
        }

        if (!product.category) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng chọn danh mục',
                life: 3000
            });
            return;
        }

        if (product.price <= 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Giá sản phẩm phải lớn hơn 0',
                life: 3000
            });
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('name', product.name);
            formData.append('category', product.category.toString());
            formData.append('price', product.price.toString());
            formData.append('stock', product.stock.toString());
            formData.append('unit', product.unit);
            formData.append('status', product.status);
            formData.append('description', product.description || '');

            if (product.old_price && product.old_price > 0) {
                formData.append('old_price', product.old_price.toString());
            }
            if (product.detail_description) {
                formData.append('detail_description', product.detail_description);
            }
            if (product.origin) formData.append('origin', product.origin);
            if (product.weight) formData.append('weight', product.weight);
            if (product.preservation) formData.append('preservation', product.preservation);
            if (product.expiry) formData.append('expiry', product.expiry);
            if (product.certification) formData.append('certification', product.certification);

            if (selectedFile) {
                formData.append('main_image', selectedFile);
            }

            if (product.id) {
                // Update existing product
                const response = await productAPI.update(product.id, formData);
                if (response.data || response.success) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Thành công',
                        detail: 'Cập nhật sản phẩm thành công',
                        life: 3000
                    });
                }
            } else {
                // Create new product
                const response = await productAPI.create(formData);
                if (response.data || response.success) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Thành công',
                        detail: 'Thêm sản phẩm thành công',
                        life: 3000
                    });
                }
            }

            // Reload products list
            await loadProducts();
            hideDialog();
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Có lỗi xảy ra khi lưu sản phẩm',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const editProduct = async (product: Product) => {
        try {
            setLoading(true);
            // Fetch full product details from API
            const response = await productAPI.getById(product.id);

            let fullProduct: Product;
            if (response.data) {
                fullProduct = response.data;
            } else {
                fullProduct = response;
            }

            // Ensure all fields have default values to avoid undefined
            setProduct({
                ...fullProduct,
                old_price: fullProduct.old_price || 0,
                detail_description: fullProduct.detail_description || '',
                origin: fullProduct.origin || '',
                weight: fullProduct.weight || '',
                preservation: fullProduct.preservation || '',
                expiry: fullProduct.expiry || '',
                certification: fullProduct.certification || ''
            });

            setPreviewImage(fullProduct.main_image_url || null);
            setSelectedFile(null);
            setProductImages(fullProduct.product_images || []);
            setAdditionalImages([]);
            setProductDialog(true);
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể tải thông tin sản phẩm',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteProduct = (product: Product) => {
        setProduct(product);
        setDeleteProductDialog(true);
    };

    const deleteProduct = async () => {
        try {
            setLoading(true);
            await productAPI.delete(product.id);
            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Xóa sản phẩm thành công',
                life: 3000
            });
            // Reload products list
            await loadProducts();
            hideDeleteProductDialog();
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể xóa sản phẩm',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: string) => {
        const val = (e.target && e.target.value) || '';
        let _product = { ...product };
        (_product as any)[name] = val;
        setProduct(_product);
    };

    const onNumberChange = (value: number | null | undefined, name: string) => {
        let _product = { ...product };
        (_product as any)[name] = value || 0;
        setProduct(_product);
    };

    const onDropdownChange = (e: any, name: string) => {
        const val = e.value;
        let _product = { ...product };
        (_product as any)[name] = val;
        setProduct(_product);
    };

    const onFileSelect = (e: any) => {
        const file = e.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (event: any) => {
                setPreviewImage(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onFileRemove = () => {
        setSelectedFile(null);
        setPreviewImage(product.main_image_url || null);
    };

    const onGallerySelect = (e: any) => {
        const files = e.files;
        if (files && files.length > 0) {
            setAdditionalImages([...additionalImages, ...files]);
        }
    };

    const onGalleryRemove = (index: number) => {
        const newImages = [...additionalImages];
        newImages.splice(index, 1);
        setAdditionalImages(newImages);
    };

    const uploadGalleryImages = async () => {
        if (!product.id || additionalImages.length === 0) return;

        try {
            setLoading(true);
            await productAPI.addImages(product.id, additionalImages);

            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã tải lên ${additionalImages.length} ảnh`,
                life: 3000
            });

            // Reload product images
            const response = await productAPI.getById(product.id);
            const fullProduct = response.data || response;
            setProductImages(fullProduct.product_images || []);
            setAdditionalImages([]);
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể tải ảnh lên',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteProductImage = async (imageId: number) => {
        if (!product.id) return;

        try {
            setLoading(true);
            await productAPI.deleteImage(product.id, imageId);

            // Remove from UI
            setProductImages(productImages.filter((img) => img.id !== imageId));

            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đã xóa ảnh',
                life: 3000
            });
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể xóa ảnh',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="Thêm mới" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: Product) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editProduct(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteProduct(rowData)} />
            </React.Fragment>
        );
    };

    const statusBodyTemplate = (rowData: Product) => {
        const statusMap: { [key: string]: { label: string; severity: any } } = {
            active: { label: 'Đang bán', severity: 'success' },
            inactive: { label: 'Ngừng bán', severity: 'danger' }
        };
        const status = statusMap[rowData.status] || statusMap['active'];
        return <Tag value={status.label} severity={status.severity} />;
    };

    const priceBodyTemplate = (rowData: Product) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.price);
    };

    const stockBodyTemplate = (rowData: Product) => {
        return <span className={rowData.stock < 50 ? 'text-orange-500 font-bold' : ''}>{rowData.stock}</span>;
    };

    const imageBodyTemplate = (rowData: Product) => {
        return rowData.main_image_url ? (
            <img src={rowData.main_image_url} alt={rowData.name} className="shadow-2 border-round" style={{ width: '64px', height: '64px', objectFit: 'cover' }} />
        ) : (
            <div className="flex align-items-center justify-content-center border-round" style={{ width: '64px', height: '64px', background: '#f8f9fa' }}>
                <i className="pi pi-image" style={{ fontSize: '2rem', color: '#dee2e6' }}></i>
            </div>
        );
    };

    const header = (
        <div className="flex flex-column gap-3">
            <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
                <h4 className="m-0">Quản Lý Sản Phẩm</h4>
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
                    <label htmlFor="categoryFilter" className="font-semibold text-sm">
                        Danh mục:
                    </label>
                    <Dropdown
                        id="categoryFilter"
                        value={selectedCategory}
                        options={[{ label: 'Tất cả danh mục', value: null }, ...categories.map((cat) => ({ label: cat.name, value: cat.id }))]}
                        onChange={(e) => setSelectedCategory(e.value)}
                        placeholder="Chọn danh mục"
                        style={{ width: '200px' }}
                    />
                </div>

                <div className="flex align-items-center gap-2">
                    <label htmlFor="statusFilter" className="font-semibold text-sm">
                        Trạng thái:
                    </label>
                    <Dropdown
                        id="statusFilter"
                        value={selectedStatus}
                        options={[
                            { label: 'Tất cả trạng thái', value: null },
                            { label: 'Đang bán', value: 'active' },
                            { label: 'Ngừng bán', value: 'inactive' }
                        ]}
                        onChange={(e) => setSelectedStatus(e.value)}
                        placeholder="Chọn trạng thái"
                        style={{ width: '180px' }}
                    />
                </div>

                {(globalFilter || selectedCategory !== null || selectedStatus !== null) && <Button type="button" icon="pi pi-filter-slash" label="Xóa bộ lọc" outlined onClick={clearFilters} size="small" />}

                <div className="ml-auto">
                    <Tag value={`${filteredProducts.length} sản phẩm`} severity="info" icon="pi pi-box" />
                </div>
            </div>
        </div>
    );

    const productDialogFooter = (
        <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveProduct} />
        </React.Fragment>
    );

    const deleteProductDialogFooter = (
        <React.Fragment>
            <Button label="Không" icon="pi pi-times" outlined onClick={hideDeleteProductDialog} />
            <Button label="Có" icon="pi pi-check" severity="danger" onClick={deleteProduct} />
        </React.Fragment>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <DataTable
                        value={filteredProducts}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} sản phẩm"
                        header={header}
                        loading={loading}
                        emptyMessage="Không tìm thấy sản phẩm nào"
                    >
                        <Column field="id" header="ID" sortable style={{ minWidth: '4rem' }}></Column>
                        <Column header="Hình ảnh" body={imageBodyTemplate} style={{ minWidth: '8rem' }}></Column>
                        <Column field="name" header="Tên sản phẩm" sortable style={{ minWidth: '14rem' }}></Column>
                        <Column field="category_name" header="Danh mục" sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="price" header="Giá" body={priceBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="stock" header="Tồn kho" body={stockBodyTemplate} sortable style={{ minWidth: '8rem' }}></Column>
                        <Column field="status" header="Trạng thái" body={statusBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '12rem' }}></Column>
                    </DataTable>

                    <Dialog visible={productDialog} style={{ width: '70rem' }} breakpoints={{ '960px': '90vw', '641px': '95vw' }} header="Thông tin sản phẩm" modal className="p-fluid" footer={productDialogFooter} onHide={hideDialog}>
                        <TabView>
                            <TabPanel header="Thông tin cơ bản">
                                <div className="grid">
                                    <div className="col-12 md:col-6">
                                        <div className="field">
                                            <label htmlFor="name" className="font-semibold">
                                                Tên sản phẩm <span className="text-red-500">*</span>
                                            </label>
                                            <InputText id="name" value={product.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={!product.name.trim() ? 'p-invalid' : ''} />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="category" className="font-semibold">
                                                Danh mục <span className="text-red-500">*</span>
                                            </label>
                                            <Dropdown
                                                id="category"
                                                value={product.category}
                                                options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
                                                onChange={(e) => onDropdownChange(e, 'category')}
                                                placeholder="Chọn danh mục"
                                                className={!product.category ? 'p-invalid' : ''}
                                            />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="price" className="font-semibold">
                                                Giá bán (VNĐ) <span className="text-red-500">*</span>
                                            </label>
                                            <InputNumber id="price" value={product.price} onValueChange={(e) => onNumberChange(e.value, 'price')} mode="currency" currency="VND" locale="vi-VN" className={product.price <= 0 ? 'p-invalid' : ''} />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="old_price" className="font-semibold">
                                                Giá cũ (VNĐ)
                                            </label>
                                            <InputNumber id="old_price" value={product.old_price} onValueChange={(e) => onNumberChange(e.value, 'old_price')} mode="currency" currency="VND" locale="vi-VN" />
                                            <small className="text-500">Để trống nếu không có giá khuyến mãi</small>
                                        </div>

                                        <div className="field">
                                            <label htmlFor="stock" className="font-semibold">
                                                Số lượng tồn kho
                                            </label>
                                            <InputNumber id="stock" value={product.stock} onValueChange={(e) => onNumberChange(e.value, 'stock')} min={0} />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="unit" className="font-semibold">
                                                Đơn vị tính
                                            </label>
                                            <Dropdown id="unit" value={product.unit} options={units} onChange={(e) => onDropdownChange(e, 'unit')} placeholder="Chọn đơn vị" />
                                        </div>
                                    </div>

                                    <div className="col-12 md:col-6">
                                        <div className="field">
                                            <label className="font-semibold">Hình ảnh sản phẩm</label>
                                            {previewImage ? (
                                                <div className="flex flex-column align-items-center">
                                                    <Image src={previewImage} alt="Preview" width="300" preview />
                                                    <Button label="Xóa hình ảnh" icon="pi pi-times" className="p-button-danger p-button-sm mt-2" onClick={onFileRemove} type="button" />
                                                </div>
                                            ) : (
                                                <FileUpload ref={fileUploadRef} mode="basic" name="image" accept="image/*" maxFileSize={5000000} onSelect={onFileSelect} chooseLabel="Chọn hình ảnh" className="w-full" auto />
                                            )}
                                            <small className="block mt-2 text-500">Định dạng: JPG, PNG, GIF. Kích thước tối đa: 5MB</small>
                                        </div>

                                        <div className="field">
                                            <label htmlFor="status" className="font-semibold">
                                                Trạng thái
                                            </label>
                                            <Dropdown id="status" value={product.status} options={statuses} onChange={(e) => onDropdownChange(e, 'status')} placeholder="Chọn trạng thái" />
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div className="field">
                                            <label htmlFor="description" className="font-semibold">
                                                Mô tả ngắn
                                            </label>
                                            <InputTextarea id="description" value={product.description} onChange={(e) => onInputChange(e, 'description')} rows={3} />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="detail_description" className="font-semibold">
                                                Mô tả chi tiết
                                            </label>
                                            <InputTextarea id="detail_description" value={product.detail_description} onChange={(e) => onInputChange(e, 'detail_description')} rows={5} />
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>

                            <TabPanel header="Thông tin chi tiết">
                                <div className="grid">
                                    <div className="col-12 md:col-6">
                                        <div className="field">
                                            <label htmlFor="origin" className="font-semibold">
                                                Xuất xứ
                                            </label>
                                            <InputText id="origin" value={product.origin} onChange={(e) => onInputChange(e, 'origin')} placeholder="VD: Việt Nam, Nhật Bản..." />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="weight" className="font-semibold">
                                                Trọng lượng
                                            </label>
                                            <InputText id="weight" value={product.weight} onChange={(e) => onInputChange(e, 'weight')} placeholder="VD: 500g, 1kg..." />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="preservation" className="font-semibold">
                                                Cách bảo quản
                                            </label>
                                            <InputTextarea id="preservation" value={product.preservation} onChange={(e) => onInputChange(e, 'preservation')} rows={3} placeholder="VD: Bảo quản trong ngăn mát tủ lạnh..." />
                                        </div>
                                    </div>

                                    <div className="col-12 md:col-6">
                                        <div className="field">
                                            <label htmlFor="expiry" className="font-semibold">
                                                Hạn sử dụng
                                            </label>
                                            <InputText id="expiry" value={product.expiry} onChange={(e) => onInputChange(e, 'expiry')} placeholder="VD: 7 ngày, 30 ngày..." />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="certification" className="font-semibold">
                                                Chứng nhận
                                            </label>
                                            <InputTextarea id="certification" value={product.certification} onChange={(e) => onInputChange(e, 'certification')} rows={3} placeholder="VD: HACCP, VietGAP, Organic..." />
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>

                            <TabPanel header="Thư viện ảnh">
                                <div className="grid">
                                    {product.id > 0 ? (
                                        <>
                                            <div className="col-12">
                                                <h5 className="mb-3">Ảnh hiện tại ({productImages.length})</h5>
                                                {productImages.length > 0 ? (
                                                    <div className="grid">
                                                        {productImages.map((img, index) => (
                                                            <div key={img.id} className="col-6 md:col-4 lg:col-3">
                                                                <div className="border-1 border-300 border-round p-2 relative">
                                                                    <Image src={img.image_url} alt={`Product image ${index + 1}`} width="100%" preview />
                                                                    <Button
                                                                        icon="pi pi-times"
                                                                        className="p-button-rounded p-button-danger p-button-sm absolute"
                                                                        style={{ top: '5px', right: '5px' }}
                                                                        onClick={() => deleteProductImage(img.id)}
                                                                        type="button"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-500">Chưa có ảnh phụ nào</p>
                                                )}
                                            </div>

                                            <div className="col-12">
                                                <hr className="my-4" />
                                                <h5 className="mb-3">Thêm ảnh mới</h5>
                                                <div className="field">
                                                    <FileUpload
                                                        ref={galleryUploadRef}
                                                        name="images"
                                                        multiple
                                                        accept="image/*"
                                                        maxFileSize={5000000}
                                                        onSelect={onGallerySelect}
                                                        emptyTemplate={<p className="m-0">Kéo thả ảnh vào đây hoặc click để chọn nhiều ảnh.</p>}
                                                        chooseLabel="Chọn ảnh"
                                                        uploadLabel="Tải lên"
                                                        cancelLabel="Hủy"
                                                        auto={false}
                                                    />
                                                    <small className="block mt-2 text-500">Có thể chọn nhiều ảnh. Định dạng: JPG, PNG, GIF. Kích thước tối đa: 5MB/ảnh</small>
                                                </div>

                                                {additionalImages.length > 0 && (
                                                    <>
                                                        <h6 className="mb-3">Ảnh đã chọn ({additionalImages.length})</h6>
                                                        <div className="grid">
                                                            {additionalImages.map((file, index) => (
                                                                <div key={index} className="col-6 md:col-4 lg:col-3">
                                                                    <div className="border-1 border-300 border-round p-2 relative">
                                                                        <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} style={{ width: '100%', height: 'auto' }} />
                                                                        <Button
                                                                            icon="pi pi-times"
                                                                            className="p-button-rounded p-button-danger p-button-sm absolute"
                                                                            style={{ top: '5px', right: '5px' }}
                                                                            onClick={() => onGalleryRemove(index)}
                                                                            type="button"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <Button label={`Tải lên ${additionalImages.length} ảnh`} icon="pi pi-upload" className="mt-3" onClick={uploadGalleryImages} loading={loading} />
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="col-12">
                                            <div className="p-4 text-center bg-gray-50 border-round">
                                                <i className="pi pi-info-circle text-4xl mb-3 text-gray-400"></i>
                                                <p className="text-gray-600 m-0">Vui lòng lưu sản phẩm trước khi thêm ảnh phụ</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabPanel>
                        </TabView>
                    </Dialog>

                    <Dialog visible={deleteProductDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Xác nhận" modal footer={deleteProductDialogFooter} onHide={hideDeleteProductDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {product && (
                                <span>
                                    Bạn có chắc chắn muốn xóa sản phẩm <b>{product.name}</b>?
                                </span>
                            )}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;
