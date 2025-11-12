/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI, getStoredUser } from '@/services/api';

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    unit: string;
}

const CheckoutPage = () => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isBuyNow, setIsBuyNow] = useState(false);

    const [formData, setFormData] = useState({
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        email: 'nguyenvana@example.com',
        address: '123 Nguyễn Văn Linh, Quận 7',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 7',
        note: ''
    });

    const [paymentMethod, setPaymentMethod] = useState<string>('cod');

    // Load cart items on mount
    useEffect(() => {
        const buyNowItem = sessionStorage.getItem('buyNowItem');
        if (buyNowItem) {
            try {
                const item = JSON.parse(buyNowItem);
                setCartItems([item]);
                setIsBuyNow(true);
                // Clear after loading
                sessionStorage.removeItem('buyNowItem');
            } catch (error) {
                console.error('Error parsing buyNowItem:', error);
            }
        } else {
            // Default cart items for normal checkout
            setCartItems([
                {
                    id: 1,
                    name: 'Gấu Bông Màu Hồng Nhỏ',
                    price: 89000,
                    quantity: 1,
                    image: '/demo/images/product/placeholder.png',
                    unit: '30cm'
                },
                {
                    id: 2,
                    name: 'Gấu Bông Màu Nâu Vừa',
                    price: 149000,
                    quantity: 1,
                    image: '/demo/images/product/placeholder.png',
                    unit: '60cm'
                }
            ]);
        }
    }, []);

    const calculateSubtotal = () => {
        return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const calculateShipping = () => {
        const subtotal = calculateSubtotal();
        return subtotal >= 500000 ? 0 : 30000;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateShipping();
    };

    const handleSubmit = async () => {
        if (!formData.fullName || !formData.phone || !formData.address) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Thiếu thông tin',
                detail: 'Vui lòng điền đầy đủ thông tin giao hàng',
                life: 3000
            });
            return;
        }

        if (cartItems.length === 0) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Giỏ hàng không có sản phẩm',
                life: 3000
            });
            return;
        }

        try {
            const user = getStoredUser();
            const orderData = {
                full_name: formData.fullName,
                phone: formData.phone,
                email: formData.email || user?.email || '',
                address: formData.address,
                city: formData.city,
                district: formData.district,
                note: formData.note,
                payment_method: paymentMethod,
                items: cartItems
            };

            const response = await orderAPI.createOrder(orderData);

            if (response && response.id) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Đặt hàng thành công',
                    detail: `Mã đơn hàng: ${response.order_code}`,
                    life: 3000
                });

                setTimeout(() => {
                    router.push('/customer/orders');
                }, 2000);
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: response?.error || 'Không thể tạo đơn hàng',
                    life: 3000
                });
            }
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Có lỗi xảy ra khi đặt hàng',
                life: 3000
            });
        }
    };

    return (
        <div className="grid">
            <Toast ref={toast} />

            <div className="col-12">
                <div className="card">
                    <h5>Thanh Toán</h5>
                </div>
            </div>

            <div className="col-12 md:col-8">
                <div className="card">
                    <h6>Thông tin giao hàng</h6>
                    <div className="grid p-fluid">
                        <div className="col-12">
                            <label htmlFor="fullName">Họ và tên *</label>
                            <InputText id="fullName" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                        </div>
                        <div className="col-12 md:col-6">
                            <label htmlFor="phone">Số điện thoại *</label>
                            <InputText id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div className="col-12 md:col-6">
                            <label htmlFor="email">Email</label>
                            <InputText id="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="col-12">
                            <label htmlFor="address">Địa chỉ *</label>
                            <InputText id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                        <div className="col-12 md:col-6">
                            <label htmlFor="district">Quận/Huyện</label>
                            <InputText id="district" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
                        </div>
                        <div className="col-12 md:col-6">
                            <label htmlFor="city">Tỉnh/Thành phố</label>
                            <InputText id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                        </div>
                        <div className="col-12">
                            <label htmlFor="note">Ghi chú</label>
                            <InputTextarea id="note" rows={3} value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Ghi chú về đơn hàng..." />
                        </div>
                    </div>

                    <Divider />

                    <h6>Phương thức thanh toán</h6>
                    <div className="flex flex-column gap-3">
                        <div className="flex align-items-center">
                            <RadioButton inputId="cod" name="payment" value="cod" onChange={(e) => setPaymentMethod(e.value)} checked={paymentMethod === 'cod'} />
                            <label htmlFor="cod" className="ml-2">
                                <i className="pi pi-money-bill mr-2"></i>
                                Thanh toán khi nhận hàng (COD)
                            </label>
                        </div>
                        <div className="flex align-items-center">
                            <RadioButton inputId="vnpay" name="payment" value="vnpay" onChange={(e) => setPaymentMethod(e.value)} checked={paymentMethod === 'vnpay'} />
                            <label htmlFor="vnpay" className="ml-2">
                                <i className="pi pi-credit-card mr-2"></i>
                                Thanh toán qua VNPay
                            </label>
                        </div>
                        <div className="flex align-items-center">
                            <RadioButton inputId="momo" name="payment" value="momo" onChange={(e) => setPaymentMethod(e.value)} checked={paymentMethod === 'momo'} />
                            <label htmlFor="momo" className="ml-2">
                                <i className="pi pi-wallet mr-2"></i>
                                Thanh toán qua Momo
                            </label>
                        </div>
                        <div className="flex align-items-center">
                            <RadioButton inputId="banking" name="payment" value="banking" onChange={(e) => setPaymentMethod(e.value)} checked={paymentMethod === 'banking'} />
                            <label htmlFor="banking" className="ml-2">
                                <i className="pi pi-building mr-2"></i>
                                Chuyển khoản ngân hàng
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12 md:col-4">
                <div className="card">
                    <h6>Đơn hàng của bạn</h6>
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex align-items-center mb-3 pb-3 border-bottom-1 surface-border">
                            <img src={item.image} alt={item.name} className="w-4rem h-4rem border-round mr-3" style={{ objectFit: 'cover' }} />
                            <div className="flex-1">
                                <div className="text-900 mb-1">{item.name}</div>
                                <div className="text-600 text-sm">Số lượng: {item.quantity} {item.unit ? `(${item.unit})` : ''}</div>
                            </div>
                            <div className="text-900 font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}</div>
                        </div>
                    ))}

                    <Divider />

                    <div className="flex justify-content-between mb-2">
                        <span>Tạm tính:</span>
                        <span className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-content-between mb-3">
                        <span>Phí vận chuyển:</span>
                        <span className={calculateShipping() === 0 ? 'text-green-500 font-bold' : ''}>{calculateShipping() === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateShipping())}</span>
                    </div>

                    <Divider />

                    <div className="flex justify-content-between mb-4">
                        <span className="font-bold text-xl">Tổng cộng:</span>
                        <span className="font-bold text-xl text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}</span>
                    </div>

                    <Button label="Đặt hàng" icon="pi pi-check" className="w-full" size="large" onClick={handleSubmit} />
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
