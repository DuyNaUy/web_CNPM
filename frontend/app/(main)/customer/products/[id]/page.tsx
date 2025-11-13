/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Galleria } from 'primereact/galleria';
import { InputNumber } from 'primereact/inputnumber';
import { Divider } from 'primereact/divider';
import { TabView, TabPanel } from 'primereact/tabview';
import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI } from '@/services/api';

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
}

const ProductDetailPage = ({ params }: { params: { id: string } }) => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [selectedSize, setSelectedSize] = useState<number>(30);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const resp = await productAPI.getById(Number(params.id));
                const p = resp && resp.data ? resp.data : resp;
                const normalized: Product = {
                    id: Number(p.id),
                    name: p.name || p.title || '',
                    category: p.category_name || (p.category && p.category.name) || '',
                    price: Number(p.price || 0),
                    oldPrice: p.old_price || p.oldPrice,
                    stock: Number(p.stock || p.quantity || 0),
                    description: p.description || p.short_description || '',
                    images: Array.isArray(p.images) && p.images.length ? p.images : p.main_image_url ? [p.main_image_url] : p.main_image ? [p.main_image] : [],
                    sold_count: Number(p.sold_count || p.soldCount || 0),
                    detailDescription: p.detail_description || p.detailDescription || p.full_description || ''
                };
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

    const addToCart = () => {
        toast.current?.show({
            severity: 'success',
            summary: 'Đã thêm vào giỏ',
            detail: `Đã thêm ${quantity} ${product.name} vào giỏ hàng`,
            life: 3000
        });
    };

    const buyNow = () => {
        addToCart();
        router.push('/customer/cart');
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
                                {product.stock < 50 && <Tag value="Sắp hết hàng" severity="warning"></Tag>}
                            </div>

                            <h1 className="text-4xl font-bold text-900 mb-3">{product.name}</h1>

                            {/* sold count will be shown inline with price */}

                            <div className="surface-100 p-4 border-round mb-4">
                                <div className="flex align-items-baseline gap-3 mb-2">
                                    {product.oldPrice && (
                                        <>
                                            <span className="text-3xl font-bold text-primary">{new Intl.NumberFormat('vi-VN').format(product.price)} VND</span>
                                            <span className="text-xl text-500 line-through">{new Intl.NumberFormat('vi-VN').format(product.oldPrice)} VND</span>
                                            <Tag value={`-${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%`} severity="danger" className="text-sm" />
                                            <span className="text-sm text-500">Đã bán: <span className="font-semibold text-900">{product.sold_count ?? 0}</span></span>
                                        </>
                                    )}
                                    {!product.oldPrice && (
                                        <>
                                            <span className="text-3xl font-bold text-primary">{new Intl.NumberFormat('vi-VN').format(product.price)} VND</span>
                                            <span className="text-sm text-500">Đã bán: <span className="font-semibold text-900">{product.sold_count ?? 0}</span></span>
                                        </>
                                    )}
                                </div>
                                <div className="text-sm text-600">
                                    Tình trạng: <span className="font-semibold text-900">Còn {product.stock} sản phẩm</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-900 mb-2">Mô tả ngắn</h3>
                                <p className="text-600 line-height-3">{product.description}</p>
                            </div>

                            <Divider />

                            <div className="flex align-items-center gap-4 mb-4">
                                <span className="text-900 font-semibold">Số lượng:</span>
                                <InputNumber
                                    value={quantity}
                                    onValueChange={(e) => setQuantity(e.value || 1)}
                                    mode="decimal"
                                    showButtons
                                    min={1}
                                    max={product.stock}
                                    buttonLayout="horizontal"
                                    decrementButtonClassName="p-button-secondary"
                                    incrementButtonClassName="p-button-secondary"
                                    incrementButtonIcon="pi pi-plus"
                                    decrementButtonIcon="pi pi-minus"
                                />
                            </div>

                            <div className="flex gap-3 mb-4">
                                <Button label="Thêm vào giỏ" icon="pi pi-shopping-cart" className="flex-1 p-button-outlined p-button-lg" onClick={addToCart} disabled={product.stock === 0} />
                                <Button label="Mua ngay" icon="pi pi-bolt" className="flex-1 p-button-lg" onClick={buyNow} disabled={product.stock === 0} />
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
