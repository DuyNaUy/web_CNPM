/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { DataView } from 'primereact/dataview';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import { Sidebar } from 'primereact/sidebar';
import { Skeleton } from 'primereact/skeleton';
import { Paginator } from 'primereact/paginator';
import React, { useRef, useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { classNames } from 'primereact/utils';
import { productAPI, categoryAPI, cartAPI, getStoredUser } from '@/services/api';
import { LayoutContext } from '@/layout/context/layoutcontext';

interface Category {
    id: number;
    name: string;
    description: string;
    status: string;
    product_count: number;
}

interface ProductVariant {
    id?: number;
    size: string;
    price: number;
    stock: number;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    category: number;
    category_name: string;
    price: number;
    discount_percentage: number;
    stock: number;
    unit: string;
    sold_count: number;
    description: string;
    main_image: string | null;
    main_image_url: string | null;
    status: string;
    in_stock: boolean;
    variants?: ProductVariant[];
    min_price?: number;
    max_price?: number;
}

const ProductsPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setCartCount } = useContext(LayoutContext);
    const [allProducts, setAllProducts] = useState<Product[]>([]); // Lưu tất cả sản phẩm
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]); // Sản phẩm sau khi filter
    const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]); // Sản phẩm hiển thị trên trang hiện tại
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortKey, setSortKey] = useState<string>('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [categoryVisible, setCategoryVisible] = useState(true);
    // cart keeps quantity and selected size per product id
    const [cart, setCart] = useState<{ [key: number]: { qty: number; size: number } }>({});
    const [selectedSizes, setSelectedSizes] = useState<{ [key: number]: number }>({});
    const [loading, setLoading] = useState(false);
    const [first, setFirst] = useState(0);
    const [rowsPerPage] = useState(12);
    const toast = useRef<Toast>(null);

    const sortOptions = [
        { label: 'Mới nhất', value: 'newest' },
        { label: 'Giá: Thấp đến cao', value: 'price-asc' },
        { label: 'Giá: Cao đến thấp', value: 'price-desc' },
        { label: 'Bán chạy nhất', value: 'sold' },
        { label: 'Tên: A-Z', value: 'name' }
    ];

    // Load tất cả dữ liệu một lần khi component mount
    useEffect(() => {
        loadAllData();
        
        // Kiểm tra URL query params để lấy category
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            setSelectedCategory(parseInt(categoryParam, 10));
        }
    }, [searchParams]);

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
    // Keep dependencies minimal on purpose; filterAndSortProducts is stable in this component
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        filterAndSortProducts();
    }, [selectedCategory, searchTerm, sortKey, allProducts]);

    // Cập nhật displayed products khi filteredProducts hoặc pagination thay đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const addToCart = async (product: Product) => {
        // Kiểm tra đăng nhập
        const user = getStoredUser();
        if (!user) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Yêu cầu đăng nhập',
                detail: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng',
                life: 3000
            });
            // Chuyển đến trang đăng nhập
            setTimeout(() => {
                router.push('/auth/login');
            }, 1000);
            return;
        }

        const selectedSize = selectedSizes[product.id];
        
        // Nếu có variants, bắt buộc phải chọn size
        if (product.variants && product.variants.length > 0 && !selectedSize) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng chọn kích thước',
                life: 3000
            });
            return;
        }

        const sizeStr = product.variants && product.variants.length > 0 
            ? `${selectedSize}` 
            : `${selectedSize ?? 30}cm`;
        
        try {
            const response = await cartAPI.addItem(product.id, 1, sizeStr);
            if (response && response.id) {
                // Update local cart state
                setCart((prev) => ({
                    ...prev,
                    [product.id]: { qty: (prev[product.id]?.qty || 0) + 1, size: selectedSize ?? 30 }
                }));
                // Update topbar cart count via context
                if (response.total_quantity) {
                    setCartCount(response.total_quantity);
                }
                toast.current?.show({
                    severity: 'success',
                    summary: 'Đã thêm vào giỏ',
                    detail: `${product.name} (Size ${sizeStr}) đã được thêm vào giỏ hàng`,
                    life: 3000
                });
            } else if (response && response.error) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: response.error || 'Không thể thêm sản phẩm vào giỏ hàng',
                    life: 3000
                });
            }
        } catch (error: any) {
            console.error('Error adding to cart:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể thêm sản phẩm vào giỏ hàng',
                life: 3000
            });
        }
    };

    const buyNow = (product: Product) => {
        // Kiểm tra đăng nhập
        const user = getStoredUser();
        if (!user) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng đăng nhập để mua hàng',
                life: 3000
            });
            setTimeout(() => {
                router.push('/auth/login');
            }, 1000);
            return;
        }

        const selectedSize = selectedSizes[product.id];
        
        // Nếu có variants, bắt buộc phải chọn size
        if (product.variants && product.variants.length > 0 && !selectedSize) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng chọn kích thước',
                life: 3000
            });
            return;
        }

        // Xử lý size và price dựa trên variants
        let size: string;
        let price = product.price;
        
        if (product.variants && product.variants.length > 0) {
            // Product có variants - lấy thông tin từ variant đã chọn
            const selectedSizeStr = `${selectedSize}`;
            const variant = product.variants.find(v => v.size === selectedSizeStr);
            
            if (variant) {
                size = variant.size; // Giữ nguyên format size từ variant (vd: "30", "60", "90")
                price = variant.price;
            } else {
                // Fallback nếu không tìm thấy variant
                size = selectedSizeStr;
            }
        } else {
            // Product không có variants - sử dụng size mặc định
            const sizeValue = selectedSize ?? 30;
            size = `${sizeValue}cm`;
        }

        const item = {
            id: product.id,
            name: product.name,
            price: price,
            quantity: 1,
            unit: size, // Sử dụng size làm unit
            size: size, // Giữ lại size field để tương thích
            image: product.main_image_url || product.main_image
        };
        
        console.log('Buy Now - Item:', item); // Debug log
        sessionStorage.setItem('buyNowItem', JSON.stringify(item));
        window.location.href = '/customer/checkout';
    };

    const onPageChange = (event: any) => {
        setFirst(event.first);
    };

    const itemTemplate = (product: Product) => {
        const imageUrl = product.main_image_url || product.main_image || '/demo/images/product/placeholder.png';

        return (
            <div className="col-12 sm:col-6 lg:col-4 xl:col-4 p-2">
                <div className="product-card p-4 border-1 surface-border surface-card border-round h-full hover:shadow-3 transition-all transition-duration-300">
                    <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <Tag value={product.category_name} severity="info" className="text-sm"></Tag>
                    </div>

                    <div className="product-image-container mb-3 relative">
                        <img src={imageUrl} alt={product.name} className="product-image w-full border-round" style={{ height: '220px', objectFit: 'cover' }} />
                    </div>

                    <div className="product-info">
                        <div className="text-2xl font-bold text-900 mb-2" style={{ minHeight: '2.5rem' }}>
                            {product.name}
                        </div>
                        <div className="text-lg text-600 mb-3 line-height-3" style={{ minHeight: '3rem' }}>
                            {product.description.length > 120 ? product.description.substring(0, 120) + '...' : product.description}
                        </div>

                        {/* sold count moved to be inline with price */}

                        <div className="flex flex-column gap-3 mb-3">
                            <div className="text-sm text-600">
                                <span className="font-semibold">Số lượng: </span>
                                <span className={(() => {
                                    const stock = selectedSizes[product.id] && product.variants?.find(v => v.size === `${selectedSizes[product.id]}`)
                                        ? product.variants.find(v => v.size === `${selectedSizes[product.id]}`)?.stock ?? 0
                                        : product.variants && product.variants.length > 0
                                        ? product.variants.reduce((sum, v) => sum + v.stock, 0)
                                        : product.stock;
                                    return stock <= 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold';
                                })()}>
                                    {(() => {
                                        const stock = selectedSizes[product.id] && product.variants?.find(v => v.size === `${selectedSizes[product.id]}`)
                                            ? product.variants.find(v => v.size === `${selectedSizes[product.id]}`)?.stock ?? 0
                                            : product.variants && product.variants.length > 0
                                            ? product.variants.reduce((sum, v) => sum + v.stock, 0)
                                            : product.stock;
                                        
                                        if (stock <= 0) {
                                            return 'Hết hàng';
                                        }
                                        return stock;
                                    })()}
                                </span>
                            </div>
                            <div className="text-sm text-600">
                                <div className="mb-1">Chọn size:</div>
                                <div className="flex gap-3">
                                    {product.variants && product.variants.length > 0 ? (
                                        product.variants.map((variant) => (
                                            <label 
                                                key={variant.size} 
                                                className="flex align-items-center gap-2"
                                                style={{
                                                    opacity: variant.stock === 0 ? 0.4 : 1,
                                                    cursor: variant.stock === 0 ? 'not-allowed' : 'pointer',
                                                    pointerEvents: variant.stock === 0 ? 'none' : 'auto'
                                                }}
                                            >
                                                <RadioButton
                                                    inputId={`size-${product.id}-${variant.size}`}
                                                    name={`size-${product.id}`}
                                                    value={variant.size}
                                                    onChange={(e) => setSelectedSizes((prev) => ({ ...prev, [product.id]: e.value as any }))}
                                                    checked={`${selectedSizes[product.id] ?? ''}` === variant.size}
                                                    disabled={variant.stock === 0}
                                                />
                                                <span className="text-sm">
                                                    {variant.size}
                                                    {variant.stock === 0 && <span className="ml-1 text-red-500">(Hết hàng)</span>}
                                                </span>
                                            </label>
                                        ))
                                    ) : (
                                        [30, 60, 90].map((s) => (
                                            <label key={s} className="flex align-items-center gap-2">
                                                <RadioButton
                                                    inputId={`size-${product.id}-${s}`}
                                                    name={`size-${product.id}`}
                                                    value={s}
                                                    onChange={(e) => setSelectedSizes((prev) => ({ ...prev, [product.id]: Number(e.value) }))}
                                                    checked={(selectedSizes[product.id] ?? 30) === s}
                                                />
                                                <span className="text-sm">{s} cm</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="flex align-items-baseline gap-3">
                                <div className="text-2xl font-bold text-primary">
                                    {(() => {
                                        // Nếu đã chọn size, hiển thị giá của size đó
                                        if (selectedSizes[product.id] && product.variants?.find(v => v.size === `${selectedSizes[product.id]}`)) {
                                            const selectedVariant = product.variants.find(v => v.size === `${selectedSizes[product.id]}`);
                                            return `${new Intl.NumberFormat('vi-VN').format(selectedVariant?.price ?? 0)} VND`;
                                        }
                                        
                                        // Nếu có variants, kiểm tra xem có bao nhiêu giá khác nhau
                                        if (product.variants && product.variants.length > 0) {
                                            const prices = product.variants.map(v => v.price).filter(p => p > 0);
                                            const uniquePrices = Array.from(new Set(prices));
                                            
                                            // Nếu chỉ có 1 giá duy nhất, hiển thị giá đó
                                            if (uniquePrices.length === 1) {
                                                return `${new Intl.NumberFormat('vi-VN').format(uniquePrices[0])} VND`;
                                            }
                                            
                                            // Nếu có 2 giá trở lên, hiển thị min - max
                                            if (uniquePrices.length >= 2 && product.min_price && product.max_price) {
                                                return `${new Intl.NumberFormat('vi-VN').format(product.min_price)} - ${new Intl.NumberFormat('vi-VN').format(product.max_price)} VND`;
                                            }
                                        }
                                        
                                        // Fallback về giá mặc định
                                        return `${new Intl.NumberFormat('vi-VN').format(product.price)} VND`;
                                    })()}
                                </div>
                                <div className="text-sm text-500">Đã bán: <span className="font-semibold text-900">{product.sold_count}</span></div>
                            </div>
                        </div>

                            <div className="flex gap-2">
                            <Button label="Chi tiết" icon="pi pi-eye" className="flex-1 p-button-outlined" onClick={() => router.push(`/customer/products/${product.id}`)} />
                            <Button 
                                label="Mua Ngay" 
                                icon="pi pi-flash" 
                                className="flex-1"
                                onClick={() => buyNow(product)}
                                disabled={(() => {
                                    const stock = selectedSizes[product.id] && product.variants?.find(v => v.size === `${selectedSizes[product.id]}`)
                                        ? product.variants.find(v => v.size === `${selectedSizes[product.id]}`)?.stock ?? 0
                                        : product.variants && product.variants.length > 0
                                        ? product.variants.reduce((sum, v) => sum + v.stock, 0)
                                        : product.stock;
                                    return stock <= 0;
                                })()}
                                style={{ backgroundColor: '#ff1493', borderColor: '#ff1493', color: 'white', cursor: 'pointer', opacity: 1 }}
                            />
                            <Button 
                                icon="pi pi-shopping-cart" 
                                className="p-button-rounded" 
                                onClick={() => addToCart(product)} 
                                tooltip="Thêm vào giỏ" 
                                tooltipOptions={{ position: 'top' }} 
                                disabled={(() => {
                                    const stock = selectedSizes[product.id] && product.variants?.find(v => v.size === `${selectedSizes[product.id]}`)
                                        ? product.variants.find(v => v.size === `${selectedSizes[product.id]}`)?.stock ?? 0
                                        : product.variants && product.variants.length > 0
                                        ? product.variants.reduce((sum, v) => sum + v.stock, 0)
                                        : product.stock;
                                    return stock <= 0;
                                })()}
                                style={{ cursor: 'pointer', opacity: 1 }} 
                            />
                        </div>

                        {cart[product.id] && (
                            <div className="mt-2 text-center">
                                <Tag value={`Trong giỏ: ${cart[product.id].qty} (Size ${cart[product.id].size})`} severity="success" className="w-full"></Tag>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const skeletonTemplate = () => {
        return (
            <div className="col-12 sm:col-6 lg:col-4 xl:col-4 p-2">
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

    const totalCartItems = Object.values(cart).reduce((sum, item) => sum + (item.qty || 0), 0);

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
            {false && categoryVisible && (
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
            <div className="col-12">
                <div className="card">
                    {!categoryVisible && (
                        <div className="mb-3 flex justify-content-between align-items-center">
                            <div></div>
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
