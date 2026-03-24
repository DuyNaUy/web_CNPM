/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import React, { useRef, useState, useEffect, useContext, useCallback } from 'react';
import Link from 'next/link';
import { cartAPI, getStoredUser } from '@/services/api';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { 
  getLocalCart, 
  updateLocalCartItemQuantity, 
  removeItemFromLocalCart,
  clearLocalCart,
  getLocalCartTotalQuantity
} from '@/services/localCart';

interface CartItem {
    id: number;
    product_id: number;
    product_name: string;
    product_price: number;
    quantity: number;
    product_image: string;
    unit: string;
    total_price: number;
    available_stock: number;
    is_available: boolean;
}

interface Cart {
    id: number;
    items: CartItem[];
    total_price: number;
    total_quantity: number;
}

const CartPage = () => {
    const { setCartCount } = useContext(LayoutContext);
    const [cartData, setCartData] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAnonymousCart, setIsAnonymousCart] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const toast = useRef<Toast>(null);

    const loadCart = useCallback(async () => {
        setLoading(true);
        try {
            const user = getStoredUser();
            
            if (user) {
                // User đã đăng nhập - load từ backend API
                setIsAnonymousCart(false);
                const response = await cartAPI.getCart();
                if (response) {
                    setCartData(response);
                    setCartCount(response.total_quantity || 0);
                }
            } else {
                // User chưa đăng nhập - load từ localStorage
                setIsAnonymousCart(true);
                const localCart = getLocalCart();
                const items = Object.values(localCart).map((item, idx) => ({
                    id: idx,
                    product_id: item.product_id,
                    product_name: item.name,
                    product_price: item.price,
                    quantity: item.qty || item.quantity,
                    product_image: item.image || '/demo/images/product/placeholder.png',
                    unit: item.unit,
                    total_price: (item.price * (item.qty || item.quantity)),
                    available_stock: 999, // Fake stock cho localStorage items
                    is_available: true
                }));
                
                const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
                const totalPrice = items.reduce((sum, item) => sum + item.total_price, 0);
                
                setCartData({
                    id: 0,
                    items: items,
                    total_quantity: totalQuantity,
                    total_price: totalPrice
                });
                setCartCount(totalQuantity);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            
            // Fallback: try to load from localStorage
            const localCart = getLocalCart();
            if (Object.keys(localCart).length > 0) {
                setIsAnonymousCart(true);
                const items = Object.values(localCart).map((item, idx) => ({
                    id: idx,
                    product_id: item.product_id,
                    product_name: item.name,
                    product_price: item.price,
                    quantity: item.qty || item.quantity,
                    product_image: item.image || '/demo/images/product/placeholder.png',
                    unit: item.unit,
                    total_price: (item.price * (item.qty || item.quantity)),
                    available_stock: 999,
                    is_available: true
                }));
                
                setCartData({
                    id: 0,
                    items: items,
                    total_quantity: getLocalCartTotalQuantity(),
                    total_price: items.reduce((sum, item) => sum + item.total_price, 0)
                });
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Không thể tải giỏ hàng',
                    life: 3000
                });
            }
        } finally {
            setLoading(false);
        }
    }, [setCartCount]);

    useEffect(() => {
        void loadCart();
    }, [loadCart]);

    const updateQuantity = async (itemId: number, newQuantity: number) => {
        if (newQuantity === 0) {
            confirmRemove(itemId);
            return;
        }

        try {
            if (isAnonymousCart) {
                // Update localStorage cart
                const item = cartData?.items.find(i => i.id === itemId);
                if (item) {
                    updateLocalCartItemQuantity(item.product_id, newQuantity);
                    
                    // Reload cart from localStorage
                    loadCart();
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Đã cập nhật',
                        detail: 'Số lượng sản phẩm đã được cập nhật',
                        life: 2000
                    });
                }
            } else {
                // Update API cart
                const response = await cartAPI.updateItem(itemId, newQuantity);
                if (response) {
                    setCartData(response);
                    setCartCount(response.total_quantity || 0);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Đã cập nhật',
                        detail: 'Số lượng sản phẩm đã được cập nhật',
                        life: 2000
                    });
                }
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể cập nhật số lượng',
                life: 3000
            });
            // Reload cart to sync state
            loadCart();
        }
    };

    const confirmRemove = (itemId: number) => {
        const item = cartData?.items.find((i) => i.id === itemId);
        confirmDialog({
            message: `Bạn có chắc chắn muốn xóa "${item?.product_name}" khỏi giỏ hàng?`,
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: () => removeItem(itemId),
            reject: () => {},
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const removeItem = async (itemId: number) => {
        try {
            if (isAnonymousCart) {
                // Remove from localStorage cart
                const item = cartData?.items.find(i => i.id === itemId);
                if (item) {
                    removeItemFromLocalCart(item.product_id);
                    loadCart();
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Đã xóa',
                        detail: 'Sản phẩm đã được xóa khỏi giỏ hàng',
                        life: 3000
                    });
                }
            } else {
                // Remove from API cart
                const response = await cartAPI.removeItem(itemId);
                if (response) {
                    setCartData(response);
                    // Update topbar cart count
                    if (response.total_quantity !== undefined) {
                        setCartCount(response.total_quantity);
                    }
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Đã xóa',
                        detail: 'Sản phẩm đã được xóa khỏi giỏ hàng',
                        life: 3000
                    });
                }
            }
        } catch (error) {
            console.error('Error removing item:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể xóa sản phẩm',
                life: 3000
            });
        }
    };

    const clearCart = () => {
        confirmDialog({
            message: 'Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?',
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    if (isAnonymousCart) {
                        // Clear localStorage cart
                        clearLocalCart();
                        setCartData({
                            id: 0,
                            items: [],
                            total_quantity: 0,
                            total_price: 0
                        });
                        setCartCount(0);
                    } else {
                        // Clear API cart
                        const response = await cartAPI.clearCart();
                        if (response) {
                            setCartData(response);
                            // Update topbar cart count
                            if (response.total_quantity !== undefined) {
                                setCartCount(response.total_quantity);
                            }
                        }
                    }
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Đã xóa',
                        detail: 'Giỏ hàng đã được làm trống',
                        life: 3000
                    });
                } catch (error) {
                    console.error('Error clearing cart:', error);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể xóa giỏ hàng',
                        life: 3000
                    });
                }
            },
            reject: () => {},
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const imageBodyTemplate = (rowData: CartItem) => {
        return <img src={rowData.product_image} alt={rowData.product_name} className="shadow-2 border-round" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />;
    };

    const productNameBodyTemplate = (rowData: CartItem) => {
        return (
            <div>
                <div className="font-semibold">{rowData.product_name}</div>
                <div className="text-sm text-500">Size: {rowData.unit}</div>
                {!rowData.is_available && (
                    <div className="text-sm text-red-500 font-semibold mt-1">
                        <i className="pi pi-exclamation-triangle mr-1"></i>
                        Hết hàng (Còn {rowData.available_stock})
                    </div>
                )}
            </div>
        );
    };

    const priceBodyTemplate = (rowData: CartItem) => {
        const price = rowData.product_price || 0;
        return new Intl.NumberFormat('vi-VN').format(price) + ' VND';
    };

    const quantityBodyTemplate = (rowData: CartItem) => {
        return (
            <InputNumber
                value={rowData.quantity}
                onValueChange={(e) => updateQuantity(rowData.id, e.value || 0)}
                showButtons
                min={0}
                max={rowData.available_stock}
                buttonLayout="horizontal"
                decrementButtonClassName="p-button-danger"
                incrementButtonClassName="p-button-success"
                incrementButtonIcon="pi pi-plus"
                decrementButtonIcon="pi pi-minus"
                disabled={!rowData.is_available}
            />
        );
    };

    const totalPriceBodyTemplate = (rowData: CartItem) => {
        const total = rowData.total_price || 0;
        return new Intl.NumberFormat('vi-VN').format(total) + ' VND';
    };

    const actionBodyTemplate = (rowData: CartItem) => {
        const isSelected = selectedItems.has(rowData.id);
        return (
            <div className="flex gap-2">
                {isSelected && (
                    <Button icon="pi pi-trash" rounded outlined severity="warning" onClick={() => confirmRemove(rowData.id)} tooltip="Xóa sản phẩm này" tooltipOptions={{ position: 'top' }} />
                )}
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmRemove(rowData.id)} tooltip="Xóa sản phẩm" tooltipOptions={{ position: 'top' }} />
            </div>
        );
    };

    const onSelectionChange = (e: any) => {
        // e.value contains the array of selected CartItem objects
        const selectedIds = new Set<number>(e.value.map((item: CartItem) => item.id));
        setSelectedItems(selectedIds);
    };

    const removeSelectedItems = () => {
        if (selectedItems.size === 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng chọn sản phẩm để xóa',
                life: 3000
            });
            return;
        }

        confirmDialog({
            message: `Bạn có chắc chắn muốn xóa ${selectedItems.size} sản phẩm đã chọn?`,
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    if (isAnonymousCart) {
                        // Remove from localStorage cart
                        for (const itemId of Array.from(selectedItems)) {
                            const item = cartData?.items.find(i => i.id === itemId);
                            if (item) {
                                removeItemFromLocalCart(item.product_id);
                            }
                        }
                        await loadCart();
                    } else {
                        // Remove from API cart
                        for (const itemId of Array.from(selectedItems)) {
                            await cartAPI.removeItem(itemId);
                        }
                        await loadCart();
                        
                        // Update topbar cart count after deletion
                        const updatedCart = await cartAPI.getCart();
                        if (updatedCart && updatedCart.total_quantity !== undefined) {
                            setCartCount(updatedCart.total_quantity);
                        }
                    }
                    
                    setSelectedItems(new Set());
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Đã xóa',
                        detail: 'Các sản phẩm đã được xóa khỏi giỏ hàng',
                        life: 3000
                    });
                } catch (error) {
                    console.error('Error removing items:', error);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể xóa sản phẩm',
                        life: 3000
                    });
                }
            },
            reject: () => {},
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const calculateSubtotal = () => {
        // Chỉ tính những sản phẩm được chọn VÀ còn hàng
        if (selectedItems.size === 0) return 0;
        
        return (cartData?.items || [])
            .filter(item => selectedItems.has(item.id) && item.is_available)
            .reduce((sum, item) => sum + (item.total_price || 0), 0);
    };

    const calculateShipping = () => {
        const subtotal = calculateSubtotal();
        return subtotal >= 500000 ? 0 : 30000; // Free shipping for orders over 500k
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateShipping();
    };
    
    const hasUnavailableItems = () => {
        return (cartData?.items || [])
            .filter(item => selectedItems.has(item.id))
            .some(item => !item.is_available);
    };
    
    const getAvailableSelectedItems = () => {
        return (cartData?.items || [])
            .filter(item => selectedItems.has(item.id) && item.is_available);
    };

    if (loading) {
        return (
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <p>Đang tải giỏ hàng...</p>
                    </div>
                </div>
            </div>
        );
    }

    const cartItems = cartData?.items || [];

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="col-12">
                <div className="card">
                    {isAnonymousCart && (
                        <div className="bg-blue-100 border-1 border-blue-300 border-round p-3 mb-4 flex align-items-center gap-3">
                            <i className="pi pi-info-circle text-blue-600"></i>
                            <div>
                                <div className="font-semibold text-blue-900">Bạn đang duyệt dưới dạng khách vãng lai</div>
                                <div className="text-sm text-blue-700">Giỏ hàng của bạn được lưu trên thiết bị này. Đăng nhập để đồng bộ hóa giỏ hàng trên tất cả thiết bị.</div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h5 className="m-0">Giỏ Hàng Của Bạn</h5>
                        <div className="flex gap-2">
                            <Link href="/customer/products">
                                <Button label="Tiếp tục mua sắm" icon="pi pi-arrow-left" outlined />
                            </Link>
                            {selectedItems.size > 0 && <Button label={`Xóa (${selectedItems.size})`} icon="pi pi-trash" severity="danger" onClick={removeSelectedItems} />}
                            {cartItems.length > 0 && <Button label="Xóa tất cả" icon="pi pi-trash" severity="danger" outlined onClick={clearCart} />}
                        </div>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="text-center py-8">
                            <i className="pi pi-shopping-cart text-6xl text-400 mb-4"></i>
                            <h3 className="text-600">Giỏ hàng của bạn đang trống</h3>
                            <p className="text-500 mb-4">Hãy thêm một số sản phẩm vào giỏ hàng của bạn!</p>
                            <Link href="/customer/products">
                                <Button label="Mua sắm ngay" icon="pi pi-shopping-bag" />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <DataTable 
                                value={cartItems} 
                                responsiveLayout="scroll" 
                                selectionMode="multiple"
                                selection={cartItems.filter(item => selectedItems.has(item.id))}
                                onSelectionChange={onSelectionChange}
                                rowClassName={(data) => !data.is_available ? 'surface-100' : ''}
                            >
                                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                                <Column header="Sản phẩm" body={imageBodyTemplate} style={{ width: '100px' }} />
                                <Column header="Tên sản phẩm & Size" body={productNameBodyTemplate} style={{ minWidth: '200px' }} />
                                <Column header="Giá" body={priceBodyTemplate} style={{ minWidth: '150px' }} />
                                <Column header="Số lượng" body={quantityBodyTemplate} style={{ minWidth: '180px' }} />
                                <Column header="Tổng" body={totalPriceBodyTemplate} style={{ minWidth: '150px' }} />
                            </DataTable>

                            <div className="grid mt-4">
                                <div className="col-12 md:col-8">
                                    <div className="surface-100 p-4 border-round">
                                        <h6 className="mt-0">Ghi chú đơn hàng</h6>
                                        <textarea className="w-full p-3 border-round surface-overlay border-1 surface-border" rows={3} placeholder="Ghi chú về đơn hàng, ví dụ: thời gian giao hàng, địa chỉ cụ thể..." />
                                    </div>
                                </div>

                                <div className="col-12 md:col-4">
                                    <div className="surface-100 p-4 border-round">
                                        <h6 className="mt-0">Tổng đơn hàng</h6>
                                        <div className="flex justify-content-between mb-2">
                                            <span>Tạm tính:</span>
                                            <span className="font-bold">{new Intl.NumberFormat('vi-VN').format(calculateSubtotal())} VND</span>
                                        </div>
                                        {selectedItems.size > 0 && (
                                            <>
                                                {hasUnavailableItems() && (
                                                    <div className="bg-red-100 border-round p-3 mb-3">
                                                        <div className="flex align-items-center gap-2 text-red-700 mb-2">
                                                            <i className="pi pi-exclamation-triangle"></i>
                                                            <span className="font-semibold">Có sản phẩm hết hàng!</span>
                                                        </div>
                                                        <p className="text-sm text-red-600 m-0">
                                                            Một số sản phẩm bạn chọn đã hết hàng. Vui lòng bỏ chọn hoặc xóa các sản phẩm này để tiếp tục.
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="flex justify-content-between mb-2">
                                                    <span>Phí vận chuyển:</span>
                                                    <span className={calculateShipping() === 0 ? 'text-green-500 font-bold' : ''}>
                                                        {calculateShipping() === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN').format(calculateShipping()) + ' VND'}
                                                    </span>
                                                </div>
                                                <div className="border-top-1 surface-border pt-2 mb-3"></div>
                                                <div className="flex justify-content-between mb-3">
                                                    <span className="font-bold text-xl">Tổng cộng:</span>
                                                    <span className="font-bold text-xl text-primary">{new Intl.NumberFormat('vi-VN').format(calculateTotal())} VND</span>
                                                </div>
                                                
                                                <Button 
                                                    label="Thanh toán" 
                                                    icon="pi pi-credit-card" 
                                                    className="w-full" 
                                                    size="large"
                                                    disabled={hasUnavailableItems() || calculateTotal() === 0}
                                                    onClick={() => {
                                                        if (hasUnavailableItems()) {
                                                            toast.current?.show({
                                                                severity: 'error',
                                                                summary: 'Không thể thanh toán',
                                                                detail: 'Vui lòng xóa các sản phẩm hết hàng khỏi giỏ hàng trước khi thanh toán',
                                                                life: 3000
                                                            });
                                                            return;
                                                        }
                                                        
                                                        const availableItems = getAvailableSelectedItems();
                                                        if (availableItems.length === 0) {
                                                            toast.current?.show({
                                                                severity: 'warn',
                                                                summary: 'Cảnh báo',
                                                                detail: 'Không có sản phẩm nào để thanh toán',
                                                                life: 3000
                                                            });
                                                            return;
                                                        }
                                                        
                                                        // Save selected items to sessionStorage
                                                        sessionStorage.setItem('selectedCheckoutItems', JSON.stringify(availableItems));
                                                        // Navigate to checkout
                                                        window.location.href = '/customer/checkout';
                                                    }}
                                                />
                                            </>
                                        )}
                                        {selectedItems.size === 0 && (
                                            <div className="text-center text-600 p-4">
                                                <p className="text-sm">Vui lòng chọn sản phẩm để thanh toán</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartPage;
