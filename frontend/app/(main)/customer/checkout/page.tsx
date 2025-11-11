/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

const CheckoutPage = () => {
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [cartItems] = useState<CartItem[]>([
        {
            id: 1,
            name: 'Cải Thảo Hữu Cơ',
            price: 25000,
            quantity: 2,
            image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300'
        },
        {
            id: 2,
            name: 'Trứng Gà Organic',
            price: 65000,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300'
        },
        {
            id: 3,
            name: 'Gạo ST25',
            price: 120000,
            quantity: 3,
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300'
        }
    ]);

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

    const handleSubmit = () => {
        if (!formData.fullName || !formData.phone || !formData.address) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Thiếu thông tin',
                detail: 'Vui lòng điền đầy đủ thông tin giao hàng',
                life: 3000
            });
            return;
        }

        toast.current?.show({
            severity: 'success',
            summary: 'Đặt hàng thành công',
            detail: 'Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn sớm!',
            life: 3000
        });

        setTimeout(() => {
            router.push('/customer/orders');
        }, 2000);
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
                                <div className="text-600 text-sm">Số lượng: {item.quantity}</div>
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
