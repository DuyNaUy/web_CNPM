/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import React, { useRef, useState } from 'react';
import Link from 'next/link';

interface CartItem {
    id: number;
    productId: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    stock: number;
}

const CartPage = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([
        {
            id: 1,
            productId: 1,
            name: 'Cải Thảo Hữu Cơ',
            price: 25000,
            quantity: 2,
            image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300',
            stock: 150
        },
        {
            id: 2,
            productId: 4,
            name: 'Trứng Gà Organic',
            price: 65000,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300',
            stock: 200
        },
        {
            id: 3,
            productId: 5,
            name: 'Gạo ST25',
            price: 120000,
            quantity: 3,
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300',
            stock: 100
        }
    ]);

    const toast = useRef<Toast>(null);

    const updateQuantity = (itemId: number, newQuantity: number) => {
        if (newQuantity === 0) {
            confirmRemove(itemId);
            return;
        }

        setCartItems((prev) =>
            prev.map((item) => {
                if (item.id === itemId) {
                    if (newQuantity > item.stock) {
                        toast.current?.show({
                            severity: 'warn',
                            summary: 'Cảnh báo',
                            detail: `Chỉ còn ${item.stock} sản phẩm trong kho`,
                            life: 3000
                        });
                        return item;
                    }
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );

        toast.current?.show({
            severity: 'success',
            summary: 'Đã cập nhật',
            detail: 'Số lượng sản phẩm đã được cập nhật',
            life: 2000
        });
    };

    const confirmRemove = (itemId: number) => {
        const item = cartItems.find((i) => i.id === itemId);
        confirmDialog({
            message: `Bạn có chắc chắn muốn xóa "${item?.name}" khỏi giỏ hàng?`,
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: () => removeItem(itemId),
            reject: () => {},
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const removeItem = (itemId: number) => {
        setCartItems((prev) => prev.filter((item) => item.id !== itemId));
        toast.current?.show({
            severity: 'success',
            summary: 'Đã xóa',
            detail: 'Sản phẩm đã được xóa khỏi giỏ hàng',
            life: 3000
        });
    };

    const clearCart = () => {
        confirmDialog({
            message: 'Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?',
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                setCartItems([]);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Đã xóa',
                    detail: 'Giỏ hàng đã được làm trống',
                    life: 3000
                });
            },
            reject: () => {},
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const imageBodyTemplate = (rowData: CartItem) => {
        return <img src={rowData.image} alt={rowData.name} className="shadow-2 border-round" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />;
    };

    const priceBodyTemplate = (rowData: CartItem) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.price);
    };

    const quantityBodyTemplate = (rowData: CartItem) => {
        return (
            <InputNumber
                value={rowData.quantity}
                onValueChange={(e) => updateQuantity(rowData.id, e.value || 0)}
                showButtons
                min={0}
                max={rowData.stock}
                buttonLayout="horizontal"
                decrementButtonClassName="p-button-danger"
                incrementButtonClassName="p-button-success"
                incrementButtonIcon="pi pi-plus"
                decrementButtonIcon="pi pi-minus"
            />
        );
    };

    const totalPriceBodyTemplate = (rowData: CartItem) => {
        const total = rowData.price * rowData.quantity;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total);
    };

    const actionBodyTemplate = (rowData: CartItem) => {
        return <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmRemove(rowData.id)} />;
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const calculateShipping = () => {
        const subtotal = calculateSubtotal();
        return subtotal >= 500000 ? 0 : 30000; // Free shipping for orders over 500k
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateShipping();
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="col-12">
                <div className="card">
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h5 className="m-0">Giỏ Hàng Của Bạn</h5>
                        <div className="flex gap-2">
                            <Link href="/customer/products">
                                <Button label="Tiếp tục mua sắm" icon="pi pi-arrow-left" outlined />
                            </Link>
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
                            <DataTable value={cartItems} responsiveLayout="scroll">
                                <Column header="Sản phẩm" body={imageBodyTemplate} style={{ width: '100px' }} />
                                <Column field="name" header="Tên sản phẩm" style={{ minWidth: '200px' }} />
                                <Column header="Giá" body={priceBodyTemplate} style={{ minWidth: '150px' }} />
                                <Column header="Số lượng" body={quantityBodyTemplate} style={{ minWidth: '180px' }} />
                                <Column header="Tổng" body={totalPriceBodyTemplate} style={{ minWidth: '150px' }} />
                                <Column body={actionBodyTemplate} exportable={false} style={{ width: '100px' }} />
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
                                            <span className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateSubtotal())}</span>
                                        </div>
                                        <div className="flex justify-content-between mb-2">
                                            <span>Phí vận chuyển:</span>
                                            <span className={calculateShipping() === 0 ? 'text-green-500 font-bold' : ''}>
                                                {calculateShipping() === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateShipping())}
                                            </span>
                                        </div>
                                        <div className="border-top-1 surface-border pt-2 mb-3"></div>
                                        <div className="flex justify-content-between mb-3">
                                            <span className="font-bold text-xl">Tổng cộng:</span>
                                            <span className="font-bold text-xl text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}</span>
                                        </div>
                                        {calculateSubtotal() < 500000 && (
                                            <p className="text-xs text-500 mb-3">Mua thêm {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(500000 - calculateSubtotal())} để được miễn phí vận chuyển!</p>
                                        )}
                                        <Link href="/customer/checkout">
                                            <Button label="Thanh toán" icon="pi pi-credit-card" className="w-full" size="large" />
                                        </Link>
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
