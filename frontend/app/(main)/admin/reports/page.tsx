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
                data: [65, 59, 80, 81, 56, 95],
                fill: false,
                backgroundColor: '#42A5F5',
                borderColor: '#42A5F5',
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
                data: [120, 150, 180, 140],
                backgroundColor: '#66BB6A',
                borderColor: '#66BB6A'
            }
        ]
    };

    // Biểu đồ danh mục sản phẩm
    const categoryData: ChartData = {
        labels: ['Rau Củ Quả', 'Thịt Tươi', 'Hải Sản', 'Trứng & Sữa', 'Gạo & Ngũ Cốc'],
        datasets: [
            {
                data: [300, 250, 200, 180, 150],
                backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#26C6DA', '#AB47BC']
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
        { rank: 1, name: 'Rau Củ Tươi', category: 'Rau Củ Quả', sold: 450, revenue: 11250000 },
        { rank: 2, name: 'Thịt Bò Úc', category: 'Thịt Tươi', sold: 150, revenue: 52500000 },
        { rank: 3, name: 'Tôm Sú Sống', category: 'Hải Sản', sold: 120, revenue: 33600000 },
        { rank: 4, name: 'Trứng Gà Organic', category: 'Trứng & Sữa', sold: 300, revenue: 19500000 },
        { rank: 5, name: 'Gạo ST25', category: 'Gạo & Ngũ Cốc', sold: 200, revenue: 24000000 }
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>Thống Kê & Báo Cáo</h5>
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
                            <div className="text-900 font-medium text-xl">85.500.000 ₫</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-dollar text-blue-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">+12% </span>
                    <span className="text-500">so với tháng trước</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Đơn Hàng</span>
                            <div className="text-900 font-medium text-xl">590</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-shopping-cart text-orange-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">+18% </span>
                    <span className="text-500">so với tháng trước</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Khách Hàng Mới</span>
                            <div className="text-900 font-medium text-xl">125</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-users text-cyan-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">+8% </span>
                    <span className="text-500">so với tháng trước</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Tỷ Lệ Hoàn Thành</span>
                            <div className="text-900 font-medium text-xl">95.5%</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-check-circle text-purple-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">+2.5% </span>
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
                    <h5>Doanh Thu Theo Danh Mục</h5>
                    <Chart type="pie" data={categoryData} />
                </div>
            </div>

            <div className="col-12 xl:col-6">
                <div className="card">
                    <h5>Top 5 Sản Phẩm Bán Chạy</h5>
                    <DataTable value={topProducts} responsiveLayout="scroll">
                        <Column field="rank" header="Hạng" style={{ width: '10%' }}></Column>
                        <Column field="name" header="Sản phẩm" style={{ width: '30%' }}></Column>
                        <Column field="category" header="Danh mục" style={{ width: '25%' }}></Column>
                        <Column field="sold" header="Đã bán" style={{ width: '15%' }}></Column>
                        <Column field="revenue" header="Doanh thu" body={(data) => formatCurrency(data.revenue)} style={{ width: '20%' }}></Column>
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
