/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { DataView } from 'primereact/dataview';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Rating } from 'primereact/rating';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Sidebar } from 'primereact/sidebar';
import { Skeleton } from 'primereact/skeleton';
import { Paginator } from 'primereact/paginator';
import React, { useRef, useState, useEffect } from 'react';
import { classNames } from 'primereact/utils';
import { productAPI, categoryAPI } from '@/services/api';

interface Category {
    id: number;
    name: string;
    description: string;
    status: string;
    product_count: number;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    category: number;
    category_name: string;
    price: number;
    old_price: number | null;
    discount_percentage: number;
    stock: number;
    unit: string;
    rating: number;
    reviews_count: number;
    sold_count: number;
    description: string;
    main_image: string | null;
    main_image_url: string | null;
    status: string;
    in_stock: boolean;
}

const ProductsPage = () => {
    const [allProducts, setAllProducts] = useState<Product[]>([]); // Lưu tất cả sản phẩm
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]); // Sản phẩm sau khi filter
    const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]); // Sản phẩm hiển thị trên trang hiện tại
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortKey, setSortKey] = useState<string>('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [categoryVisible, setCategoryVisible] = useState(true);
    const [cart, setCart] = useState<{ [key: number]: number }>({});
    const [loading, setLoading] = useState(false);
    const [first, setFirst] = useState(0);
    const [rowsPerPage] = useState(12);
    const toast = useRef<Toast>(null);

    const sortOptions = [
        { label: 'Mới nhất', value: 'newest' },
        { label: 'Giá: Thấp đến cao', value: 'price-asc' },
        { label: 'Giá: Cao đến thấp', value: 'price-desc' },
        { label: 'Đánh giá cao nhất', value: 'rating' },
        { label: 'Bán chạy nhất', value: 'sold' },
        { label: 'Tên: A-Z', value: 'name' }
    ];

    // Load tất cả dữ liệu một lần khi component mount
    useEffect(() => {
        loadAllData();
    }, []);

    // Load categories và products
    const loadAllData = async () => {
        setLoading(true);
        try {
            // Load categories
            const categoriesResponse = await categoryAPI.getActive();
            if (categoriesResponse && Array.isArray(categoriesResponse)) {
                setCategories(categoriesResponse);
            }

            // Load tất cả products (không phân trang)
            const productsResponse = await productAPI.getAll({
                status: 'active',
                page_size: 1000 // Lấy tất cả sản phẩm
            });

            if (productsResponse && productsResponse.results) {
                setAllProducts(productsResponse.results);
                setFilteredProducts(productsResponse.results);
            } else if (Array.isArray(productsResponse)) {
                setAllProducts(productsResponse);
                setFilteredProducts(productsResponse);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối server.',
                life: 5000
            });
            setAllProducts([]);
            setFilteredProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter và sort products khi các điều kiện thay đổi
    useEffect(() => {
        filterAndSortProducts();
    }, [selectedCategory, searchTerm, sortKey, allProducts]);

    // Cập nhật displayed products khi filteredProducts hoặc pagination thay đổi
    useEffect(() => {
        updateDisplayedProducts();
    }, [filteredProducts, first, rowsPerPage]);

    const filterAndSortProducts = () => {
        let filtered = [...allProducts];

        // Filter by category
        if (selectedCategory !== null) {
            filtered = filtered.filter((p) => p.category === selectedCategory);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchLower) || p.description.toLowerCase().includes(searchLower) || p.category_name.toLowerCase().includes(searchLower));
        }

        // Sort
        if (sortKey) {
            filtered.sort((a, b) => {
                switch (sortKey) {
                    case 'price-asc':
                        return a.price - b.price;
                    case 'price-desc':
                        return b.price - a.price;
                    case 'rating':
                        return b.rating - a.rating;
                    case 'sold':
                        return b.sold_count - a.sold_count;
                    case 'name':
                        return a.name.localeCompare(b.name, 'vi');
                    case 'newest':
                    default:
                        // Giả sử sản phẩm có id lớn hơn là mới hơn
                        return b.id - a.id;
                }
            });
        }

        setFilteredProducts(filtered);
        setFirst(0); // Reset về trang đầu khi filter thay đổi
    };

    const updateDisplayedProducts = () => {
        const startIndex = first;
        const endIndex = first + rowsPerPage;
        setDisplayedProducts(filteredProducts.slice(startIndex, endIndex));
    };

    const addToCart = (product: Product) => {
        setCart((prev) => ({
            ...prev,
            [product.id]: (prev[product.id] || 0) + 1
        }));
        toast.current?.show({
            severity: 'success',
            summary: 'Đã thêm vào giỏ',
            detail: `${product.name} đã được thêm vào giỏ hàng`,
            life: 3000
        });
    };

    const onPageChange = (event: any) => {
        setFirst(event.first);
    };

    const itemTemplate = (product: Product) => {
        const imageUrl = product.main_image_url || product.main_image || '/demo/images/product/placeholder.png';
        const hasDiscount = product.old_price && product.old_price > product.price;

        return (
            <div className="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
                <div className="product-card p-4 border-1 surface-border surface-card border-round h-full hover:shadow-3 transition-all transition-duration-300">
                    <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <Tag value={product.category_name} severity="info" className="text-sm"></Tag>
                        {hasDiscount && <Tag value={`-${product.discount_percentage}%`} severity="danger" className="text-sm"></Tag>}
                        {!product.in_stock && <Tag value="Hết hàng" severity="warning" className="text-sm"></Tag>}
                    </div>

                    <div className="product-image-container mb-3 relative">
                        <img src={imageUrl} alt={product.name} className="product-image w-full border-round" style={{ height: '220px', objectFit: 'cover' }} />
                    </div>

                    <div className="product-info">
                        <div className="text-xl font-bold text-900 mb-2" style={{ minHeight: '2.5rem' }}>
                            {product.name}
                        </div>
                        <div className="text-sm text-600 mb-3 line-height-3" style={{ minHeight: '3rem' }}>
                            {product.description.length > 60 ? product.description.substring(0, 60) + '...' : product.description}
                        </div>

                        <div className="flex align-items-center gap-2 mb-3">
                            <Rating value={product.rating} readOnly cancel={false} className="text-sm" />
                            <span className="text-sm text-600">({product.reviews_count})</span>
                            <span className="text-sm text-500">• Đã bán: {product.sold_count}</span>
                        </div>

                        <div className="flex align-items-end justify-content-between mb-3">
                            <div>
                                {hasDiscount && <div className="text-sm text-500 line-through mb-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.old_price!)}</div>}
                                <div className="text-2xl font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</div>
                            </div>
                            <div className="text-sm text-600">
                                Còn:{' '}
                                <span className={classNames('font-semibold', { 'text-900': product.stock > 50, 'text-orange-500': product.stock <= 50 && product.stock > 0, 'text-red-500': product.stock === 0 })}>
                                    {product.stock} {product.unit}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button label="Chi tiết" icon="pi pi-eye" className="flex-1 p-button-outlined" onClick={() => (window.location.href = `/customer/products/${product.slug}`)} />
                            <Button icon="pi pi-shopping-cart" className="p-button-rounded" disabled={!product.in_stock} onClick={() => addToCart(product)} tooltip="Thêm vào giỏ" tooltipOptions={{ position: 'top' }} />
                        </div>

                        {cart[product.id] && (
                            <div className="mt-2 text-center">
                                <Tag value={`Trong giỏ: ${cart[product.id]}`} severity="success" className="w-full"></Tag>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const skeletonTemplate = () => {
        return (
            <div className="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
                <div className="product-card p-4 border-1 surface-border surface-card border-round h-full">
                    <div className="mb-3">
                        <Skeleton width="100%" height="220px" />
                    </div>
                    <Skeleton width="100%" height="1.5rem" className="mb-2" />
                    <Skeleton width="80%" height="1rem" className="mb-2" />
                    <Skeleton width="60%" height="1rem" className="mb-3" />
                    <Skeleton width="50%" height="2rem" className="mb-3" />
                    <Skeleton width="100%" height="2.5rem" />
                </div>
            </div>
        );
    };

    const header = () => {
        return (
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-3">
                <div className="flex gap-2 flex-1">
                    <Button icon="pi pi-filter" label="Lọc" outlined className="md:hidden" onClick={() => setFilterVisible(true)} />
                    <span className="p-input-icon-left flex-1">
                        <i className="pi pi-search" />
                        <InputText value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm sản phẩm..." className="w-full" />
                    </span>
                </div>
                <div className="flex gap-2 align-items-center">
                    <span className="text-sm text-600 white-space-nowrap">Tìm thấy {filteredProducts.length} sản phẩm</span>
                    <Dropdown value={sortKey} onChange={(e) => setSortKey(e.value)} options={sortOptions} placeholder="Sắp xếp theo" className="w-full md:w-14rem" />
                </div>
            </div>
        );
    };

    const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    return (
        <div className="grid">
            <Toast ref={toast} />

            {/* Sidebar Filter for Mobile */}
            <Sidebar visible={filterVisible} onHide={() => setFilterVisible(false)} position="left">
                <h3 className="mb-4">Danh mục sản phẩm</h3>
                <div className="flex flex-column gap-2">
                    <Button
                        label="Tất cả sản phẩm"
                        icon={selectedCategory === null ? 'pi pi-check' : undefined}
                        className={classNames('justify-content-start', {
                            'p-button-outlined': selectedCategory === null,
                            'p-button-text': selectedCategory !== null
                        })}
                        onClick={() => {
                            setSelectedCategory(null);
                            setFilterVisible(false);
                            setFirst(0);
                        }}
                    />
                    {categories.map((cat) => (
                        <Button
                            key={cat.id}
                            label={`${cat.name} (${cat.product_count})`}
                            icon={selectedCategory === cat.id ? 'pi pi-check' : undefined}
                            className={classNames('justify-content-start', {
                                'p-button-outlined': selectedCategory === cat.id,
                                'p-button-text': selectedCategory !== cat.id
                            })}
                            onClick={() => {
                                setSelectedCategory(cat.id);
                                setFilterVisible(false);
                                setFirst(0);
                            }}
                        />
                    ))}
                </div>
            </Sidebar>

            {/* Category Filter for Desktop */}
            {categoryVisible && (
                <div className="col-12 md:col-3 hidden md:block">
                    <div className="card sticky" style={{ top: '6rem' }}>
                        <div className="flex justify-content-between align-items-center mb-4">
                            <h5 className="m-0">Danh mục sản phẩm</h5>
                            <Button icon="pi pi-times" rounded text severity="secondary" onClick={() => setCategoryVisible(false)} tooltip="Ẩn danh mục" tooltipOptions={{ position: 'left' }} />
                        </div>
                        <div className="flex flex-column gap-2">
                            <Button
                                label="Tất cả sản phẩm"
                                icon={selectedCategory === null ? 'pi pi-check' : undefined}
                                className={classNames('justify-content-start', {
                                    'p-button-outlined': selectedCategory === null,
                                    'p-button-text': selectedCategory !== null
                                })}
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setFirst(0);
                                }}
                            />
                            {categories.map((cat) => (
                                <Button
                                    key={cat.id}
                                    label={`${cat.name} (${cat.product_count})`}
                                    icon={selectedCategory === cat.id ? 'pi pi-check' : undefined}
                                    className={classNames('justify-content-start', {
                                        'p-button-outlined': selectedCategory === cat.id,
                                        'p-button-text': selectedCategory !== cat.id
                                    })}
                                    onClick={() => {
                                        setSelectedCategory(cat.id);
                                        setFirst(0);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className={categoryVisible ? 'col-12 md:col-9' : 'col-12'}>
                <div className="card">
                    {!categoryVisible && (
                        <div className="mb-3 flex justify-content-between align-items-center">
                            <Button label="Hiển thị danh mục" icon="pi pi-list" outlined className="hidden md:inline-flex" onClick={() => setCategoryVisible(true)} />
                            {totalCartItems > 0 && <Button label={`Giỏ hàng (${totalCartItems})`} icon="pi pi-shopping-cart" severity="success" onClick={() => (window.location.href = '/customer/cart')} />}
                        </div>
                    )}

                    {header()}

                    {loading ? (
                        <div className="grid">
                            {[...Array(8)].map((_, i) => (
                                <React.Fragment key={i}>{skeletonTemplate()}</React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <>
                            {displayedProducts.length > 0 ? (
                                <>
                                    <div className="grid">{displayedProducts.map((product: Product) => itemTemplate(product))}</div>

                                    {filteredProducts.length > rowsPerPage && (
                                        <Paginator
                                            first={first}
                                            rows={rowsPerPage}
                                            totalRecords={filteredProducts.length}
                                            onPageChange={onPageChange}
                                            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                                            currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} sản phẩm"
                                            className="mt-4"
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="text-center p-5">
                                    <i className="pi pi-inbox text-6xl text-400 mb-3"></i>
                                    <h4 className="text-600">Không tìm thấy sản phẩm nào</h4>
                                    <p className="text-500">{searchTerm ? `Không tìm thấy sản phẩm với từ khóa "${searchTerm}"` : 'Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác'}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Floating Cart Button for Mobile */}
            {totalCartItems > 0 && (
                <Button
                    icon="pi pi-shopping-cart"
                    label={totalCartItems.toString()}
                    badge={totalCartItems.toString()}
                    className="md:hidden fixed"
                    style={{ bottom: '2rem', right: '2rem', zIndex: 1000 }}
                    severity="success"
                    onClick={() => (window.location.href = '/customer/cart')}
                    rounded
                />
            )}
        </div>
    );
};

export default ProductsPage;
