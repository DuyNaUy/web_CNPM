/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { useRouter } from 'next/navigation';
import { Badge } from 'primereact/badge';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Avatar } from 'primereact/avatar';
import { Dropdown } from 'primereact/dropdown';
import { authAPI, getStoredUser, removeAuthTokens, categoryAPI, cartAPI } from '../services/api';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar, role, setRole, cartCount, setCartCount } = useContext(LayoutContext);
    const router = useRouter();
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const toast = useRef<Toast>(null);

    // Profile dialog states
    const [profileDialogVisible, setProfileDialogVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        address: ''
    });

    // Load user data
    useEffect(() => {
        const storedUser = getStoredUser();
        if (storedUser) {
            setUser(storedUser);
            setFormData({
                full_name: storedUser.full_name || '',
                phone: storedUser.phone || '',
                address: storedUser.address || ''
            });
        }
    }, []);

    // Load categories khi role là customer
    useEffect(() => {
        if (role === 'customer') {
            loadCategories();
            loadCartCount();
        }
    }, [role]);

    const loadCartCount = async () => {
        try {
            const response = await cartAPI.getCart();
            if (response && response.total_quantity) {
                setCartCount(response.total_quantity);
            }
        } catch (error) {
            console.error('Error loading cart count:', error);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await categoryAPI.getActive();
            if (response && Array.isArray(response)) {
                setCategories(response);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const handleCategoryChange = (categoryId: number | null) => {
        if (categoryId === null) {
            router.push('/customer/products');
        } else {
            router.push(`/customer/products?category=${categoryId}`);
        }
        setSelectedCategory(categoryId);
    };

    const handleShowProfile = () => {
        setProfileDialogVisible(true);
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            const response = await authAPI.updateProfile(formData);

            if (response.success) {
                // Update local user data
                const updatedUser = { ...user, ...formData };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));

                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Cập nhật thông tin thành công!',
                    life: 3000
                });

                setProfileDialogVisible(false);
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: response.message || 'Cập nhật thất bại!',
                    life: 3000
                });
            }
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Có lỗi xảy ra!',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();

            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đăng xuất thành công!',
                life: 2000
            });

            // Redirect to login
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (error) {
            // Even if logout API fails, still clear local data
            removeAuthTokens();
            router.push('/auth/login');
        }
    };

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    return (
        <>
            <Toast ref={toast} />
            <div className="layout-topbar">
                <Link href={role === 'customer' ? '/customer' : '/'} className="layout-topbar-logo">
                    <img src="/layout/images/logo1.png" width="47.22px" height={'35px'} alt="logo" />
                    <span className="hidden md:inline-block font-bold" style={{ fontSize: '1.2rem', color: role === 'admin' ? '#e91e63' : '#ff69b4' }}>
                        {role === 'admin' ? 'TEDDY SHOP ADMIN' : 'TEDDY SHOP 🧸'}
                    </span>
                </Link>

                {/* Nút menu 3 gạch - chỉ hiển thị cho admin */}
                {role === 'admin' && (
                    <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                        <i className="pi pi-bars" />
                    </button>
                )}

                {/* Menu chức năng khách hàng - hiển thị khi role là customer */}
                {role === 'customer' && (
                    <div className="flex-1 flex align-items-center justify-content-center gap-2 mx-3">
                        <Link href="/customer" className="p-link layout-topbar-button hover:surface-200 border-round transition-colors transition-duration-300" style={{ padding: '0.75rem 1rem' }}>
                            <i className="pi pi-home" style={{ fontSize: '1.1rem', color: '#ff69b4' }}></i>
                            <span className="hidden lg:inline-block ml-2 font-semibold" style={{ color: '#333' }}>Trang Chủ</span>
                        </Link>
                        
                        <div className="hidden md:flex align-items-center" style={{ minWidth: '220px' }}>
                            <Dropdown
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.value)}
                                options={[
                                    { label: '🎯 Tất cả sản phẩm', value: null },
                                    ...categories.map((cat) => ({
                                        label: cat.name,
                                        value: cat.id
                                    }))
                                ]}
                                placeholder="📂 Chọn danh mục"
                                className="w-full"
                                style={{
                                    backgroundColor: '#fff',
                                    borderColor: '#ff69b4',
                                    borderWidth: '2px',
                                    borderRadius: '10px',
                                    color: '#333',
                                    fontWeight: '500'
                                }}
                            />
                        </div>
                        
                        <Link href="/customer/products" className="p-link layout-topbar-button hover:surface-200 border-round transition-colors transition-duration-300" style={{ padding: '0.75rem 1rem' }}>
                            <i className="pi pi-shopping-bag" style={{ fontSize: '1.1rem', color: '#ff69b4' }}></i>
                            <span className="hidden lg:inline-block ml-2 font-semibold" style={{ color: '#333' }}>Sản Phẩm</span>
                        </Link>
                        
                        <Link href="/customer/cart" className="p-link layout-topbar-button p-overlay-badge hover:surface-200 border-round transition-colors transition-duration-300" style={{ padding: '0.75rem 1rem' }}>
                            <i className="pi pi-shopping-cart" style={{ fontSize: '1.1rem', color: '#ff69b4' }}></i>
                            {cartCount > 0 && <Badge value={cartCount} severity="danger" style={{ minWidth: '1.5rem', minHeight: '1.5rem', fontSize: '0.75rem' }}></Badge>}
                            <span className="hidden lg:inline-block ml-2 font-semibold" style={{ color: '#333' }}>Giỏ Hàng</span>
                        </Link>
                        
                        <Link href="/customer/orders" className="p-link layout-topbar-button hover:surface-200 border-round transition-colors transition-duration-300" style={{ padding: '0.75rem 1rem' }}>
                            <i className="pi pi-list" style={{ fontSize: '1.1rem', color: '#ff69b4' }}></i>
                            <span className="hidden lg:inline-block ml-2 font-semibold" style={{ color: '#333' }}>Đơn Hàng</span>
                        </Link>
                    </div>
                )}

                {/* Hiển thị nút đăng nhập nếu chưa đăng nhập, ngược lại hiển thị menu user */}
                {!user ? (
                    <Link href="/auth/login">
                        <Button 
                            label="Đăng nhập" 
                            icon="pi pi-sign-in" 
                            className="p-button-rounded p-button-outlined"
                            style={{ 
                                borderColor: '#ff69b4',
                                color: '#ff69b4',
                                fontWeight: '600',
                                padding: '0.5rem 1.5rem'
                            }}
                        />
                    </Link>
                ) : (
                    <>
                        <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                            <Avatar 
                                icon="pi pi-user" 
                                size="normal" 
                                shape="circle" 
                                style={{ 
                                    backgroundColor: '#ff69b4', 
                                    color: '#fff', 
                                    width: '38px', 
                                    height: '38px',
                                    boxShadow: '0 2px 8px rgba(255, 105, 180, 0.3)'
                                }} 
                            />
                            <span className="hidden md:inline-block ml-2 font-semibold" style={{ color: '#333' }}>{user.full_name}</span>
                            <i className="pi pi-angle-down ml-2" style={{ fontSize: '0.9rem', color: '#666' }}></i>
                        </button>

                        <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                            {/* User Info Header */}
                            <div className="px-3 py-3 border-bottom-1 surface-border" style={{ background: 'linear-gradient(135deg, #ffb6c1 0%, #ff69b4 100%)' }}>
                                <div className="flex align-items-center gap-3">
                                    <Avatar 
                                        icon="pi pi-user" 
                                        size="large" 
                                        shape="circle" 
                                        style={{ 
                                            backgroundColor: '#fff', 
                                            color: '#ff69b4', 
                                            width: '48px', 
                                            height: '48px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                        }} 
                                    />
                                    <div className="flex flex-column">
                                        <span className="font-bold text-white" style={{ fontSize: '1.1rem' }}>{user.full_name}</span>
                                        <span className="text-white text-sm opacity-90">{user.email}</span>
                                    </div>
                                </div>
                            </div>

                            <button type="button" className="p-link layout-topbar-button hover:surface-100 transition-colors transition-duration-200" onClick={handleShowProfile} style={{ padding: '1rem 1.5rem' }}>
                                <i className="pi pi-user" style={{ color: '#ff69b4', fontSize: '1.1rem' }}></i>
                                <span className="ml-2 font-semibold" style={{ color: '#333' }}>Thông tin cá nhân</span>
                            </button>
                            <button type="button" className="p-link layout-topbar-button hover:surface-100 transition-colors transition-duration-200" onClick={handleLogout} style={{ padding: '1rem 1.5rem' }}>
                                <i className="pi pi-sign-out" style={{ color: '#ff69b4', fontSize: '1.1rem' }}></i>
                                <span className="ml-2 font-semibold" style={{ color: '#333' }}>Đăng xuất</span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Profile Dialog */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-user text-primary" style={{ fontSize: '1.5rem' }}></i>
                        <span>Thông Tin Tài Khoản</span>
                    </div>
                }
                visible={profileDialogVisible}
                style={{ width: '550px' }}
                onHide={() => setProfileDialogVisible(false)}
                modal
                draggable={false}
                resizable={false}
            >
                <div className="flex flex-column gap-4">
                    {/* Avatar and Email (Read-only) */}
                    <div className="flex flex-column align-items-center gap-3 p-4 surface-50 border-round">
                        <Avatar
                            icon="pi pi-user"
                            size="xlarge"
                            shape="circle"
                            style={{
                                backgroundColor: 'var(--primary-color)',
                                color: '#fff',
                                width: '80px',
                                height: '80px',
                                fontSize: '2rem'
                            }}
                        />
                        <div className="text-center">
                            <div className="font-bold text-2xl mb-2">{user?.full_name || 'User'}</div>
                            <div className="text-600 text-lg mb-2">{user?.email}</div>
                            <div className="text-sm">
                                <span
                                    className="px-3 py-1 border-round font-semibold"
                                    style={{
                                        backgroundColor: user?.role === 'admin' ? 'var(--red-100)' : 'var(--blue-100)',
                                        color: user?.role === 'admin' ? 'var(--red-700)' : 'var(--blue-700)'
                                    }}
                                >
                                    <i className={`pi ${user?.role === 'admin' ? 'pi-shield' : 'pi-user'} mr-2`}></i>
                                    {user?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="flex flex-column gap-3">
                        <div className="text-lg font-semibold mb-2 border-bottom-1 surface-border pb-2">
                            <i className="pi pi-pencil mr-2 text-primary"></i>
                            Chỉnh sửa thông tin
                        </div>

                        <div className="flex flex-column gap-2">
                            <label htmlFor="full_name" className="font-semibold text-900">
                                <i className="pi pi-user mr-2"></i>
                                Họ và Tên <span className="text-red-500">*</span>
                            </label>
                            <InputText id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Nhập họ và tên" className="p-inputtext-lg" />
                        </div>

                        <div className="flex flex-column gap-2">
                            <label htmlFor="phone" className="font-semibold text-900">
                                <i className="pi pi-phone mr-2"></i>
                                Số điện thoại <span className="text-red-500">*</span>
                            </label>
                            <InputText id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Nhập số điện thoại" maxLength={10} className="p-inputtext-lg" />
                        </div>

                        <div className="flex flex-column gap-2">
                            <label htmlFor="address" className="font-semibold text-900">
                                <i className="pi pi-map-marker mr-2"></i>
                                Địa chỉ
                            </label>
                            <InputText id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Nhập địa chỉ" className="p-inputtext-lg" />
                        </div>

                        <div className="surface-50 p-3 border-round">
                            <div className="text-sm font-semibold text-600 mb-2">Thông tin không thể thay đổi</div>
                            <div className="flex flex-column gap-2">
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-envelope text-500"></i>
                                    <span className="font-semibold text-500">Email:</span>
                                    <span className="text-900">{user?.email || '---'}</span>
                                </div>
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-id-card text-500"></i>
                                    <span className="font-semibold text-500">Username:</span>
                                    <span className="text-900">{user?.username || '---'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-content-end mt-4 pt-3 border-top-1 surface-border">
                        <Button label="Hủy" icon="pi pi-times" severity="secondary" onClick={() => setProfileDialogVisible(false)} disabled={loading} className="px-4" />
                        <Button label="Lưu thay đổi" icon="pi pi-check" onClick={handleUpdateProfile} loading={loading} disabled={loading || !formData.full_name || !formData.phone} className="px-4" />
                    </div>
                </div>
            </Dialog>
        </>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
