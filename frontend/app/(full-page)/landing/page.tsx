'use client';
/* eslint-disable @next/next/no-img-element */
import React, { useContext, useRef, useState } from 'react';
import Link from 'next/link';

import { StyleClass } from 'primereact/styleclass';
import { Button } from 'primereact/button';
import { Ripple } from 'primereact/ripple';
import { Divider } from 'primereact/divider';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { NodeRef } from '@/types';
import { classNames } from 'primereact/utils';

const LandingPage = () => {
    const [isHidden, setIsHidden] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const menuRef = useRef<HTMLElement | null>(null);

    const toggleMenuItemClick = () => {
        setIsHidden((prevState) => !prevState);
    };

    return (
        <div className="surface-0 flex justify-content-center">
            <div id="home" className="landing-wrapper overflow-hidden">
                <div className="py-4 px-4 mx-0 md:mx-6 lg:mx-8 lg:px-8 flex align-items-center justify-content-between relative lg:static">
                    <Link href="/" className="flex align-items-center">
                        <img src={`/layout/images/logo-${layoutConfig.colorScheme !== 'light' ? 'white' : 'dark'}.svg`} width="47.22px" height={'35px'} alt="logo" />
                        <span className="text-900 font-bold text-2xl line-height-3 ml-2 mr-8">Teddy Shop 🧸</span>
                    </Link>
                    <StyleClass nodeRef={menuRef as NodeRef} selector="@next" enterClassName="hidden" leaveToClassName="hidden" hideOnOutsideClick>
                        <i ref={menuRef} className="pi pi-bars text-4xl cursor-pointer block lg:hidden text-700"></i>
                    </StyleClass>
                    <div className={classNames('align-items-center surface-0 flex-grow-1 justify-content-between hidden lg:flex absolute lg:static w-full left-0 px-6 lg:px-0 z-2', { hidden: isHidden })} style={{ top: '100%' }}>
                        <ul className="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row cursor-pointer">
                            <li>
                                <a href="#home" onClick={toggleMenuItemClick} className="p-ripple flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3">
                                    <span>Trang chủ</span>
                                    <Ripple />
                                </a>
                            </li>
                            <li>
                                <a href="#products" onClick={toggleMenuItemClick} className="p-ripple flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3">
                                    <span>Sản phẩm</span>
                                    <Ripple />
                                </a>
                            </li>
                            <li>
                                <a href="#about" onClick={toggleMenuItemClick} className="p-ripple flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3">
                                    <span>Về chúng tôi</span>
                                    <Ripple />
                                </a>
                            </li>
                            <li>
                                <a href="#contact" onClick={toggleMenuItemClick} className="p-ripple flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3">
                                    <span>Liên hệ</span>
                                    <Ripple />
                                </a>
                            </li>
                        </ul>
                        <div className="flex justify-content-between lg:block border-top-1 lg:border-top-none surface-border py-3 lg:py-0 mt-3 lg:mt-0">
                            <Link href="/auth/login">
                                <Button label="Đăng nhập" text rounded className="border-none font-light line-height-2" style={{ color: 'var(--primary-color)' }}></Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button label="Đăng ký" rounded className="border-none ml-5 font-light line-height-2 text-white" style={{ background: 'var(--primary-color)' }}></Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div
                    id="hero"
                    className="flex flex-column pt-4 px-4 lg:px-8 overflow-hidden"
                    style={{
                        background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), radial-gradient(77.36% 256.97% at 77.36% 57.52%, var(--primary-50) 0%, var(--primary-100) 100%)',
                        clipPath: 'ellipse(150% 87% at 93% 13%)'
                    }}
                >
                    <div className="mx-4 md:mx-8 mt-0 md:mt-4">
                        <h1 className="text-6xl font-bold text-gray-900 line-height-2">
                            <span className="font-light block">Gấu bông dễ thương</span>Yêu thương từ tim
                        </h1>
                        <p className="font-normal text-2xl line-height-3 md:mt-3 text-gray-700">Khám phá bộ sưu tập gấu bông cao cấp, mềm mại và đáng yêu. Từ những chú gấu nhỏ xinh đến những con lớn ôm ấm. Giao hàng nhanh chóng trong vòng 2 giờ!</p>
                        <Link href="auth/login">
                            <Button type="button" label="Mua sắm ngay" icon="pi pi-shopping-cart" rounded className="text-xl border-none mt-3 font-normal line-height-3 px-3 text-white" style={{ background: 'var(--primary-color)' }}></Button>
                        </Link>
                    </div>
                    <div className="flex justify-content-center md:justify-content-end">
                        <img src="https://images.unsplash.com/photo-1596945733394-5b28f9f47f7e?w=800" alt="Teddy Bears" className="w-9 md:w-auto border-round shadow-8" />
                    </div>
                </div>

                <div id="products" className="py-4 px-4 lg:px-8 mt-5 mx-0 lg:mx-8">
                    <div className="grid justify-content-center">
                        <div className="col-12 text-center mt-8 mb-4">
                            <h2 className="text-900 font-normal mb-2 text-5xl">Bộ Sưu Tập Nổi Bật</h2>
                            <span className="text-600 text-2xl">Những chú gấu bông đáng yêu, chất lượng cao</span>
                        </div>

                        <div className="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                            <div
                                style={{
                                    height: '200px',
                                    padding: '2px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(90deg, rgba(255, 192, 203, 0.2), rgba(255, 182, 193, 0.2)), linear-gradient(180deg, rgba(255, 192, 203, 0.2), rgba(255, 182, 193, 0.2))'
                                }}
                            >
                                <div className="p-3 surface-card h-full" style={{ borderRadius: '8px' }}>
                                    <div
                                        className="flex align-items-center justify-content-center mb-3"
                                        style={{
                                            width: '3.5rem',
                                            height: '3.5rem',
                                            borderRadius: '10px',
                                            background: 'var(--primary-100)',
                                            color: 'var(--primary-700)'
                                        }}
                                    >
                                        <i className="pi pi-fw pi-heart text-2xl"></i>
                                    </div>
                                    <h5 className="mb-2 text-900">Gấu Bông Hồng</h5>
                                    <span className="text-600">Bộ sưu tập gấu bông màu hồng dễ thương. Mềm mại, ấm áp, hoàn hảo để ôm và tặng.</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                            <div
                                style={{
                                    height: '200px',
                                    padding: '2px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(90deg, rgba(189, 183, 107, 0.2), rgba(205, 192, 144, 0.2)), linear-gradient(180deg, rgba(189, 183, 107, 0.2), rgba(205, 192, 144, 0.2))'
                                }}
                            >
                                <div className="p-3 surface-card h-full" style={{ borderRadius: '8px' }}>
                                    <div
                                        className="flex align-items-center justify-content-center bg-yellow-200 mb-3"
                                        style={{
                                            width: '3.5rem',
                                            height: '3.5rem',
                                            borderRadius: '10px'
                                        }}
                                    >
                                        <i className="pi pi-fw pi-star text-2xl text-yellow-700"></i>
                                    </div>
                                    <h5 className="mb-2 text-900">Gấu Bông Vàng</h5>
                                    <span className="text-600">Gấu bông vàng ấm áp, cổ điển và được yêu thích. Thích hợp cho trẻ em và người yêu thích sự ấm cúng.</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-12 lg:col-4 p-0 lg:pb-5 mt-4 lg:mt-0">
                            <div
                                style={{
                                    height: '200px',
                                    padding: '2px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(90deg, rgba(144, 202, 249, 0.2), rgba(174, 225, 255, 0.2)), linear-gradient(180deg, rgba(144, 202, 249, 0.2), rgba(174, 225, 255, 0.2))'
                                }}
                            >
                                <div className="p-3 surface-card h-full" style={{ borderRadius: '8px' }}>
                                    <div
                                        className="flex align-items-center justify-content-center bg-blue-200"
                                        style={{
                                            width: '3.5rem',
                                            height: '3.5rem',
                                            borderRadius: '10px'
                                        }}
                                    >
                                        <i className="pi pi-fw pi-palette text-2xl text-blue-700"></i>
                                    </div>
                                    <h5 className="mb-2 text-900">Gấu Bông Xanh</h5>
                                    <span className="text-600">Bộ sưu tập gấu bông xanh đặc biệt. Lựa chọn tuyệt vời cho những ai yêu thích màu xanh dương.</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                            <div
                                style={{
                                    height: '200px',
                                    padding: '2px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(90deg, rgba(198, 124, 78, 0.2), rgba(165, 105, 75, 0.2)), linear-gradient(180deg, rgba(198, 124, 78, 0.2), rgba(165, 105, 75, 0.2))'
                                }}
                            >
                                <div className="p-3 surface-card h-full" style={{ borderRadius: '8px' }}>
                                    <div
                                        className="flex align-items-center justify-content-center bg-orange-200 mb-3"
                                        style={{
                                            width: '3.5rem',
                                            height: '3.5rem',
                                            borderRadius: '10px'
                                        }}
                                    >
                                        <i className="pi pi-fw pi-sun text-2xl text-orange-700"></i>
                                    </div>
                                    <h5 className="mb-2 text-900">Gấu Bông Nâu</h5>
                                    <span className="text-600">Gấu bông nâu chất lượng cao, cổ điển và đẹp mắt. Bạn tốt tin cậy cho những người thân.</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                            <div
                                style={{
                                    height: '200px',
                                    padding: '2px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(90deg, rgba(229, 57, 53, 0.2), rgba(244, 67, 54, 0.2)), linear-gradient(180deg, rgba(229, 57, 53, 0.2), rgba(244, 67, 54, 0.2))'
                                }}
                            >
                                <div className="p-3 surface-card h-full" style={{ borderRadius: '8px' }}>
                                    <div
                                        className="flex align-items-center justify-content-center bg-red-200 mb-3"
                                        style={{
                                            width: '3.5rem',
                                            height: '3.5rem',
                                            borderRadius: '10px'
                                        }}
                                    >
                                        <i className="pi pi-fw pi-heart-fill text-2xl text-red-700"></i>
                                    </div>
                                    <h5 className="mb-2 text-900">Gấu Bông Đỏ</h5>
                                    <span className="text-600">Gấu bông đỏ rực rỡ, năng động. Lý tưởng để thể hiện tình yêu thương cho những người quan trọng.</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-12 lg:col-4 p-0 lg:pb-5 mt-4 lg:mt-0">
                            <div
                                style={{
                                    height: '200px',
                                    padding: '2px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(90deg, rgba(156, 39, 176, 0.2), rgba(171, 71, 188, 0.2)), linear-gradient(180deg, rgba(156, 39, 176, 0.2), rgba(171, 71, 188, 0.2))'
                                }}
                            >
                                <div className="p-3 surface-card h-full" style={{ borderRadius: '8px' }}>
                                    <div
                                        className="flex align-items-center justify-content-center bg-purple-200 mb-3"
                                        style={{
                                            width: '3.5rem',
                                            height: '3.5rem',
                                            borderRadius: '10px'
                                        }}
                                    >
                                        <i className="pi pi-fw pi-gift text-2xl text-purple-700"></i>
                                    </div>
                                    <h5 className="mb-2 text-900">Gấu Bông Tím</h5>
                                    <span className="text-600">Bộ sưu tập gấu bông tím độc đáo. Quà tặng hoàn hảo cho những người đặc biệt trong cuộc sống.</span>
                                </div>
                            </div>
                        </div>

                        <div
                            className="col-12 mt-8 mb-8 p-2 md:p-8"
                            style={{
                                borderRadius: '20px',
                                background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)), radial-gradient(77.36% 256.97% at 77.36% 57.52%, #FFB6C1 0%, #FFC0CB 100%)'
                            }}
                        >
                            <div className="flex flex-column justify-content-center align-items-center text-center px-3 py-3 md:py-0">
                                <h3 className="text-gray-900 mb-2 text-3xl">Khách hàng hài lòng</h3>
                                <span className="text-gray-600 text-2xl">Trang Trang - Khách hàng yêu thích</span>
                                <p className="text-gray-900 sm:line-height-2 md:line-height-4 text-2xl mt-4" style={{ maxWidth: '800px' }}>
                                    "Gấu bông tại Teddy Shop thực sự đáng yêu và mềm mại! Tôi đã mua nhiều lần và luôn hài lòng với chất lượng. Giao hàng nhanh, đóng gói cẩn thận, và có nhiều ưu đãi hấp dẫn. Khuyến nghị cho bạn bè!"
                                </p>
                                <div className="flex gap-2 mt-4">
                                    <i className="pi pi-star-fill text-yellow-500 text-2xl"></i>
                                    <i className="pi pi-star-fill text-yellow-500 text-2xl"></i>
                                    <i className="pi pi-star-fill text-yellow-500 text-2xl"></i>
                                    <i className="pi pi-star-fill text-yellow-500 text-2xl"></i>
                                    <i className="pi pi-star-fill text-yellow-500 text-2xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="about" className="py-4 px-4 lg:px-8 mx-0 my-6 lg:mx-8">
                    <div className="text-center">
                        <h2 className="text-900 font-normal mb-2 text-5xl">Tại Sao Chọn Teddy Shop?</h2>
                        <span className="text-600 text-2xl">Những giá trị cốt lõi mang đến cho khách hàng</span>
                    </div>

                    <div className="grid mt-8 pb-2 md:pb-8">
                        <div className="flex justify-content-center col-12 lg:col-6 p-8 flex-order-1 lg:flex-order-0" style={{ borderRadius: '8px', background: 'var(--primary-50)' }}>
                            <img src="https://images.unsplash.com/photo-1590080876795-cd7b7ddc1f69?w=600" alt="Teddy Delivery" className="w-full border-round shadow-4" style={{ maxHeight: '400px', objectFit: 'cover' }} />
                        </div>

                        <div className="col-12 lg:col-6 my-auto flex flex-column lg:align-items-end text-center lg:text-right">
                            <div
                                className="flex align-items-center justify-content-center align-self-center lg:align-self-end"
                                style={{
                                    width: '4.2rem',
                                    height: '4.2rem',
                                    borderRadius: '10px',
                                    background: 'var(--primary-100)',
                                    color: 'var(--primary-700)'
                                }}
                            >
                                <i className="pi pi-fw pi-truck text-5xl"></i>
                            </div>
                            <h2 className="line-height-1 text-900 text-4xl font-normal">Giao Hàng Nhanh Chóng</h2>
                            <span className="text-700 text-2xl line-height-3 ml-0 md:ml-2" style={{ maxWidth: '650px' }}>
                                Chúng tôi cam kết giao hàng trong vòng 2 giờ trong khu vực nội thành. Đội ngũ shipper chuyên nghiệp, đóng gói cẩn thận để gấu bông của bạn đến an toàn và hoàn hảo. Miễn phí vận chuyển cho đơn hàng trên 200.000đ.
                            </span>
                        </div>
                    </div>

                    <div className="grid my-8 pt-2 md:pt-8">
                        <div className="col-12 lg:col-6 my-auto flex flex-column text-center lg:text-left lg:align-items-start">
                            <div
                                className="flex align-items-center justify-content-center bg-blue-200 align-self-center lg:align-self-start"
                                style={{
                                    width: '4.2rem',
                                    height: '4.2rem',
                                    borderRadius: '10px'
                                }}
                            >
                                <i className="pi pi-fw pi-shield text-5xl text-blue-700"></i>
                            </div>
                            <h2 className="line-height-1 text-900 text-4xl font-normal">Chất Lượng Đảm Bảo</h2>
                            <span className="text-700 text-2xl line-height-3 mr-0 md:mr-2" style={{ maxWidth: '650px' }}>
                                Tất cả gấu bông đều từ những nhà cung cấp uy tín, chất liệu an toàn cho trẻ em. Được kiểm tra kỹ lưỡng trước khi gửi đến bạn. Hoàn tiền 100% nếu sản phẩm không đạt chất lượng cam kết hoặc bị lỗi.
                            </span>
                        </div>

                        <div className="flex justify-content-end flex-order-1 sm:flex-order-2 col-12 lg:col-6 p-8" style={{ borderRadius: '8px', background: 'var(--primary-50)' }}>
                            <img src="https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=600" alt="Quality Teddy" className="w-full border-round shadow-4" style={{ maxHeight: '400px', objectFit: 'cover' }} />
                        </div>
                    </div>

                    <div className="grid my-8 pt-2 md:pt-8">
                        <div className="flex justify-content-center col-12 lg:col-6 p-8 flex-order-1 lg:flex-order-0" style={{ borderRadius: '8px', background: 'var(--primary-50)' }}>
                            <img src="https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=600" alt="Cute Bears" className="w-full border-round shadow-4" style={{ maxHeight: '400px', objectFit: 'cover' }} />
                        </div>

                        <div className="col-12 lg:col-6 my-auto flex flex-column lg:align-items-end text-center lg:text-right">
                            <div
                                className="flex align-items-center justify-content-center bg-orange-200 align-self-center lg:align-self-end"
                                style={{
                                    width: '4.2rem',
                                    height: '4.2rem',
                                    borderRadius: '10px'
                                }}
                            >
                                <i className="pi pi-fw pi-dollar text-5xl text-orange-700"></i>
                            </div>
                            <h2 className="line-height-1 text-900 text-4xl font-normal">Giá Cả Hợp Lý</h2>
                            <span className="text-700 text-2xl line-height-3 ml-0 md:ml-2" style={{ maxWidth: '650px' }}>
                                Cam kết giá tốt nhất thị trường với nhiều mức kích cỡ gấu bông. Nhiều chương trình khuyến mãi hấp dẫn hàng tuần. Tích điểm thành viên đổi quà. Thanh toán linh hoạt: tiền mặt, chuyển khoản, ví điện tử.
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    id="contact"
                    className="py-8 px-4 lg:px-8 my-2 md:my-4 text-center"
                    style={{ background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), radial-gradient(77.36% 256.97% at 77.36% 57.52%, var(--primary-50) 0%, var(--primary-200) 100%)' }}
                >
                    <div className="text-center mb-5">
                        <h2 className="text-900 font-normal mb-2 text-5xl">Bắt Đầu Mua Sắm Ngay!</h2>
                        <span className="text-600 text-2xl">Đăng ký hoặc đăng nhập để trải nghiệm những chú gấu bông tuyệt vời</span>
                    </div>

                    <div className="flex justify-content-center gap-4 flex-wrap">
                        <Link href="/auth/login">
                            <Button label="Đăng Nhập" icon="pi pi-sign-in" className="text-xl border-none font-normal py-3 px-5 text-white" style={{ background: 'var(--primary-color)' }} rounded />
                        </Link>
                        <Link href="/auth/register">
                            <Button label="Đăng Ký Ngay" icon="pi pi-user-plus" className="text-xl border-none font-normal py-3 px-5 text-white" style={{ background: 'var(--primary-color)' }} rounded />
                        </Link>
                        <Link href="/customer/products">
                            <Button label="Xem Sản Phẩm" icon="pi pi-shopping-cart" className="text-xl font-normal py-3 px-5" rounded outlined />
                        </Link>
                    </div>

                    <div className="mt-8 grid">
                        <div className="col-12 md:col-4">
                            <div className="surface-card shadow-2 p-4 border-round">
                                <i className="pi pi-phone text-4xl mb-3" style={{ color: 'var(--primary-color)' }}></i>
                                <h4 className="text-900 mb-2">Hotline</h4>
                                <p className="text-600 text-xl">0866 096 023</p>
                            </div>
                        </div>
                        <div className="col-12 md:col-4">
                            <div className="surface-card shadow-2 p-4 border-round">
                                <i className="pi pi-envelope text-4xl mb-3" style={{ color: 'var(--primary-color)' }}></i>
                                <h4 className="text-900 mb-2">Email</h4>
                                <p className="text-600 text-xl">teddyshop@gmail.com.vn</p>
                            </div>
                        </div>
                        <div className="col-12 md:col-4">
                            <div className="surface-card shadow-2 p-4 border-round">
                                <i className="pi pi-map-marker text-4xl mb-3" style={{ color: 'var(--primary-color)' }}></i>
                                <h4 className="text-900 mb-2">Địa chỉ</h4>
                                <p className="text-600 text-xl">123 Đường Tây Sơn, Đống Đa, Hà Nội</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="py-4 px-4 mx-0 mt-8 lg:mx-8 bg-gray-900">
                    <div className="grid justify-content-between">
                        <div className="col-12 md:col-3" style={{ marginTop: '-1.5rem' }}>
                            <Link href="/" className="flex flex-wrap align-items-center justify-content-center md:justify-content-start md:mb-0 mb-3 cursor-pointer">
                                <img src={`/layout/images/logo-white.svg`} width="47.22px" height={'35px'} alt="logo" />
                                <span className="font-medium text-3xl text-white">Teddy Shop 🧸</span>
                            </Link>
                            <p className="text-gray-400 line-height-3 mt-3">Cung cấp gấu bông chất lượng cao, an toàn cho trẻ em và mọi lứa tuổi.</p>
                        </div>

                        <div className="col-12 md:col-9">
                            <div className="grid text-center md:text-left">
                                <div className="col-12 md:col-3">
                                    <h4 className="font-medium text-2xl line-height-3 mb-3 text-white">Công ty</h4>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-gray-400 hover:text-white">Về chúng tôi</a>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-gray-400 hover:text-white">Tin tức</a>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-gray-400 hover:text-white">Tuyển dụng</a>
                                    <a className="line-height-3 text-xl block cursor-pointer text-gray-400 hover:text-white">Liên hệ</a>
                                </div>

                                <div className="col-12 md:col-3 mt-4 md:mt-0">
                                    <h4 className="font-medium text-2xl line-height-3 mb-3 text-white">Hỗ trợ</h4>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-gray-400 hover:text-white">Hướng dẫn mua hàng</a>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-gray-400 hover:text-white">Chính sách vận chuyển</a>
                                    <a className="line-height-3 text-xl block cursor-pointer text-gray-400 hover:text-white">Chính sách đổi trả</a>
                                </div>

                                <div className="col-12 md:col-3 mt-4 md:mt-0">
                                    <h4 className="font-medium text-2xl line-height-3 mb-3 text-white">Dịch vụ</h4>
                                    <Link href="/customer/products" className="line-height-3 text-xl block cursor-pointer mb-2 text-gray-400 hover:text-white">
                                        Sản phẩm
                                    </Link>
                                    <Link href="/auth/login" className="line-height-3 text-xl block cursor-pointer mb-2 text-gray-400 hover:text-white">
                                        Đăng nhập
                                    </Link>
                                    <Link href="/auth/register" className="line-height-3 text-xl block cursor-pointer mb-2 text-gray-400 hover:text-white">
                                        Đăng ký
                                    </Link>
                                    <a className="line-height-3 text-xl block cursor-pointer text-gray-400 hover:text-white">FAQ</a>
                                </div>

                                <div className="col-12 md:col-3 mt-4 md:mt-0">
                                    <h4 className="font-medium text-2xl line-height-3 mb-3 text-white">Pháp lý</h4>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-gray-400 hover:text-white">Điều khoản sử dụng</a>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-gray-400 hover:text-white">Chính sách bảo mật</a>
                                    <a className="line-height-3 text-xl block cursor-pointer text-gray-400 hover:text-white">Chứng nhận an toàn</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Divider className="border-gray-700 mt-5" />
                    <div className="text-center text-gray-400 mt-4">
                        <p className="mb-2">&copy; 2024 Teddy Shop. All rights reserved.</p>
                        <p className="text-sm">Địa chỉ: 123 Đường Tây Sơn, Đống Đa, Hà Nội | Hotline: 0866 096 023 | Email: teddyshop@gmail.com.vn</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
