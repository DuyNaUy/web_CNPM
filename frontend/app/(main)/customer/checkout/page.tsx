/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import React, { useRef, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI, getStoredUser, cartAPI } from '@/services/api';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { clearLocalCart } from '@/services/localCart';

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    unit: string;
    available_stock?: number;
    is_available?: boolean;
}

const CheckoutPage = () => {
    const router = useRouter();
    const { setCartCount } = useContext(LayoutContext);
    const toast = useRef<Toast>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isBuyNow, setIsBuyNow] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        district: '',
        note: ''
    });

    const [paymentMethod, setPaymentMethod] = useState<string>('cod');

    // Load cart items on mount
    useEffect(() => {
        // Check if user is authenticated
        const user = getStoredUser();
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        
        if (!user || !token) {
            setIsChecking(false);
            toast.current?.show({
                severity: 'warn',
                summary: 'Yêu cầu đăng nhập',
                detail: 'Bạn cần đăng nhập để thanh toán. Vui lòng đăng nhập hoặc đăng ký tài khoản.',
                life: 3000
            });
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
            return;
        }
        
        setIsAuthenticated(true);
        // First check for selectedCheckoutItems (from cart page)
        const selectedCheckoutItems = sessionStorage.getItem('selectedCheckoutItems');
        if (selectedCheckoutItems) {
            try {
                const items = JSON.parse(selectedCheckoutItems);
                // Convert from CartItem format to CheckoutItem format
                const checkoutItems = items.map((item: any) => ({
                    id: item.product_id || item.id,  // Use product_id from cart, or id if from buyNow
                    name: item.product_name || item.name,
                    price: item.product_price || item.price,
                    quantity: item.quantity,
                    image: item.product_image || item.image,
                    unit: item.unit || item.size || ''
                }));
                setCartItems(checkoutItems);
                // Store cart item IDs for deletion after order
                const cartItemIds = items.map((item: any) => item.id);
                setSelectedItemIds(cartItemIds);
                setIsBuyNow(false);
                // Clear after loading
                sessionStorage.removeItem('selectedCheckoutItems');
            } catch (error) {
                console.error('Error parsing selectedCheckoutItems:', error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Không thể tải dữ liệu giỏ hàng',
                    life: 3000
                });
            }
        } else {
            // Check for buyNowItem (from product detail page)
            const buyNowItem = sessionStorage.getItem('buyNowItem');
            if (buyNowItem) {
                try {
                    const item = JSON.parse(buyNowItem);
                    // Normalize buyNowItem format
                    const normalizedItem = {
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image,
                        unit: item.unit || item.size || ''
                    };
                    setCartItems([normalizedItem]);
                    setIsBuyNow(true);
                    // buyNow doesn't need to delete from cart since it doesn't use cart
                    setSelectedItemIds([]);
                    // Clear after loading
                    sessionStorage.removeItem('buyNowItem');
                } catch (error) {
                    console.error('Error parsing buyNowItem:', error);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể tải dữ liệu sản phẩm',
                        life: 3000
                    });
                }
            }
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
        
        // Kiểm tra xem có sản phẩm nào hết hàng không (nếu có thông tin available)
        const unavailableItems = cartItems.filter(item => 
            item.is_available !== undefined && !item.is_available
        );
        
        if (unavailableItems.length > 0) {
            toast.current?.show({
                severity: 'error',
                summary: 'Không thể đặt hàng',
                detail: `Có ${unavailableItems.length} sản phẩm đã hết hàng. Vui lòng quay lại giỏ hàng và xóa các sản phẩm này.`,
                life: 5000
            });
            return;
        }

        try {
            const user = getStoredUser();
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            
            // Check if user is still authenticated
            if (!user || !token) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Phiên đăng nhập hết hạn',
                    detail: 'Vui lòng đăng nhập lại để tiếp tục',
                    life: 3000
                });
                setTimeout(() => {
                    router.push('/auth/login');
                }, 3000);
                return;
            }
            
            // Transform items to include price for backend
            const itemsForOrder = cartItems.map(item => ({
                id: item.id,
                quantity: item.quantity,
                unit: item.unit,
                price: item.price  // Include price so backend uses it
            }));
            
            const orderData = {
                full_name: formData.fullName,
                phone: formData.phone,
                email: formData.email || user?.email || '',
                address: formData.address,
                city: formData.city,
                district: formData.district,
                note: formData.note,
                payment_method: paymentMethod,
                items: itemsForOrder
            };

            const response = await orderAPI.createOrder(orderData);

            if (response && response.id) {
                // Kiểm tra nếu là thanh toán MoMo
                if (paymentMethod === 'momo' && response.payUrl) {
                    // Clear localStorage cart immediately
                    clearLocalCart();
                    
                    // Lưu selectedItemIds vào localStorage để xóa sau khi thanh toán thành công
                    if (selectedItemIds.length > 0) {
                        localStorage.setItem('momoCartItemIds', JSON.stringify(selectedItemIds));
                    }
                    
                    // Delete items from API cart if user is logged in
                    if (selectedItemIds.length > 0) {
                        for (const itemId of selectedItemIds) {
                            try {
                                await cartAPI.removeItem(itemId);
                            } catch (err) {
                                console.error('Error removing item from cart:', err);
                            }
                        }
                    }
                    
                    // Update cart count to 0
                    setCartCount(0);
                    
                    // Redirect đến trang thanh toán MoMo
                    window.location.href = response.payUrl;
                    return;
                }
                
                // Delete items from cart if they came from cart page (for COD payment)
                clearLocalCart();
                if (selectedItemIds.length > 0) {
                    for (const itemId of selectedItemIds) {
                        try {
                            await cartAPI.removeItem(itemId);
                        } catch (err) {
                            console.error('Error removing item from cart:', err);
                        }
                    }
                    // Update cart count in layout
                    setCartCount(0);
                }

                toast.current?.show({
                    severity: 'success',
                    summary: 'Đặt hàng thành công',
                    detail: 'Chờ xác nhận từ cửa hàng',
                    life: 3000
                });

                setTimeout(() => {
                    router.push('/customer/orders');
                }, 3000);
            } else {
                // Check if error is due to authentication
                if (response?.code === 'token_not_valid' || response?.code === 'authentication_failed') {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Phiên đăng nhập hết hạn',
                        detail: 'Vui lòng đăng nhập lại để tiếp tục',
                        life: 3000
                    });
                    setTimeout(() => {
                        router.push('/auth/login');
                    }, 3000);
                } else {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: response?.error || response?.detail || 'Không thể tạo đơn hàng',
                        life: 3000
                    });
                }
            }
        } catch (error: any) {
            console.error('Checkout error:', error);
            
            // Check if error is due to authentication
            if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Phiên đăng nhập hết hạn',
                    detail: 'Vui lòng đăng nhập lại để tiếp tục',
                    life: 3000
                });
                setTimeout(() => {
                    router.push('/auth/login');
                }, 3000);
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: error.message || 'Có lỗi xảy ra khi đặt hàng',
                    life: 3000
                });
            }
        }
    };

    return (
        <div className="grid">
            <Toast ref={toast} />

            {!isAuthenticated && isChecking ? (
                <div className="col-12">
                    <div className="card text-center">
                        <i className="pi pi-spin pi-spinner text-6xl text-400 mb-4"></i>
                        <h3 className="text-900 mb-2">Đang kiểm tra thông tin...</h3>
                    </div>
                </div>
            ) : !isAuthenticated ? (
                <div className="col-12">
                    <div className="card text-center">
                        <i className="pi pi-lock text-6xl text-red-500 mb-4"></i>
                        <h3 className="text-900 mb-2">Vui lòng đăng nhập để tiếp tục</h3>
                        <p className="text-600 mb-4">Bạn cần có tài khoản để thanh toán online</p>
                        <Button label="Đăng nhập" icon="pi pi-sign-in" onClick={() => router.push('/auth/login')} className="mr-2" />
                        <Button label="Đăng ký" icon="pi pi-user-plus" onClick={() => router.push('/auth/register')} severity="info" />
                    </div>
                </div>
            ) : cartItems.length === 0 ? (
                <div className="col-12">
                    <div className="card text-center">
                        <i className="pi pi-shopping-cart text-6xl text-400 mb-4"></i>
                        <h3 className="text-900 mb-2">Không có sản phẩm để thanh toán</h3>
                        <p className="text-600 mb-4">Vui lòng quay lại và thêm sản phẩm vào giỏ hàng</p>
                        <Button label="Quay lại mua sắm" icon="pi pi-arrow-left" onClick={() => router.push('/customer/products')} />
                    </div>
                </div>
            ) : (
                <>
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
                            <img src={item.image || '/demo/images/product/placeholder.png'} alt={item.name} className="w-4rem h-4rem border-round mr-3" style={{ objectFit: 'cover' }} />
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
                </>
            )}
        </div>
    );
};

export default CheckoutPage;
