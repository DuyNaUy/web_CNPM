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
                        router.push('/customer');
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
                                Đăng Nhập
                            </div>
                            <span className="font-medium" style={{ color: '#8B6F47', fontSize: '1rem' }}>
                                Chào mừng bạn trở lại! Hãy đăng nhập để khám phá <br/>
                                những chú gấu bông đáng yêu đang chờ bạn 💕
                            </span>
                        </div>

                        <div>
                            <div className="mb-4">
                                <label htmlFor="email" className="block font-semibold mb-2" style={{ color: '#6B4423' }}>
                                    📧 Email <span style={{ color: '#E74C3C' }}>*</span>
                                </label>
                                <InputText 
                                    id="email" 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    placeholder="example@email.com" 
                                    className="w-full md:w-30rem" 
                                    style={{ 
                                        padding: '0.85rem',
                                        borderRadius: '12px',
                                        border: '2px solid #FFD4D4',
                                        transition: 'all 0.3s'
                                    }} 
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="password" className="block font-semibold mb-2" style={{ color: '#6B4423' }}>
                                    🔐 Mật khẩu <span style={{ color: '#E74C3C' }}>*</span>
                                </label>
                                <Password 
                                    inputId="password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder="Nhập mật khẩu của bạn" 
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

                            <div className="flex align-items-center justify-content-between mb-5">
                                <div className="flex align-items-center">
                                    <Checkbox 
                                        inputId="rememberme" 
                                        checked={rememberMe} 
                                        onChange={(e) => setRememberMe(e.checked ?? false)} 
                                        className="mr-2"
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    <label htmlFor="rememberme" style={{ color: '#6B4423', fontWeight: '500', cursor: 'pointer' }}>
                                        Ghi nhớ đăng nhập
                                    </label>
                                </div>
                                <a 
                                    className="font-medium no-underline text-right cursor-pointer" 
                                    style={{ color: '#FF6B9D', fontWeight: '500', transition: 'color 0.3s' }}
                                >
                                    Quên mật khẩu?
                                </a>
                            </div>

                            <Button 
                                label="Đăng Nhập" 
                                icon="pi pi-sign-in" 
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
                                onClick={handleLogin} 
                                loading={loading} 
                                disabled={loading} 
                            />

                            <div className="text-center pt-3" style={{ borderTop: '1px solid #FFE4E4' }}>
                                <span style={{ color: '#8B7355', fontWeight: '500' }}>Chưa có tài khoản? </span>
                                <Link 
                                    href="/auth/register" 
                                    className="font-semibold no-underline cursor-pointer" 
                                    style={{ color: '#FF6B9D', transition: 'color 0.3s' }}
                                >
                                    Đăng ký ngay →
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
