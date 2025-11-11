/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Rating } from 'primereact/rating';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Galleria } from 'primereact/galleria';
import { InputNumber } from 'primereact/inputnumber';
import { Divider } from 'primereact/divider';
import { TabView, TabPanel } from 'primereact/tabview';
import { Avatar } from 'primereact/avatar';
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    oldPrice?: number;
    stock: number;
    rating: number;
    reviews: number;
    description: string;
    images: string[];
    specifications: { label: string; value: string }[];
    detailDescription: string;
}

interface Review {
    id: number;
    userName: string;
    rating: number;
    date: string;
    comment: string;
    avatar?: string;
}

const ProductDetailPage = ({ params }: { params: { id: string } }) => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [quantity, setQuantity] = useState<number>(1);

    // Mock data - trong thực tế sẽ fetch từ API dựa trên params.id
    const product: Product = {
        id: parseInt(params.id),
        name: 'Cải Thảo Hữu Cơ',
        category: 'Rau Củ Quả',
        price: 25000,
        stock: 150,
        rating: 4.5,
        reviews: 24,
        description: 'Cải thảo hữu cơ tươi sạch, không hóa chất, được trồng theo tiêu chuẩn VietGAP',
        images: [
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
            'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600',
            'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600',
            'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=600'
        ],
        specifications: [
            { label: 'Xuất xứ', value: 'Đà Lạt, Việt Nam' },
            { label: 'Trọng lượng', value: '500g - 700g/bó' },
            { label: 'Bảo quản', value: 'Nhiệt độ 2-4°C' },
            { label: 'Hạn sử dụng', value: '3-5 ngày kể từ ngày thu hoạch' },
            { label: 'Chứng nhận', value: 'VietGAP, Hữu cơ' }
        ],
        detailDescription: `
            <h3>Giới thiệu sản phẩm</h3>
            <p>Cải thảo hữu cơ của chúng tôi được trồng theo tiêu chuẩn hữu cơ nghiêm ngặt tại Đà Lạt - vùng đất nổi tiếng với khí hậu mát mẻ, lý tưởng cho việc trồng rau củ.</p>
            
            <h3>Đặc điểm nổi bật</h3>
            <ul>
                <li>100% không sử dụng thuốc trừ sâu hóa học</li>
                <li>Không sử dụng phân bón tổng hợp</li>
                <li>Giàu vitamin C, K và chất xơ</li>
                <li>Lá xanh tươi, giòn ngọt tự nhiên</li>
                <li>Được kiểm tra chất lượng nghiêm ngặt trước khi đóng gói</li>
            </ul>

            <h3>Công dụng</h3>
            <p>Cải thảo là nguyên liệu tuyệt vời cho nhiều món ăn như: lẩu, xào, nấu canh, muối chua, kim chi...</p>

            <h3>Cách bảo quản</h3>
            <p>Để cải thảo trong ngăn mát tủ lạnh (2-4°C), bọc kín trong túi nilon hoặc hộp kín. Sử dụng trong vòng 3-5 ngày để đảm bảo độ tươi ngon.</p>
        `
    };

    const reviews: Review[] = [
        {
            id: 1,
            userName: 'Nguyễn Văn A',
            rating: 5,
            date: '2024-11-05',
            comment: 'Cải thảo rất tươi và sạch, gia đình tôi rất hài lòng. Sẽ ủng hộ shop thường xuyên!',
            avatar: 'https://i.pravatar.cc/150?u=user1'
        },
        {
            id: 2,
            userName: 'Trần Thị B',
            rating: 4,
            date: '2024-11-03',
            comment: 'Chất lượng tốt, đúng như mô tả. Giao hàng nhanh.',
            avatar: 'https://i.pravatar.cc/150?u=user2'
        },
        {
            id: 3,
            userName: 'Lê Minh C',
            rating: 5,
            date: '2024-11-01',
            comment: 'Rau rất tươi, ngọt và sạch. Giá cả hợp lý. Recommend!',
            avatar: 'https://i.pravatar.cc/150?u=user3'
        }
    ];

    const relatedProducts = [
        {
            id: 6,
            name: 'Cà Chua Bi',
            price: 35000,
            image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300',
            rating: 4.3
        },
        {
            id: 2,
            name: 'Thịt Bò Úc',
            price: 350000,
            image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=300',
            rating: 5
        },
        {
            id: 4,
            name: 'Trứng Gà Organic',
            price: 65000,
            image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300',
            rating: 4.7
        }
    ];

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

                            <div className="flex align-items-center gap-3 mb-4">
                                <Rating value={product.rating} readOnly cancel={false} />
                                <span className="text-600">({product.reviews} đánh giá)</span>
                                <Divider layout="vertical" />
                                <span className="text-600">
                                    Đã bán: <span className="font-semibold text-900">238</span>
                                </span>
                            </div>

                            <div className="surface-100 p-4 border-round mb-4">
                                <div className="flex align-items-baseline gap-3 mb-2">
                                    {product.oldPrice && (
                                        <>
                                            <span className="text-3xl font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
                                            <span className="text-xl text-500 line-through">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.oldPrice)}</span>
                                            <Tag value={`-${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%`} severity="danger" className="text-sm" />
                                        </>
                                    )}
                                    {!product.oldPrice && <span className="text-3xl font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>}
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
                            <div className="text-600 line-height-3" dangerouslySetInnerHTML={{ __html: product.detailDescription }} />
                        </TabPanel>

                        <TabPanel header="Thông số kỹ thuật">
                            <div className="grid">
                                {product.specifications.map((spec, index) => (
                                    <React.Fragment key={index}>
                                        <div className="col-12 md:col-4 font-semibold text-900 py-3">{spec.label}</div>
                                        <div className="col-12 md:col-8 text-600 py-3">{spec.value}</div>
                                        {index < product.specifications.length - 1 && (
                                            <div className="col-12">
                                                <Divider />
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </TabPanel>

                        <TabPanel header={`Đánh giá (${reviews.length})`}>
                            <div className="mb-4">
                                <div className="flex align-items-center gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-5xl font-bold text-primary mb-2">{product.rating.toFixed(1)}</div>
                                        <Rating value={product.rating} readOnly cancel={false} className="mb-2" />
                                        <div className="text-sm text-600">{product.reviews} đánh giá</div>
                                    </div>
                                    <Divider layout="vertical" />
                                    <div className="flex-1">
                                        <Button label="Viết đánh giá của bạn" icon="pi pi-pencil" className="p-button-outlined" />
                                    </div>
                                </div>
                            </div>

                            <Divider />

                            {reviews.map((review) => (
                                <div key={review.id} className="mb-4">
                                    <div className="flex gap-3">
                                        <Avatar image={review.avatar} size="large" shape="circle" />
                                        <div className="flex-1">
                                            <div className="flex align-items-center justify-content-between mb-2">
                                                <div>
                                                    <div className="font-semibold text-900 mb-1">{review.userName}</div>
                                                    <Rating value={review.rating} readOnly cancel={false} className="text-sm" />
                                                </div>
                                                <span className="text-sm text-600">{new Date(review.date).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <p className="text-600 line-height-3 m-0">{review.comment}</p>
                                        </div>
                                    </div>
                                    <Divider />
                                </div>
                            ))}
                        </TabPanel>
                    </TabView>
                </div>
            </div>

            {/* Related Products */}
            <div className="col-12">
                <div className="card">
                    <h3 className="text-2xl font-bold text-900 mb-4">Sản phẩm liên quan</h3>
                    <div className="grid">
                        {relatedProducts.map((relProduct) => (
                            <div key={relProduct.id} className="col-12 sm:col-6 md:col-4 lg:col-3">
                                <div className="product-card p-3 border-1 surface-border border-round cursor-pointer hover:shadow-3 transition-duration-300">
                                    <img src={relProduct.image} alt={relProduct.name} className="w-full border-round mb-3" style={{ height: '180px', objectFit: 'cover' }} onClick={() => router.push(`/customer/products/${relProduct.id}`)} />
                                    <div className="text-lg font-semibold text-900 mb-2">{relProduct.name}</div>
                                    <div className="flex align-items-center justify-content-between">
                                        <span className="text-xl font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(relProduct.price)}</span>
                                        <Rating value={relProduct.rating} readOnly cancel={false} className="text-sm" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
