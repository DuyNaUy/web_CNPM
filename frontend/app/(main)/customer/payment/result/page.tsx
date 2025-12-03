/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import React, { useEffect, useState, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { orderAPI, cartAPI } from '@/services/api';
import { LayoutContext } from '@/layout/context/layoutcontext';

const PaymentResultPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setCartCount } = useContext(LayoutContext);
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');
    const [message, setMessage] = useState('');
    const [orderCode, setOrderCode] = useState('');

    useEffect(() => {
        const checkPaymentStatus = async () => {
            try {
                // Lấy parameters từ URL
                const orderId = searchParams.get('orderId');
                const resultCode = searchParams.get('resultCode');
                const message = searchParams.get('message');

                if (!orderId || !resultCode) {
                    setPaymentStatus('failed');
                    setMessage('Không tìm thấy thông tin thanh toán');
                    setLoading(false);
                    return;
                }

                // Kiểm tra kết quả từ MoMo
                if (resultCode === '0') {
                    // Thanh toán thành công
                    setPaymentStatus('success');
                    setMessage(message || 'Thanh toán thành công');
                    
                    // Gọi API để verify trạng thái
                    try {
                        const response = await orderAPI.checkMoMoStatus(orderId);
                        
                        if (response.order) {
                            setOrderCode(response.order.order_code);
                        }
                    } catch (error) {
                        console.error('Error verifying payment:', error);
                    }

                    // Xóa items khỏi giỏ hàng nếu đơn hàng được tạo từ cart
                    try {
                        const momoCartItemIds = sessionStorage.getItem('momoCartItemIds');
                        if (momoCartItemIds) {
                            const itemIds = JSON.parse(momoCartItemIds);
                            // Xóa từng item khỏi cart
                            for (const itemId of itemIds) {
                                try {
                                    await cartAPI.removeItem(itemId);
                                } catch (err) {
                                    console.error('Error removing item from cart:', err);
                                }
                            }
                            // Cập nhật số lượng giỏ hàng
                            try {
                                const cartResponse = await cartAPI.getCart();
                                if (cartResponse && cartResponse.items) {
                                    setCartCount(cartResponse.items.length);
                                } else {
                                    setCartCount(0);
                                }
                            } catch (err) {
                                console.error('Error updating cart count:', err);
                                setCartCount(0);
                            }
                            // Xóa dữ liệu đã lưu
                            sessionStorage.removeItem('momoCartItemIds');
                        }
                    } catch (error) {
                        console.error('Error clearing cart items:', error);
                    }
                } else {
                    // Thanh toán thất bại
                    setPaymentStatus('failed');
                    setMessage(message || 'Thanh toán thất bại');
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
                setPaymentStatus('failed');
                setMessage('Có lỗi xảy ra khi kiểm tra trạng thái thanh toán');
            } finally {
                setLoading(false);
            }
        };

        checkPaymentStatus();
    }, [searchParams]);

    if (loading) {
        return (
            <div className="grid">
                <div className="col-12">
                    <Card>
                        <div className="text-center py-8">
                            <ProgressSpinner />
                            <h3 className="mt-4">Đang xử lý thanh toán...</h3>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="grid">
            <div className="col-12">
                <Card>
                    {paymentStatus === 'success' ? (
                        <div className="text-center py-6">
                            <div className="mb-4">
                                <i className="pi pi-check-circle text-green-500" style={{ fontSize: '6rem' }}></i>
                            </div>
                            <h2 className="text-green-600 mb-3">Thanh toán thành công!</h2>
                            <p className="text-xl mb-2">{message}</p>
                            {orderCode && (
                                <p className="text-lg text-600 mb-4">
                                    Mã đơn hàng: <strong>{orderCode}</strong>
                                </p>
                            )}
                            <p className="text-600 mb-4">
                                Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn ngay.
                            </p>
                            <div className="flex justify-content-center gap-3 mt-5">
                                <Button
                                    label="Xem đơn hàng"
                                    icon="pi pi-shopping-bag"
                                    onClick={() => router.push('/customer/orders')}
                                    severity="success"
                                />
                                <Button
                                    label="Tiếp tục mua sắm"
                                    icon="pi pi-shopping-cart"
                                    onClick={() => router.push('/customer/products')}
                                    outlined
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <div className="mb-4">
                                <i className="pi pi-times-circle text-red-500" style={{ fontSize: '6rem' }}></i>
                            </div>
                            <h2 className="text-red-600 mb-3">Thanh toán thất bại</h2>
                            <p className="text-xl mb-2">{message}</p>
                            <p className="text-600 mb-4">
                                Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
                            </p>
                            <div className="flex justify-content-center gap-3 mt-5">
                                <Button
                                    label="Thử lại"
                                    icon="pi pi-refresh"
                                    onClick={() => router.push('/customer/checkout')}
                                    severity="danger"
                                />
                                <Button
                                    label="Về trang chủ"
                                    icon="pi pi-home"
                                    onClick={() => router.push('/customer')}
                                    outlined
                                />
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default PaymentResultPage;
