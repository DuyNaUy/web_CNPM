/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Galleria } from 'primereact/galleria';
import { InputNumber } from 'primereact/inputnumber';
import { Divider } from 'primereact/divider';
import { TabView, TabPanel } from 'primereact/tabview';
import React, { useRef, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, cartAPI } from '@/services/api';
import { LayoutContext } from '@/layout/context/layoutcontext';

interface ProductVariant {
    id?: number;
    size: string;
    price: number;
    stock: number;
}

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
    category: string;
    price: number;
    oldPrice?: number;
    stock: number;
    description: string;
    images: string[];
    detailDescription: string;
    sold_count?: number;
    variants?: ProductVariant[];
    min_price?: number;
    max_price?: number;
    unit?: string;
    product_images?: ProductImage[];
}

const ProductDetailPage = ({ params }: { params: { id: string } }) => {
    const router = useRouter();
    const { setCartCount } = useContext(LayoutContext);
    const toast = useRef<Toast>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const resp = await productAPI.getById(Number(params.id));
                console.log('Product API Response:', resp);
                const p = resp && resp.data ? resp.data : resp;
                console.log('Normalized data:', p);
                
                // Build image URLs array: main_image first, then product_images
                let imageUrls: string[] = [];
                
                // Always add main_image_url first if it exists
                if (p.main_image_url) {
                    imageUrls.push(p.main_image_url);
                }
                
                // Then add product_images (additional images)
                if (p.product_images && Array.isArray(p.product_images) && p.product_images.length > 0) {
                    const additionalImages = p.product_images.map((img: any) => img.image_url);
                    imageUrls = [...imageUrls, ...additionalImages];
                }
                
                // Final fallback to placeholder if no images at all
                if (imageUrls.length === 0) {
                    imageUrls = ['/demo/images/product/placeholder.png'];
                }
                
                const normalized: Product = {
                    id: Number(p.id),
                    name: p.name || p.title || '',
                    category: p.category_name || (p.category && p.category.name) || '',
                    price: Number(p.price || 0),
                    oldPrice: p.old_price || p.oldPrice,
                    stock: Number(p.stock || p.quantity || 0),
                    description: p.description || p.short_description || '',
                    images: imageUrls,
                    sold_count: Number(p.sold_count || p.soldCount || 0),
                    detailDescription: p.detail_description || p.detailDescription || p.full_description || '',
                    variants: p.variants || [],
                    min_price: p.min_price,
                    max_price: p.max_price,
                    unit: p.unit || '30cm',
                    product_images: p.product_images || []
                };
                console.log('Normalized Product:', normalized);
                setProduct(normalized);
            } catch (err) {
                console.error('Failed to load product', err);
                toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải sản phẩm' });
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [params.id]);

    if (loading) {
        return (
            <div className="p-6 text-center">
                <i className="pi pi-spin pi-spinner text-3xl text-primary mb-3" />
                <div>Đang tải sản phẩm...</div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-6 text-center">
                <h3 className="text-900">Sản phẩm không tồn tại</h3>
                <p className="text-600">Không tìm thấy sản phẩm theo ID này.</p>
            </div>
        );
    }

    // Related products removed per request

    const itemTemplate = (item: string) => {
        return <img src={item} alt="Product" style={{ width: '100%', display: 'block' }} />;
    };

    const thumbnailTemplate = (item: string) => {
        return <img src={item} alt="Thumbnail" style={{ width: '100px', display: 'block', cursor: 'pointer' }} />;
    };

    const addToCart = async () => {
        // Nếu có variants, bắt buộc phải chọn size
        if (product.variants && product.variants.length > 0) {
            const selectedVariant = product.variants.find(v => v.size === selectedSize);
            if (!selectedVariant) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: 'Vui lòng chọn kích thước',
                    life: 3000
                });
                return;
            }
            
            // Kiểm tra số lượng tồn kho
            if (quantity > selectedVariant.stock) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: `Chỉ còn ${selectedVariant.stock} sản phẩm trong kho`,
                    life: 3000
                });
                return;
            }
        }

        // Kiểm tra số lượng phải >= 1
        if (quantity < 1) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng nhập số lượng >= 1',
                life: 3000
            });
            return;
        }

        // Call API to add to cart using cartAPI
        try {
            const response = await cartAPI.addItem(product.id, quantity, selectedSize || product.unit || 'default');
            
            if (response && response.id) {
                // Update cart count in top bar
                if (response.total_quantity) {
                    setCartCount(response.total_quantity);
                }
                toast.current?.show({
                    severity: 'success',
                    summary: 'Đã thêm vào giỏ',
                    detail: `Đã thêm ${quantity} ${product.name} (${selectedSize}) vào giỏ hàng`,
                    life: 3000
                });
                setQuantity(1);
                setSelectedSize('');
            } else if (response && response.error) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: response.error || 'Không thể thêm vào giỏ hàng',
                    life: 3000
                });
            }
        } catch (err: any) {
            console.error('Error adding to cart:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: err.message || 'Không thể thêm vào giỏ hàng',
                life: 3000
            });
        }
    };

    const buyNow = () => {
        // Nếu có variants, bắt buộc phải chọn size
        if (product.variants && product.variants.length > 0) {
            const selectedVariant = product.variants.find(v => v.size === selectedSize);
            if (!selectedVariant) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: 'Vui lòng chọn kích thược',
                    life: 3000
                });
                return;
            }
            
            // Kiểm tra số lượng tốn kho
            if (quantity > selectedVariant.stock) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: `Chỉ còn ${selectedVariant.stock} sản phẩm trong kho`,
                    life: 3000
                });
                return;
            }
        }

        // Kiểm tra số lượng phải >= 1
        if (quantity < 1) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng nhập số lượng >= 1',
                life: 3000
            });
            return;
        }

        // Lấy giá từ variants nếu có
        let price = product.price;
        if (product.variants && product.variants.length > 0) {
            const variant = product.variants.find(v => v.size === selectedSize);
            if (variant) {
                price = variant.price;
            }
        }

        const item = {
            id: product.id,
            name: product.name,
            price: price,
            quantity: quantity,
            unit: product.unit,
            size: selectedSize || product.unit,
            image: product.images && product.images.length > 0 ? product.images[0] : undefined
        };
        
        sessionStorage.setItem('buyNowItem', JSON.stringify(item));
        router.push('/customer/checkout');
    };

    return (
        <div className="grid">
            <Toast ref={toast} />

            {/* Breadcrumb */}
            <div className="col-12">
                <div className="flex align-items-center gap-2 text-600">
                    <span className="cursor-pointer hover:text-primary" onClick={() => router.push('/customer/products')}>
                        Sản phẩm
                    </span>
                    <i className="pi pi-angle-right text-sm" />
                    <span className="cursor-pointer hover:text-primary" onClick={() => router.push('/customer/products')}>
                        {product.category}
                    </span>
                    <i className="pi pi-angle-right text-sm" />
                    <span className="text-900 font-semibold">{product.name}</span>
                </div>
            </div>

            {/* Product Detail */}
            <div className="col-12">
                <div className="card">
                    <div className="grid">
                        {/* Images */}
                        <div className="col-12 md:col-5">
                            <Galleria value={product.images} item={itemTemplate} thumbnail={thumbnailTemplate} numVisible={4} circular showItemNavigators showThumbnails thumbnailsPosition="left" style={{ maxWidth: '100%' }} />
                        </div>

                        {/* Product Info */}
                        <div className="col-12 md:col-7">
                            <div className="flex align-items-center gap-2 mb-3">
                                <Tag value={product.category} severity="info"></Tag>
                            </div>

                            <h1 className="text-4xl font-bold text-900 mb-3">{product.name}</h1>

                            {/* sold count will be shown inline with price */}

                            <div className="surface-100 p-4 border-round mb-4">
                                <div className="flex align-items-baseline gap-3 mb-2">
                                    {product.variants && product.variants.length >= 2 ? (
                                        <>
                                            <span className="text-3xl font-bold text-primary">
                                                {selectedSize && product.variants.find(v => v.size === selectedSize)
                                                    ? `${new Intl.NumberFormat('vi-VN').format(product.variants.find(v => v.size === selectedSize)?.price ?? 0)} VND`
                                                    : product.min_price === product.max_price
                                                    ? `${new Intl.NumberFormat('vi-VN').format(product.min_price ?? product.price)} VND`
                                                    : `${new Intl.NumberFormat('vi-VN').format(product.min_price ?? product.price)} - ${new Intl.NumberFormat('vi-VN').format(product.max_price ?? product.price)} VND`}
                                            </span>
                                            <span className="text-sm text-500">Đã bán: <span className="font-semibold text-900">{product.sold_count ?? 0}</span></span>
                                        </>
                                    ) : selectedSize && product.variants && product.variants.length > 0 ? (
                                        <>
                                            <span className="text-3xl font-bold text-primary">
                                                {new Intl.NumberFormat('vi-VN').format(product.variants.find(v => v.size === selectedSize)?.price ?? product.price)} VND
                                            </span>
                                            <span className="text-sm text-500">Đã bán: <span className="font-semibold text-900">{product.sold_count ?? 0}</span></span>
                                        </>
                                    ) : product.oldPrice ? (
                                        <>
                                            <span className="text-3xl font-bold text-primary">{new Intl.NumberFormat('vi-VN').format(product.price)} VND</span>
                                            <span className="text-xl text-500 line-through">{new Intl.NumberFormat('vi-VN').format(product.oldPrice)} VND</span>
                                            <Tag value={`-${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%`} severity="danger" className="text-sm" />
                                            <span className="text-sm text-500">Đã bán: <span className="font-semibold text-900">{product.sold_count ?? 0}</span></span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-3xl font-bold text-primary">{new Intl.NumberFormat('vi-VN').format(product.price)} VND</span>
                                            <span className="text-sm text-500">Đã bán: <span className="font-semibold text-900">{product.sold_count ?? 0}</span></span>
                                        </>
                                    )}
                                </div>
                                <div className="text-sm text-600">
                                    Tình trạng: <span className="font-semibold text-900">Còn {selectedSize && product.variants?.find(v => v.size === selectedSize) ? product.variants.find(v => v.size === selectedSize)?.stock : product.variants && product.variants.length > 0 ? product.variants.reduce((sum, v) => sum + v.stock, 0) : product.stock} sản phẩm</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-900 mb-2">Mô tả ngắn</h3>
                                <p className="text-600 line-height-3">{product.description}</p>
                            </div>

                            <Divider />

                            {/* Size Selection */}
                            {product.variants && product.variants.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-900 mb-3">Chọn kích thước:</h3>
                                    <div className="flex gap-3 flex-wrap">
                                        {product.variants.map((variant) => (
                                            <button
                                                key={variant.size}
                                                onClick={() => variant.stock > 0 && setSelectedSize(variant.size)}
                                                className={`p-3 border-round border-2 cursor-pointer transition-all font-semibold ${
                                                    selectedSize === variant.size
                                                        ? 'border-primary bg-primary text-white shadow-2'
                                                        : 'border-300 hover:border-primary'
                                                } ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={variant.stock === 0}
                                            >
                                                {variant.size}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedSize && <div className="mt-2 text-sm text-600">Đã chọn: <span className="font-semibold text-900">{selectedSize}</span></div>}
                                </div>
                            )}

                            <Divider />

                            <div className="flex align-items-center gap-4 mb-4">
                                <span className="text-900 font-semibold">Số lượng:</span>
                                <InputNumber
                                    value={quantity}
                                    onValueChange={(e) => setQuantity(e.value || 1)}
                                    mode="decimal"
                                    showButtons
                                    min={1}
                                    max={selectedSize && product.variants?.find(v => v.size === selectedSize) ? product.variants.find(v => v.size === selectedSize)?.stock : product.variants && product.variants.length > 0 ? product.variants.reduce((sum, v) => sum + v.stock, 0) : product.stock}
                                    buttonLayout="horizontal"
                                    decrementButtonClassName="p-button-secondary"
                                    incrementButtonClassName="p-button-secondary"
                                    incrementButtonIcon="pi pi-plus"
                                    decrementButtonIcon="pi pi-minus"
                                />
                            </div>

                            <div className="flex gap-3 mb-4">
                                <Button 
                                    label="Thêm vào giỏ" 
                                    icon="pi pi-shopping-cart" 
                                    className="flex-1 p-button-outlined p-button-lg"
                                    style={{ cursor: 'pointer', opacity: 1 }}
                                    onClick={addToCart} 
                                />
                                <Button 
                                    label="Mua ngay" 
                                    icon="pi pi-bolt" 
                                    className="flex-1 p-button-lg"
                                    style={{ cursor: 'pointer', opacity: 1 }}
                                    onClick={buyNow} 
                                />
                            </div>

                            <div className="surface-50 p-3 border-round">
                                <div className="flex align-items-center gap-3 mb-2">
                                    <i className="pi pi-shield-check text-primary text-2xl"></i>
                                    <span className="text-900">Đảm bảo chính hãng 100%</span>
                                </div>
                                <div className="flex align-items-center gap-3 mb-2">
                                    <i className="pi pi-truck text-primary text-2xl"></i>
                                    <span className="text-900">Miễn phí vận chuyển cho đơn hàng trên 200.000đ</span>
                                </div>
                                <div className="flex align-items-center gap-3">
                                    <i className="pi pi-refresh text-primary text-2xl"></i>
                                    <span className="text-900">Đổi trả trong vòng 24h nếu sản phẩm lỗi</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs: Description, Specifications, Reviews */}
            <div className="col-12">
                <div className="card">
                    <TabView>
                        <TabPanel header="Mô tả chi tiết">
                            <div className="text-900 text-lg line-height-3" style={{ fontSize: '1.05rem' }} dangerouslySetInnerHTML={{ __html: product.detailDescription }} />
                        </TabPanel>

                        {/* Technical specs removed per UX request */}
                    </TabView>
                </div>
            </div>

            {/* Related products section removed */}
        </div>
    );
};

export default ProductDetailPage;
