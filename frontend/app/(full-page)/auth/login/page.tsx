/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState, useRef } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import Link from 'next/link';
import { authAPI } from '../../../../services/api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const { layoutConfig, setRole } = useContext(LayoutContext);
    const toast = useRef<Toast>(null);
    const router = useRouter();

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    const handleLogin = async () => {
        // Validate input
        if (!email || !password) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng nhập đầy đủ thông tin',
                life: 3000
            });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Email không hợp lệ',
                life: 3000
            });
            return;
        }

        // Call API to login
        setLoading(true);
        try {
            const response = await authAPI.login({
                email,
                password
            });

            if (response.success) {
                const userRole = response.data?.user?.role || 'customer';

                // Set user role in context
                setRole(userRole);

                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: `Đăng nhập thành công! Xin chào ${response.data?.user?.full_name || 'bạn'}`,
                    life: 2000
                });

                // Redirect based on role
                setTimeout(() => {
                    if (userRole === 'admin') {
                        router.push('/admin/products');
                    } else {
                        router.push('/customer/products');
                    }
                }, 2000);
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: response.message || 'Email hoặc mật khẩu không đúng',
                    life: 3000
                });
            }
        } catch (error: any) {
            console.error('Login error:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại!',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={containerClassName}>
            <Toast ref={toast} />
            <div className="flex flex-column align-items-center justify-content-center">
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <div className="text-900 text-4xl font-bold mb-3">
                                <i className="pi pi-shopping-cart mr-2" style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}></i>
                                Cửa Hàng Thực Phẩm
                            </div>
                            <div className="text-900 text-3xl font-medium mb-2">Đăng Nhập</div>
                            <span className="text-600 font-medium">Chào mừng bạn quay trở lại!</span>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">
                                Email
                            </label>
                            <InputText id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Nhập email của bạn" className="w-full md:w-30rem mb-4" style={{ padding: '1rem' }} />

                            <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                                Mật khẩu
                            </label>
                            <Password inputId="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" toggleMask className="w-full mb-4" inputClassName="w-full p-3 md:w-30rem" feedback={false} />

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    <Checkbox inputId="rememberme" checked={rememberMe} onChange={(e) => setRememberMe(e.checked ?? false)} className="mr-2" />
                                    <label htmlFor="rememberme">Ghi nhớ đăng nhập</label>
                                </div>
                                <a className="font-medium no-underline ml-2 text-right cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                    Quên mật khẩu?
                                </a>
                            </div>

                            <Button label="Đăng Nhập" icon="pi pi-sign-in" className="w-full p-3 text-xl mb-4" onClick={handleLogin} loading={loading} disabled={loading} />

                            <div className="text-center">
                                <span className="text-600 font-medium">Chưa có tài khoản? </span>
                                <Link href="/auth/register" className="font-medium no-underline cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                    Đăng ký ngay
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
