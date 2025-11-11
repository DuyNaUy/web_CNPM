/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import Link from 'next/link';
import { Divider } from 'primereact/divider';
import { authAPI } from '../../../../services/api';

const RegisterPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { layoutConfig, setRole } = useContext(LayoutContext);
    const toast = useRef<Toast>(null);
    const router = useRouter();

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    const passwordHeader = <div className="font-bold mb-3">Chọn mật khẩu</div>;
    const passwordFooter = (
        <>
            <Divider />
            <p className="mt-2">Yêu cầu</p>
            <ul className="pl-2 ml-2 mt-0 line-height-3">
                <li>Ít nhất một chữ thường</li>
                <li>Ít nhất một chữ hoa</li>
                <li>Ít nhất một chữ số</li>
                <li>Tối thiểu 8 ký tự</li>
            </ul>
        </>
    );

    const handleRegister = async () => {
        // Validate input
        if (!fullName || !email || !phone || !password || !confirmPassword) {
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

        // Validate phone format
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Số điện thoại phải có 10 chữ số',
                life: 3000
            });
            return;
        }

        // Validate password
        if (password.length < 8) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Mật khẩu phải có ít nhất 8 ký tự',
                life: 3000
            });
            return;
        }

        // Validate password match
        if (password !== confirmPassword) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Mật khẩu xác nhận không khớp',
                life: 3000
            });
            return;
        }

        // Call API to register
        setLoading(true);
        try {
            // Generate username from email
            const username = email.split('@')[0];

            console.log('Sending registration data:', {
                username,
                email,
                full_name: fullName,
                phone,
                role: 'customer'
            });

            const response = await authAPI.register({
                username,
                email,
                full_name: fullName,
                phone,
                password,
                confirm_password: confirmPassword,
                role: 'customer'
            });

            console.log('Registration response:', response);

            if (response.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Đăng ký tài khoản thành công!',
                    life: 2000
                });

                // Set user role
                if (response.data?.user?.role) {
                    setRole(response.data.user.role);
                }

                // Redirect based on role
                setTimeout(() => {
                    if (response.data?.user?.role === 'admin') {
                        router.push('/admin/products');
                    } else {
                        router.push('/customer/products');
                    }
                }, 2000);
            } else {
                // Show error messages from backend
                const errorDetail = response.errors ? Object.values(response.errors).flat().join(', ') : response.message || 'Đăng ký thất bại!';

                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: errorDetail,
                    life: 5000
                });
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại!',
                life: 5000
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
                            <div className="text-900 text-3xl font-medium mb-2">Đăng Ký Tài Khoản</div>
                            <span className="text-600 font-medium">Tạo tài khoản mới để bắt đầu mua sắm</span>
                        </div>

                        <div>
                            <label htmlFor="fullName" className="block text-900 text-xl font-medium mb-2">
                                Họ và tên
                            </label>
                            <InputText id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nhập họ và tên của bạn" className="w-full md:w-30rem mb-4" style={{ padding: '1rem' }} />

                            <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">
                                Email
                            </label>
                            <InputText id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Nhập email của bạn" className="w-full md:w-30rem mb-4" style={{ padding: '1rem' }} />

                            <label htmlFor="phone" className="block text-900 text-xl font-medium mb-2">
                                Số điện thoại
                            </label>
                            <InputText id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại" className="w-full md:w-30rem mb-4" style={{ padding: '1rem' }} maxLength={10} />

                            <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                                Mật khẩu
                            </label>
                            <Password
                                inputId="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                toggleMask
                                className="w-full mb-4"
                                inputClassName="w-full p-3 md:w-30rem"
                                header={passwordHeader}
                                footer={passwordFooter}
                            />

                            <label htmlFor="confirmPassword" className="block text-900 font-medium text-xl mb-2">
                                Xác nhận mật khẩu
                            </label>
                            <Password
                                inputId="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu"
                                toggleMask
                                className="w-full mb-5"
                                inputClassName="w-full p-3 md:w-30rem"
                                feedback={false}
                            />

                            <Button label="Đăng Ký" icon="pi pi-user-plus" className="w-full p-3 text-xl mb-4" onClick={handleRegister} loading={loading} disabled={loading} />

                            <div className="text-center">
                                <span className="text-600 font-medium">Đã có tài khoản? </span>
                                <Link href="/auth/login" className="font-medium no-underline cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                    Đăng nhập ngay
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
