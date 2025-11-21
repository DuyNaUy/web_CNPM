'use client';
/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';

const CustomerHomePage = () => {
    return (
        <div className="surface-0">
            {/* Hero Section */}
            <div
                className="flex flex-column pt-4 px-4 lg:px-8 overflow-hidden"
                style={{
                    background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), radial-gradient(77.36% 256.97% at 77.36% 57.52%, #FFE5EC 0%, #FFB6C1 100%)',
                    borderRadius: '0 0 50px 50px',
                    minHeight: '500px'
                }}
            >
                <div className="mx-4 md:mx-8 mt-0 md:mt-4">
                    <h1 className="text-6xl font-bold text-gray-900 line-height-2">
                        <span className="font-light block">Gấu bông dễ thương</span>
                        <span style={{ color: '#ff69b4' }}>Yêu thương từ tim 🧸</span>
                    </h1>
                    <p className="font-normal text-2xl line-height-3 md:mt-3 text-gray-700">
                        Khám phá bộ sưu tập gấu bông cao cấp, mềm mại và đáng yêu. Từ những chú gấu nhỏ xinh đến những con lớn ôm ấm. Giao hàng nhanh chóng trong vòng 2 giờ!
                    </p>
                    <Link href="/customer/products">
                        <Button 
                            type="button" 
                            label="Mua sắm ngay" 
                            icon="pi pi-shopping-cart" 
                            rounded 
                            size="large"
                            className="text-xl border-none mt-5 font-normal line-height-3 px-5 text-white shadow-4" 
                            style={{ background: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)' }}
                        />
                    </Link>
                </div>
                <div className="flex justify-content-center md:justify-content-end mt-4">
                    <img 
                        src="/home/image/anh1.jpg" 
                        alt="Teddy Bears" 
                        className="w-9 md:w-auto border-round-3xl shadow-8" 
                        style={{ maxHeight: '450px', objectFit: 'cover' }}
                    />
                </div>
            </div>

            {/* Products Collection Section */}
            <div className="py-6 px-4 lg:px-8 mt-6 mx-0 lg:mx-8">
                <div className="grid justify-content-center">
                    <div className="col-12 text-center mt-6 mb-4">
                        <h2 className="text-900 font-normal mb-3 text-5xl">Bộ Sưu Tập Nổi Bật 🎀</h2>
                        <span className="text-600 text-2xl">Những chú gấu bông đáng yêu, chất lượng cao</span>
                    </div>

                    <div className="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                        <div
                            className="surface-card p-4 shadow-3 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl"
                            style={{ height: '100%', border: '2px solid #FFE5EC' }}
                        >
                            <div
                                className="flex align-items-center justify-content-center mb-3"
                                style={{
                                    width: '4rem',
                                    height: '4rem',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #FFE5EC 0%, #FFB6C1 100%)',
                                }}
                            >
                                <i className="pi pi-heart text-3xl" style={{ color: '#ff69b4' }}></i>
                            </div>
                            <h5 className="mb-2 text-900 text-2xl font-semibold">Gấu Bông Hồng</h5>
                            <span className="text-600 text-lg line-height-3">
                                Bộ sưu tập gấu bông màu hồng dễ thương. Mềm mại, ấm áp, hoàn hảo để ôm và tặng.
                            </span>
                        </div>
                    </div>

                    <div className="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                        <div
                            className="surface-card p-4 shadow-3 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl"
                            style={{ height: '100%', border: '2px solid #FFF4E0' }}
                        >
                            <div
                                className="flex align-items-center justify-content-center mb-3"
                                style={{
                                    width: '4rem',
                                    height: '4rem',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #FFF4E0 0%, #FFE082 100%)',
                                }}
                            >
                                <i className="pi pi-star text-3xl text-yellow-700"></i>
                            </div>
                            <h5 className="mb-2 text-900 text-2xl font-semibold">Gấu Bông Vàng</h5>
                            <span className="text-600 text-lg line-height-3">
                                Gấu bông vàng ấm áp, cổ điển và được yêu thích. Thích hợp cho trẻ em và người yêu thích sự ấm cúng.
                            </span>
                        </div>
                    </div>

                    <div className="col-12 md:col-12 lg:col-4 p-0 lg:pb-5 mt-4 lg:mt-0">
                        <div
                            className="surface-card p-4 shadow-3 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl"
                            style={{ height: '100%', border: '2px solid #E3F2FD' }}
                        >
                            <div
                                className="flex align-items-center justify-content-center mb-3"
                                style={{
                                    width: '4rem',
                                    height: '4rem',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #E3F2FD 0%, #90CAF9 100%)',
                                }}
                            >
                                <i className="pi pi-palette text-3xl text-blue-700"></i>
                            </div>
                            <h5 className="mb-2 text-900 text-2xl font-semibold">Gấu Bông Xanh</h5>
                            <span className="text-600 text-lg line-height-3">
                                Bộ sưu tập gấu bông xanh đặc biệt. Lựa chọn tuyệt vời cho những ai yêu thích màu xanh dương.
                            </span>
                        </div>
                    </div>

                    <div className="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                        <div
                            className="surface-card p-4 shadow-3 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl"
                            style={{ height: '100%', border: '2px solid #EFEBE9' }}
                        >
                            <div
                                className="flex align-items-center justify-content-center mb-3"
                                style={{
                                    width: '4rem',
                                    height: '4rem',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #EFEBE9 0%, #BCAAA4 100%)',
                                }}
                            >
                                <i className="pi pi-sun text-3xl text-orange-700"></i>
                            </div>
                            <h5 className="mb-2 text-900 text-2xl font-semibold">Gấu Bông Nâu</h5>
                            <span className="text-600 text-lg line-height-3">
                                Gấu bông nâu chất lượng cao, cổ điển và đẹp mắt. Bạn tốt tin cậy cho những người thân.
                            </span>
                        </div>
                    </div>

                    <div className="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                        <div
                            className="surface-card p-4 shadow-3 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl"
                            style={{ height: '100%', border: '2px solid #FFEBEE' }}
                        >
                            <div
                                className="flex align-items-center justify-content-center mb-3"
                                style={{
                                    width: '4rem',
                                    height: '4rem',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #FFEBEE 0%, #EF5350 100%)',
                                }}
                            >
                                <i className="pi pi-heart-fill text-3xl text-white"></i>
                            </div>
                            <h5 className="mb-2 text-900 text-2xl font-semibold">Gấu Bông Đỏ</h5>
                            <span className="text-600 text-lg line-height-3">
                                Gấu bông đỏ rực rỡ, năng động. Lý tưởng để thể hiện tình yêu thương cho những người quan trọng.
                            </span>
                        </div>
                    </div>

                    <div className="col-12 md:col-12 lg:col-4 p-0 lg:pb-5 mt-4 lg:mt-0">
                        <div
                            className="surface-card p-4 shadow-3 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl"
                            style={{ height: '100%', border: '2px solid #F3E5F5' }}
                        >
                            <div
                                className="flex align-items-center justify-content-center mb-3"
                                style={{
                                    width: '4rem',
                                    height: '4rem',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #F3E5F5 0%, #AB47BC 100%)',
                                }}
                            >
                                <i className="pi pi-gift text-3xl text-white"></i>
                            </div>
                            <h5 className="mb-2 text-900 text-2xl font-semibold">Gấu Bông Tím</h5>
                            <span className="text-600 text-lg line-height-3">
                                Bộ sưu tập gấu bông tím độc đáo. Quà tặng hoàn hảo cho những người đặc biệt trong cuộc sống.
                            </span>
                        </div>
                    </div>

                    {/* Customer Testimonial */}
                    <div
                        className="col-12 mt-8 mb-8 p-5 md:p-8 border-round-3xl shadow-4"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.3) 0%, rgba(255, 192, 203, 0.3) 100%)'
                        }}
                    >
                        <div className="flex flex-column justify-content-center align-items-center text-center px-3 py-3 md:py-0">
                            <div className="mb-4">
                                <img 
                                    src="https://ui-avatars.com/api/?name=Trang+Trang&background=ff69b4&color=fff&size=100&bold=true" 
                                    alt="Customer" 
                                    className="border-circle shadow-3"
                                    style={{ width: '100px', height: '100px' }}
                                />
                            </div>
                            <h3 className="text-gray-900 mb-2 text-3xl font-semibold">Khách hàng hài lòng ⭐</h3>
                            <span className="text-600 text-xl font-semibold" style={{ color: '#ff69b4' }}>Trang Trang - Khách hàng yêu thích</span>
                            <p className="text-gray-900 sm:line-height-2 md:line-height-4 text-xl mt-4" style={{ maxWidth: '800px' }}>
                                &ldquo;Gấu bông tại Teddy Shop thực sự đáng yêu và mềm mại! Tôi đã mua nhiều lần và luôn hài lòng với chất lượng. Giao hàng nhanh, đóng gói cẩn thận, và có nhiều ưu đãi hấp dẫn. Khuyến nghị cho bạn bè!&rdquo;
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

            {/* Why Choose Us Section */}
            <div className="py-6 px-4 lg:px-8 mx-0 my-6 lg:mx-8">
                <div className="text-center mb-6">
                    <h2 className="text-900 font-normal mb-3 text-5xl">Tại Sao Chọn Teddy Shop? 💝</h2>
                    <span className="text-600 text-2xl">Những giá trị cốt lõi mang đến cho khách hàng</span>
                </div>

                <div className="grid mt-8 pb-2 md:pb-8 align-items-center">
                    <div className="flex justify-content-center col-12 lg:col-6 p-6 flex-order-1 lg:flex-order-0">
                        <img 
                            src="/home/image/anh2.jpg" 
                            alt="Teddy Delivery" 
                            className="w-full border-round-3xl shadow-5" 
                            style={{ maxHeight: '450px', objectFit: 'cover' }}
                        />
                    </div>

                    <div className="col-12 lg:col-6 my-auto flex flex-column lg:align-items-end text-center lg:text-right px-4">
                        <div
                            className="flex align-items-center justify-content-center align-self-center lg:align-self-end mb-4"
                            style={{
                                width: '5rem',
                                height: '5rem',
                                borderRadius: '15px',
                                background: 'linear-gradient(135deg, #FFE5EC 0%, #ff69b4 100%)',
                                boxShadow: '0 8px 20px rgba(255, 105, 180, 0.3)'
                            }}
                        >
                            <i className="pi pi-truck text-5xl text-white"></i>
                        </div>
                        <h2 className="line-height-1 text-900 text-4xl font-semibold mb-3">Giao Hàng Nhanh Chóng 🚚</h2>
                        <span className="text-700 text-xl line-height-3 ml-0 md:ml-2" style={{ maxWidth: '650px' }}>
                            Chúng tôi cam kết giao hàng trong vòng 2 giờ trong khu vực nội thành. Đội ngũ shipper chuyên nghiệp, đóng gói cẩn thận để gấu bông của bạn đến an toàn và hoàn hảo. <strong style={{ color: '#ff69b4' }}>Miễn phí vận chuyển cho đơn hàng trên 200.000đ.</strong>
                        </span>
                    </div>
                </div>

                <div className="grid my-8 pt-2 md:pt-8 align-items-center">
                    <div className="col-12 lg:col-6 my-auto flex flex-column text-center lg:text-left lg:align-items-start px-4">
                        <div
                            className="flex align-items-center justify-content-center align-self-center lg:align-self-start mb-4"
                            style={{
                                width: '5rem',
                                height: '5rem',
                                borderRadius: '15px',
                                background: 'linear-gradient(135deg, #E3F2FD 0%, #2196F3 100%)',
                                boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)'
                            }}
                        >
                            <i className="pi pi-shield text-5xl text-white"></i>
                        </div>
                        <h2 className="line-height-1 text-900 text-4xl font-semibold mb-3">Chất Lượng Đảm Bảo ✅</h2>
                        <span className="text-700 text-xl line-height-3 mr-0 md:mr-2" style={{ maxWidth: '650px' }}>
                            Tất cả gấu bông đều từ những nhà cung cấp uy tín, chất liệu an toàn cho trẻ em. Được kiểm tra kỹ lưỡng trước khi gửi đến bạn. <strong style={{ color: '#2196F3' }}>Hoàn tiền 100% nếu sản phẩm không đạt chất lượng cam kết hoặc bị lỗi.</strong>
                        </span>
                    </div>

                    <div className="flex justify-content-end flex-order-1 sm:flex-order-2 col-12 lg:col-6 p-6">
                        <img 
                            src="/home/image/anh3.jpg" 
                            alt="Quality Teddy" 
                            className="w-full border-round-3xl shadow-5" 
                            style={{ maxHeight: '450px', objectFit: 'cover' }}
                        />
                    </div>
                </div>

                <div className="grid my-8 pt-2 md:pt-8 align-items-center">
                    <div className="flex justify-content-center col-12 lg:col-6 p-6 flex-order-1 lg:flex-order-0">
                        <img 
                            src="/home/image/anh4.jpg" 
                            alt="Cute Bears" 
                            className="w-full border-round-3xl shadow-5" 
                            style={{ maxHeight: '450px', objectFit: 'cover' }}
                        />
                    </div>

                    <div className="col-12 lg:col-6 my-auto flex flex-column lg:align-items-end text-center lg:text-right px-4">
                        <div
                            className="flex align-items-center justify-content-center align-self-center lg:align-self-end mb-4"
                            style={{
                                width: '5rem',
                                height: '5rem',
                                borderRadius: '15px',
                                background: 'linear-gradient(135deg, #FFF3E0 0%, #FF9800 100%)',
                                boxShadow: '0 8px 20px rgba(255, 152, 0, 0.3)'
                            }}
                        >
                            <i className="pi pi-dollar text-5xl text-white"></i>
                        </div>
                        <h2 className="line-height-1 text-900 text-4xl font-semibold mb-3">Giá Cả Hợp Lý 💰</h2>
                        <span className="text-700 text-xl line-height-3 ml-0 md:ml-2" style={{ maxWidth: '650px' }}>
                            Cam kết giá tốt nhất thị trường với nhiều mức kích cỡ gấu bông. Nhiều chương trình khuyến mãi hấp dẫn hàng tuần. <strong style={{ color: '#FF9800' }}>Tích điểm thành viên đổi quà.</strong> Thanh toán linh hoạt: tiền mặt, chuyển khoản, ví điện tử.
                        </span>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div
                className="py-8 px-4 lg:px-8 my-6 text-center border-round-3xl mx-4 lg:mx-8 shadow-5"
                style={{ 
                    background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.4) 0%, rgba(255, 192, 203, 0.4) 100%)',
                }}
            >
                <div className="text-center mb-5">
                    <h2 className="text-900 font-semibold mb-3 text-5xl">Bắt Đầu Mua Sắm Ngay! 🛍️</h2>
                    <span className="text-600 text-2xl">Khám phá bộ sưu tập gấu bông tuyệt vời của chúng tôi</span>
                </div>

                <div className="flex justify-content-center gap-4 flex-wrap mb-6">
                    <Link href="/customer/products">
                        <Button 
                            label="Xem Sản Phẩm" 
                            icon="pi pi-shopping-bag" 
                            size="large"
                            className="text-xl border-none font-semibold py-3 px-6 text-white shadow-3" 
                            style={{ background: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)' }} 
                            rounded 
                        />
                    </Link>
                    <Link href="/customer/cart">
                        <Button 
                            label="Giỏ Hàng" 
                            icon="pi pi-shopping-cart" 
                            size="large"
                            className="text-xl font-semibold py-3 px-6 shadow-3" 
                            rounded 
                            outlined
                            style={{ borderColor: '#ff69b4', color: '#ff69b4', borderWidth: '2px' }}
                        />
                    </Link>
                </div>

                <div className="grid">
                    <div className="col-12 md:col-4">
                        <div className="surface-card shadow-3 p-5 border-round-xl hover:shadow-5 transition-all transition-duration-300">
                            <i className="pi pi-phone text-5xl mb-3" style={{ color: '#ff69b4' }}></i>
                            <h4 className="text-900 mb-2 text-xl font-semibold">Hotline</h4>
                            <p className="text-600 text-xl font-semibold" style={{ color: '#ff69b4' }}>0866 096 023</p>
                        </div>
                    </div>
                    <div className="col-12 md:col-4">
                        <div className="surface-card shadow-3 p-5 border-round-xl hover:shadow-5 transition-all transition-duration-300">
                            <i className="pi pi-envelope text-5xl mb-3" style={{ color: '#ff69b4' }}></i>
                            <h4 className="text-900 mb-2 text-xl font-semibold">Email</h4>
                            <p className="text-600 text-xl font-semibold" style={{ color: '#ff69b4' }}>teddyshop@gmail.com.vn</p>
                        </div>
                    </div>
                    <div className="col-12 md:col-4">
                        <div className="surface-card shadow-3 p-5 border-round-xl hover:shadow-5 transition-all transition-duration-300">
                            <i className="pi pi-map-marker text-5xl mb-3" style={{ color: '#ff69b4' }}></i>
                            <h4 className="text-900 mb-2 text-xl font-semibold">Địa chỉ</h4>
                            <p className="text-600 text-xl font-semibold" style={{ color: '#ff69b4' }}>123 Đường Tây Sơn, Đống Đa, Hà Nội</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerHomePage;
