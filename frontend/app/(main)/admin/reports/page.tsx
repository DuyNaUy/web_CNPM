/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React, { useContext, useEffect, useState } from 'react';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { ChartData, ChartOptions } from 'chart.js';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';

const ReportsPage = () => {
    const [selectedDateRange, setSelectedDateRange] = useState<Date[] | null>(null);
    const [reportType, setReportType] = useState('revenue');
    const { layoutConfig } = useContext(LayoutContext);

    const reportTypes = [
        { label: 'Doanh thu', value: 'revenue' },
        { label: 'Đơn hàng', value: 'orders' },
        { label: 'Sản phẩm bán chạy', value: 'products' },
        { label: 'Khách hàng', value: 'customers' }
    ];

    // Biểu đồ doanh thu theo tháng
    const revenueData: ChartData = {
        labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
        datasets: [
            {
                label: 'Doanh thu (triệu VNĐ)',
                data: [45, 62, 78, 85, 92, 105],
                fill: false,
                backgroundColor: '#FF69B4',
                borderColor: '#FF69B4',
                tension: 0.4
            }
        ]
    };

    // Biểu đồ số lượng đơn hàng
    const ordersData: ChartData = {
        labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
        datasets: [
            {
                label: 'Số đơn hàng',
                data: [85, 110, 125, 95],
                backgroundColor: '#FFB6C1',
                borderColor: '#FFB6C1'
            }
        ]
    };

    // Biểu đồ danh mục sản phẩm
    const categoryData: ChartData = {
        labels: ['Gấu 30cm', 'Gấu 60cm', 'Gấu 90cm', 'Gấu Đặc Biệt', 'Bộ Sưu Tập'],
        datasets: [
            {
                data: [280, 320, 250, 180, 160],
                backgroundColor: ['#FF69B4', '#FFB6C1', '#FF1493', '#C71585', '#DB7093']
            }
        ]
    };

    const [chartOptions, setChartOptions] = useState<ChartOptions>({});

    const applyLightTheme = () => {
        const options: ChartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#495057'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef'
                    }
                },
                y: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef'
                    }
                }
            }
        };

        setChartOptions(options);
    };

    const applyDarkTheme = () => {
        const options: ChartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#ebedef'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)'
                    }
                },
                y: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)'
                    }
                }
            }
        };

        setChartOptions(options);
    };

    useEffect(() => {
        if (layoutConfig.colorScheme === 'light') {
            applyLightTheme();
        } else {
            applyDarkTheme();
        }
    }, [layoutConfig.colorScheme]);

    const topProducts = [
        { rank: 1, name: 'Gấu Bông Màu Hồng 60cm', category: 'Gấu 60cm', sold: 285, revenue: 42750000 },
        { rank: 2, name: 'Gấu Bông Nâu 30cm', category: 'Gấu 30cm', sold: 320, revenue: 25600000 },
        { rank: 3, name: 'Gấu Bông Trắng 90cm', category: 'Gấu 90cm', sold: 145, revenue: 43500000 },
        { rank: 4, name: 'Bộ Sưu Tập 3 Gấu', category: 'Bộ Sưu Tập', sold: 98, revenue: 29400000 },
        { rank: 5, name: 'Gấu Bông Kỳ Lân 60cm', category: 'Gấu Đặc Biệt', sold: 112, revenue: 33600000 }
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>Thống Kê & Báo Cáo - Web_TEDDY</h5>
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <label htmlFor="reportType">Loại báo cáo</label>
                            <Dropdown id="reportType" value={reportType} options={reportTypes} onChange={(e) => setReportType(e.value)} placeholder="Chọn loại báo cáo" className="w-full mt-2" />
                        </div>
                        <div className="col-12 md:col-6">
                            <label htmlFor="dateRange">Khoảng thời gian</label>
                            <Calendar
                                id="dateRange"
                                value={selectedDateRange}
                                onChange={(e) => setSelectedDateRange(e.value as Date[])}
                                selectionMode="range"
                                readOnlyInput
                                placeholder="Chọn khoảng thời gian"
                                className="w-full mt-2"
                                dateFormat="dd/mm/yy"
                            />
                        </div>
                    </div>
                    <div className="mt-3">
                        <Button label="Xuất báo cáo Excel" icon="pi pi-download" className="mr-2" />
                        <Button label="Xuất báo cáo PDF" icon="pi pi-file-pdf" severity="danger" />
                    </div>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Doanh Thu Tháng Này</span>
                            <div className="text-900 font-medium text-xl">125.300.000 ₫</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-pink-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-dollar text-pink-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">+15% </span>
                    <span className="text-500">so với tháng trước</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Đơn Hàng</span>
                            <div className="text-900 font-medium text-xl">415</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-shopping-cart text-purple-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">+22% </span>
                    <span className="text-500">so với tháng trước</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Khách Hàng Mới</span>
                            <div className="text-900 font-medium text-xl">87</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-red-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-users text-red-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">+10% </span>
                    <span className="text-500">so với tháng trước</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Tỷ Lệ Hoàn Thành</span>
                            <div className="text-900 font-medium text-xl">97.8%</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-teal-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-check-circle text-teal-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">+3.2% </span>
                    <span className="text-500">so với tháng trước</span>
                </div>
            </div>

            <div className="col-12 xl:col-6">
                <div className="card">
                    <h5>Doanh Thu Theo Tháng</h5>
                    <Chart type="line" data={revenueData} options={chartOptions} />
                </div>
            </div>

            <div className="col-12 xl:col-6">
                <div className="card">
                    <h5>Số Đơn Hàng Theo Tuần</h5>
                    <Chart type="bar" data={ordersData} options={chartOptions} />
                </div>
            </div>

            <div className="col-12 xl:col-6">
                <div className="card">
                    <h5>Doanh Thu Theo Kích Thước Gấu</h5>
                    <Chart type="pie" data={categoryData} />
                </div>
            </div>

            <div className="col-12 xl:col-6">
                <div className="card">
                    <h5>Top 5 Gấu Bông Bán Chạy</h5>
                    <DataTable value={topProducts} responsiveLayout="scroll">
                        <Column field="rank" header="Hạng" style={{ width: '10%' }}></Column>
                        <Column field="name" header="Sản phẩm" style={{ width: '30%' }}></Column>
                        <Column field="category" header="Kích thước" style={{ width: '25%' }}></Column>
                        <Column field="sold" header="Đã bán" style={{ width: '15%' }}></Column>
                        <Column field="revenue" header="Doanh thu" body={(data) => formatCurrency(data.revenue)} style={{ width: '20%' }}></Column>
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
