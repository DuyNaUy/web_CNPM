/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { ChartData, ChartOptions } from 'chart.js';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { orderAPI, userManagementAPI } from '@/services/api';
import styles from './reports.module.css';

interface Stats {
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    completion_rate: number;
    revenue_by_month: Array<{month: string, revenue: number}>;
    orders_by_week: Array<{week: string, orders: number}>;
    revenue_by_size: Array<{size: string, revenue: number, count: number}>;
    top_products: Array<{id: number, name: string, category: string, sold: number, revenue: number}>;
}

const ReportsPage = () => {
    const [selectedDateRange, setSelectedDateRange] = useState<Date[] | null>(null);
    const [reportType, setReportType] = useState('revenue');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const { layoutConfig } = useContext(LayoutContext);
    const toast = useRef<Toast>(null);

    const reportTypes = [
        { label: 'Doanh thu', value: 'revenue' },
        { label: 'Đơn hàng', value: 'orders' },
        { label: 'Sản phẩm bán chạy', value: 'products' },
        { label: 'Khách hàng', value: 'customers' }
    ];

    const formatDateForApi = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getDateRangeParams = () => {
        let startDate = '';
        let endDate = '';

        if (selectedDateRange && selectedDateRange.length === 2) {
            if (selectedDateRange[0]) {
                startDate = formatDateForApi(selectedDateRange[0]);
            }
            if (selectedDateRange[1]) {
                endDate = formatDateForApi(selectedDateRange[1]);
            }
        }

        return { startDate, endDate };
    };

    const loadStats = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getDateRangeParams();
            // Lấy thống kê đơn hàng
            const response = await orderAPI.getStats(startDate, endDate);
            setStats(response);
            
            // Lấy số lượng khách hàng từ quản lý tài khoản
            try {
                const usersResponse = await userManagementAPI.getAll({ role: 'customer' });
                console.log('Users Response:', usersResponse);
                
                if (usersResponse.data && Array.isArray(usersResponse.data)) {
                    // Backend trả về {success: true, data: [...]}
                    setTotalCustomers(usersResponse.data.length);
                } else if (usersResponse.results) {
                    // Trường hợp có pagination
                    setTotalCustomers(usersResponse.count || usersResponse.results.length);
                } else if (Array.isArray(usersResponse)) {
                    // Trường hợp trả về array trực tiếp
                    setTotalCustomers(usersResponse.length);
                }
            } catch (userError) {
                console.error('Không thể lấy số lượng khách hàng:', userError);
            }
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể tải thống kê',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    // Biểu đồ doanh thu theo tháng
    const revenueData: ChartData = {
        labels: stats?.revenue_by_month?.map(item => item.month) || ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
        datasets: [
            {
                label: 'Doanh thu (VNĐ)',
                data: stats?.revenue_by_month?.map(item => item.revenue / 1000000) || [0, 0, 0, 0, 0, 0],
                fill: false,
                backgroundColor: '#FF69B4',
                borderColor: '#FF69B4',
                tension: 0.4
            }
        ]
    };

    // Biểu đồ số lượng đơn hàng
    const ordersData: ChartData = {
        labels: stats?.orders_by_week?.map(item => item.week) || ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
        datasets: [
            {
                label: 'Số đơn hàng',
                data: stats?.orders_by_week?.map(item => item.orders) || [0, 0, 0, 0],
                backgroundColor: '#FFB6C1',
                borderColor: '#FFB6C1'
            }
        ]
    };

    // Biểu đồ danh mục sản phẩm
    const categoryData: ChartData = {
        labels: stats?.revenue_by_size?.map(item => `Gấu ${item.size}`) || ['Gấu 30cm', 'Gấu 60cm', 'Gấu 90cm'],
        datasets: [
            {
                data: stats?.revenue_by_size?.map(item => item.revenue / 1000000) || [0, 0, 0],
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

    const topProducts = stats?.top_products?.map((item, index) => ({
        rank: index + 1,
        name: item.name,
        category: item.category,
        sold: item.sold,
        revenue: item.revenue
    })) || [];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const handleExportExcel = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getDateRangeParams();
            
            await orderAPI.exportExcel(reportType, startDate, endDate);
            toast.current?.show({ severity: 'success', summary: 'Thành công', detail: 'Đã xuất Excel', life: 3000 });
        } catch (error: any) {
            toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: error.message, life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getDateRangeParams();
            
            await orderAPI.exportPDF(reportType, startDate, endDate);
            toast.current?.show({ severity: 'success', summary: 'Thành công', detail: 'Đã xuất PDF', life: 3000 });
        } catch (error: any) {
            toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: error.message, life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleApplyDateFilter = async () => {
        if (selectedDateRange && selectedDateRange.length === 1) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Thiếu dữ liệu',
                detail: 'Vui lòng chọn đủ ngày bắt đầu và kết thúc',
                life: 3000
            });
            return;
        }

        await loadStats();
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            
            {/* Header Card */}
            <div className="col-12">
                <div className="card" style={{ background: 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)', color: 'white' }}>
                    <div className="flex align-items-center justify-content-between">
                        <div>
                            <h2 className="mb-2" style={{ color: 'white' }}>📊 Thống Kê & Báo Cáo</h2>
                            <p className="mb-0 text-white-alpha-90">Quản lý và phân tích dữ liệu kinh doanh Web_TEDDY</p>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-white-alpha-20 border-round" style={{ width: '4rem', height: '4rem' }}>
                            <i className="pi pi-chart-bar text-white" style={{ fontSize: '2rem' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Controls */}
            <div className="col-12">
                <div className="card">
                    <div className="grid">
                        <div className="col-12 lg:col-4">
                            <label htmlFor="reportType" className="font-semibold block mb-2">
                                <i className="pi pi-file mr-2"></i>Loại báo cáo
                            </label>
                            <Dropdown 
                                id="reportType" 
                                value={reportType} 
                                options={reportTypes} 
                                onChange={(e) => setReportType(e.value)} 
                                placeholder="Chọn loại báo cáo" 
                                className="w-full" 
                            />
                        </div>
                        <div className="col-12 lg:col-5">
                            <label htmlFor="dateRange" className="font-semibold block mb-2">
                                <i className="pi pi-calendar mr-2"></i>Khoảng thời gian
                            </label>
                            <Calendar
                                id="dateRange"
                                value={selectedDateRange}
                                onChange={(e) => setSelectedDateRange(e.value as Date[])}
                                selectionMode="range"
                                readOnlyInput
                                placeholder="Chọn khoảng thời gian"
                                className="w-full"
                                dateFormat="dd/mm/yy"
                                showIcon
                            />
                        </div>
                        <div className="col-12 lg:col-3 flex align-items-end gap-2">
                            <Button
                                label="Áp dụng lọc"
                                icon="pi pi-filter"
                                className={`${styles.applyFilterButton} flex-1`}
                                onClick={handleApplyDateFilter}
                                loading={loading}
                                size="small"
                            />
                            <Button 
                                label="Xuất Excel"
                                icon="pi pi-file-excel" 
                                className="flex-1" 
                                onClick={handleExportExcel} 
                                loading={loading}
                                severity="success"
                                outlined
                                size="small"
                            />
                            <Button 
                                label="Xuất PDF"
                                icon="pi pi-file-pdf" 
                                className="flex-1" 
                                severity="danger" 
                                onClick={handleExportPDF} 
                                loading={loading}
                                outlined
                                size="small"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0 border-1 surface-border" style={{ borderLeft: '4px solid #FF69B4' }}>
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">💰 Tổng Doanh Thu</span>
                            <div className="text-900 font-bold text-2xl">{formatCurrency(stats?.total_revenue || 0)}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-pink-100 border-round" style={{ width: '3rem', height: '3rem' }}>
                            <i className="pi pi-dollar text-pink-500" style={{ fontSize: '1.5rem' }} />
                        </div>
                    </div>
                    <span className="text-500 text-sm">Tổng doanh thu từ tất cả đơn hàng</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0 border-1 surface-border" style={{ borderLeft: '4px solid #9C27B0' }}>
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">📦 Tổng Đơn Hàng</span>
                            <div className="text-900 font-bold text-2xl">{stats?.total_orders || 0}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '3rem', height: '3rem' }}>
                            <i className="pi pi-shopping-cart text-purple-500" style={{ fontSize: '1.5rem' }} />
                        </div>
                    </div>
                    <span className="text-500 text-sm">Tổng số đơn hàng đã đặt</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0 border-1 surface-border" style={{ borderLeft: '4px solid #F44336' }}>
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">👥 Tổng Khách Hàng</span>
                            <div className="text-900 font-bold text-2xl">{totalCustomers}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-red-100 border-round" style={{ width: '3rem', height: '3rem' }}>
                            <i className="pi pi-users text-red-500" style={{ fontSize: '1.5rem' }} />
                        </div>
                    </div>
                    <span className="text-500 text-sm">Số lượng khách hàng đã đăng ký</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0 border-1 surface-border" style={{ borderLeft: '4px solid #009688' }}>
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">✅ Tỷ Lệ Hoàn Thành</span>
                            <div className="text-900 font-bold text-2xl">{stats?.completion_rate?.toFixed(1) || 0}%</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-teal-100 border-round" style={{ width: '3rem', height: '3rem' }}>
                            <i className="pi pi-check-circle text-teal-500" style={{ fontSize: '1.5rem' }} />
                        </div>
                    </div>
                    <span className="text-500 text-sm">Đơn hàng đã giao thành công</span>
                </div>
            </div>

            {/* Charts */}
            <div className="col-12 xl:col-6">
                <div className="card shadow-3">
                    <div className="flex align-items-center justify-content-between mb-4">
                        <h5 className="m-0">
                            <i className="pi pi-calendar text-pink-500 mr-2"></i>
                            Số Đơn Hàng Theo Tuần
                        </h5>
                    </div>
                    <Chart type="bar" data={ordersData} options={chartOptions} />
                </div>
            </div>

            <div className="col-12 xl:col-6">
                <div className="card shadow-3">
                    <div className="flex align-items-center justify-content-between mb-4">
                        <h5 className="m-0">
                            <i className="pi pi-chart-pie text-purple-500 mr-2"></i>
                            Doanh Thu Theo Kích Thước (Triệu VNĐ)
                        </h5>
                    </div>
                    <Chart type="pie" data={categoryData} />
                </div>
            </div>

            {/* Top Products Table */}
            <div className="col-12">
                <div className="card shadow-3">
                    <div className="flex align-items-center justify-content-between mb-4">
                        <h5 className="m-0">
                            <i className="pi pi-star-fill text-yellow-500 mr-2"></i>
                            Top Sản Phẩm Bán Chạy
                        </h5>
                    </div>
                    <DataTable 
                        value={topProducts} 
                        responsiveLayout="scroll" 
                        emptyMessage="Chưa có dữ liệu"
                        stripedRows
                        showGridlines
                    >
                        <Column field="rank" header="Hạng" style={{ width: '10%' }} body={(data) => (
                            <span className="font-bold text-primary">{data.rank}</span>
                        )}></Column>
                        <Column field="name" header="Sản phẩm" style={{ width: '30%' }} body={(data) => (
                            <span className="font-semibold">{data.name}</span>
                        )}></Column>
                        <Column field="category" header="Danh mục" style={{ width: '20%' }}></Column>
                        <Column field="sold" header="Đã bán" style={{ width: '15%' }} body={(data) => (
                            <span className="text-green-600 font-semibold">{data.sold}</span>
                        )}></Column>
                        <Column field="revenue" header="Doanh thu" body={(data) => (
                            <span className="text-pink-600 font-bold">{formatCurrency(data.revenue)}</span>
                        )} style={{ width: '25%' }}></Column>
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
