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
                    detail: 'Đăng ký tài khoản thành công! Chuyển đến trang đăng nhập...',
                    life: 2000
                });

                // Redirect to login page after successful registration
                setTimeout(() => {
                    router.push('/auth/login');
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
        <div className={containerClassName} style={{ background: 'linear-gradient(135deg, #FFF5E1 0%, #FFE4E1 50%, #FFF0F5 100%)' }}>
            <Toast ref={toast} />
            <div className="flex flex-column align-items-center justify-content-center">
                <div
                    style={{
                        borderRadius: '32px',
                        padding: '0.5rem',
                        background: 'linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 50%, #FFB7D5 100%)',
                        boxShadow: '0 20px 60px rgba(255, 154, 158, 0.3)'
                    }}
                >
                    <div 
                        className="w-full surface-card py-8 px-5 sm:px-8" 
                        style={{ 
                            borderRadius: '28px',
                            background: 'linear-gradient(to bottom, #FFFFFF 0%, #FFF5F7 100%)',
                            boxShadow: 'inset 0 2px 10px rgba(255, 182, 193, 0.1)'
                        }}
                    >
                        <div className="text-center mb-6">
                            <div className="mb-4">
                                <span className="text-6xl">🧸</span>
                            </div>
                            <div className="text-4xl font-bold mb-2" style={{ 
                                background: 'linear-gradient(135deg, #D2691E 0%, #8B4513 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                Teddy Shop
                            </div>
                            <div className="text-2xl font-semibold mb-3" style={{ color: '#C04848' }}>
                                Đăng Ký Tài Khoản
                            </div>
                            <span className="font-medium" style={{ color: '#8B6F47', fontSize: '1rem' }}>
                                Tham gia cùng chúng mình để khám phá thế giới <br/>
                                những chú gấu bông đáng yêu 💕
                            </span>
                        </div>

                        <div>
                            {/* Thông tin cá nhân */}
                            <div className="mb-4">
                                <label htmlFor="fullName" className="block font-semibold mb-2" style={{ color: '#6B4423' }}>
                                    👤 Họ và tên <span style={{ color: '#E74C3C' }}>*</span>
                                </label>
                                <InputText 
                                    id="fullName" 
                                    type="text" 
                                    value={fullName} 
                                    onChange={(e) => setFullName(e.target.value)} 
                                    placeholder="Nhập họ và tên của bạn" 
                                    className="w-full md:w-30rem" 
                                    style={{ 
                                        padding: '0.85rem',
                                        borderRadius: '12px',
                                        border: '2px solid #FFD4D4',
                                        transition: 'all 0.3s'
                                    }} 
                                />
                            </div>

                            {/* Email và Số điện thoại - 2 cột trên màn hình lớn */}
                            <div className="grid mb-4">
                                <div className="col-12 md:col-6">
                                    <label htmlFor="email" className="block font-semibold mb-2" style={{ color: '#6B4423' }}>
                                        📧 Email <span style={{ color: '#E74C3C' }}>*</span>
                                    </label>
                                    <InputText 
                                        id="email" 
                                        type="email" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        placeholder="example@email.com" 
                                        className="w-full" 
                                        style={{ 
                                            padding: '0.85rem',
                                            borderRadius: '12px',
                                            border: '2px solid #FFD4D4',
                                            transition: 'all 0.3s'
                                        }} 
                                    />
                                </div>
                                <div className="col-12 md:col-6">
                                    <label htmlFor="phone" className="block font-semibold mb-2" style={{ color: '#6B4423' }}>
                                        📱 Số điện thoại <span style={{ color: '#E74C3C' }}>*</span>
                                    </label>
                                    <InputText 
                                        id="phone" 
                                        type="tel" 
                                        value={phone} 
                                        onChange={(e) => setPhone(e.target.value)} 
                                        placeholder="0123456789" 
                                        className="w-full" 
                                        style={{ 
                                            padding: '0.85rem',
                                            borderRadius: '12px',
                                            border: '2px solid #FFD4D4',
                                            transition: 'all 0.3s'
                                        }} 
                                        maxLength={10} 
                                    />
                                </div>
                            </div>

                            {/* Mật khẩu và Xác nhận mật khẩu */}
                            <div className="mb-4">
                                <label htmlFor="password" className="block font-semibold mb-2" style={{ color: '#6B4423' }}>
                                    🔐 Mật khẩu <span style={{ color: '#E74C3C' }}>*</span>
                                </label>
                                <Password
                                    inputId="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu"
                                    toggleMask
                                    className="w-full"
                                    inputClassName="w-full p-3"
                                    inputStyle={{
                                        borderRadius: '12px',
                                        border: '2px solid #FFD4D4'
                                    }}
                                    header={passwordHeader}
                                    footer={passwordFooter}
                                />
                            </div>

                            <div className="mb-5">
                                <label htmlFor="confirmPassword" className="block font-semibold mb-2" style={{ color: '#6B4423' }}>
                                    🔒 Xác nhận mật khẩu <span style={{ color: '#E74C3C' }}>*</span>
                                </label>
                                <Password
                                    inputId="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu"
                                    toggleMask
                                    className="w-full"
                                    inputClassName="w-full p-3"
                                    inputStyle={{
                                        borderRadius: '12px',
                                        border: '2px solid #FFD4D4'
                                    }}
                                    feedback={false}
                                />
                            </div>

                            <Button 
                                label="Đăng Ký" 
                                icon="pi pi-user-plus" 
                                className="w-full p-3 text-xl mb-4" 
                                style={{ 
                                    background: 'linear-gradient(135deg, #FF8E9E 0%, #FF6B9D 100%)',
                                    border: 'none',
                                    color: '#FFFFFF',
                                    fontWeight: '600',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 20px rgba(255, 107, 157, 0.3)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    fontSize: '1.1rem',
                                    letterSpacing: '0.5px'
                                }}
                                onClick={handleRegister} 
                                loading={loading} 
                                disabled={loading} 
                            />

                            <div className="text-center pt-3" style={{ borderTop: '1px solid #FFE4E4' }}>
                                <span style={{ color: '#8B7355', fontWeight: '500' }}>Đã có tài khoản? </span>
                                <Link 
                                    href="/auth/login" 
                                    className="font-semibold no-underline cursor-pointer" 
                                    style={{ color: '#FF6B9D', transition: 'color 0.3s' }}
                                >
                                    Đăng nhập ngay →
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
