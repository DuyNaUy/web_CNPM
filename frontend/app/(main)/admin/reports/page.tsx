/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import React, { useContext, useEffect, useState } from 'react';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { ChartData, ChartOptions } from 'chart.js';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportsPage = () => {
    const [selectedDateRange, setSelectedDateRange] = useState<Date[] | null>(null);
    const [reportType, setReportType] = useState('revenue');
    const [exportDialogVisible, setExportDialogVisible] = useState(false);
    const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
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

    const formatDateRange = () => {
        if (!selectedDateRange || selectedDateRange.length < 2) {
            return 'Chưa chọn khoảng thời gian';
        }
        const startDate = selectedDateRange[0]?.toLocaleDateString('vi-VN') || '';
        const endDate = selectedDateRange[1]?.toLocaleDateString('vi-VN') || '';
        return `${startDate} - ${endDate}`;
    };

    const formatDateToAPI = (date: Date | null) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchReportData = async (type: 'excel' | 'pdf') => {
        setIsLoading(true);
        try {
            if (!selectedDateRange || selectedDateRange.length < 2) {
                alert('Vui lòng chọn khoảng thời gian');
                setIsLoading(false);
                return;
            }

            const startDate = formatDateToAPI(selectedDateRange[0]);
            const endDate = formatDateToAPI(selectedDateRange[1]);

            const response = await fetch(
                `http://localhost:8000/api/orders/report/?type=${reportType}&start_date=${startDate}&end_date=${endDate}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
                    }
                }
            );

            if (!response.ok) {
                alert('Lỗi khi tải dữ liệu báo cáo');
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            setReportData(data);
            setExportType(type);
            setExportDialogVisible(true);
        } catch (error) {
            console.error('Error fetching report data:', error);
            alert('Lỗi khi tải dữ liệu báo cáo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!reportData) return;

        const workbook = XLSX.utils.book_new();
        const worksheet_data: any[] = [];

        worksheet_data.push(['BÁO CÁO DOANH SỐ KINH DOANH']);
        worksheet_data.push([]);
        worksheet_data.push(['Loại báo cáo:', reportData.report_type === 'revenue' ? 'Doanh thu' : reportData.report_type === 'orders' ? 'Đơn hàng' : reportData.report_type === 'products' ? 'Sản phẩm' : 'Khách hàng']);
        worksheet_data.push(['Từ ngày:', reportData.start_date]);
        worksheet_data.push(['Đến ngày:', reportData.end_date]);
        worksheet_data.push([]);

        if (reportData.report_type === 'revenue') {
            worksheet_data.push(['Tổng doanh thu:', formatCurrency(reportData.total_revenue)]);
            worksheet_data.push(['Doanh thu hoàn thành:', formatCurrency(reportData.completed_revenue)]);
            worksheet_data.push(['Tổng đơn hàng:', reportData.total_orders]);
            worksheet_data.push(['Trung bình/đơn:', formatCurrency(reportData.avg_order_value)]);
        } else if (reportData.report_type === 'orders') {
            worksheet_data.push(['Tổng đơn hàng:', reportData.total]);
            worksheet_data.push(['Chờ xác nhận:', reportData.pending]);
            worksheet_data.push(['Đã xác nhận:', reportData.confirmed]);
            worksheet_data.push(['Đang vận chuyển:', reportData.shipping]);
            worksheet_data.push(['Đã giao:', reportData.delivered]);
            worksheet_data.push(['Đã hủy:', reportData.cancelled]);
        } else if (reportData.report_type === 'products') {
            worksheet_data.push(['Sản phẩm bán chạy']);
            worksheet_data.push(['Sản phẩm', 'Số lượng', 'Doanh thu']);
            reportData.top_products?.forEach((product: any) => {
                worksheet_data.push([product.product_name, product.sold, product.revenue]);
            });
        } else if (reportData.report_type === 'customers') {
            worksheet_data.push(['Tổng khách hàng:', reportData.unique_customers]);
            worksheet_data.push(['Tổng đơn hàng:', reportData.total_orders]);
            worksheet_data.push(['Tổng chi tiêu:', formatCurrency(reportData.total_spending)]);
            worksheet_data.push(['Chi tiêu trung bình:', formatCurrency(reportData.avg_spending)]);
        }

        const worksheet = XLSX.utils.aoa_to_sheet(worksheet_data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo cáo');
        const filename = `BaoCao_${reportType}_${formatDateToAPI(selectedDateRange?.[0] || null)}_${formatDateToAPI(selectedDateRange?.[1] || null)}.xlsx`;
        XLSX.writeFile(workbook, filename);
        
        setExportDialogVisible(false);
    };

    const handleExportPDF = async () => {
        if (!reportData) return;

        try {
            const element = document.getElementById('report-content');
            if (!element) return;

            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            const filename = `BaoCao_${reportType}_${formatDateToAPI(selectedDateRange?.[0] || null)}_${formatDateToAPI(selectedDateRange?.[1] || null)}.pdf`;
            pdf.save(filename);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Lỗi khi tạo file PDF');
        }
        
        setExportDialogVisible(false);
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
                        <Button label="Xuất báo cáo Excel" icon="pi pi-download" className="mr-2" onClick={() => fetchReportData('excel')} loading={isLoading} />
                        <Button label="Xuất báo cáo PDF" icon="pi pi-file-pdf" severity="danger" onClick={() => fetchReportData('pdf')} loading={isLoading} />
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

            {/* Report Content for PDF Export */}
            <div id="report-content" style={{ display: exportDialogVisible ? 'block' : 'none', position: 'absolute', left: '-9999px' }}>
                <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                    <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>BÁO CÁO DOANH SỐ KINH DOANH</h1>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <p><strong>Loại báo cáo:</strong> {reportData?.report_type === 'revenue' ? 'Doanh thu' : reportData?.report_type === 'orders' ? 'Đơn hàng' : reportData?.report_type === 'products' ? 'Sản phẩm' : 'Khách hàng'}</p>
                        <p><strong>Từ ngày:</strong> {reportData?.start_date}</p>
                        <p><strong>Đến ngày:</strong> {reportData?.end_date}</p>
                    </div>

                    {reportData?.report_type === 'revenue' && (
                        <div>
                            <h3>Báo Cáo Doanh Thu</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px' }}>Tổng doanh thu:</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(reportData.total_revenue)}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px' }}>Doanh thu hoàn thành:</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(reportData.completed_revenue)}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px' }}>Tổng đơn hàng:</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{reportData.total_orders}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px' }}>Trung bình/đơn:</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(reportData.avg_order_value)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {reportData?.report_type === 'orders' && (
                        <div>
                            <h3>Báo Cáo Đơn Hàng</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px' }}>Tổng đơn hàng:</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{reportData.total}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px' }}>Chờ xác nhận:</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{reportData.pending}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px' }}>Đã xác nhận:</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{reportData.confirmed}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px' }}>Đang vận chuyển:</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{reportData.shipping}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px' }}>Đã giao:</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{reportData.delivered}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px' }}>Đã hủy:</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{reportData.cancelled}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Export Dialog */}
            <Dialog
                visible={exportDialogVisible}
                onHide={() => setExportDialogVisible(false)}
                header={exportType === 'excel' ? 'Xuất Báo Cáo Excel' : 'Xuất Báo Cáo PDF'}
                modal
                style={{ width: '50vw' }}
                className="p-fluid"
            >
                <div className="surface-section p-4 border-round">
                    <h6 className="text-900 mb-3">Thông Tin Báo Cáo</h6>
                    
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="mb-3">
                                <label className="text-500 font-medium block mb-2">Loại Báo Cáo</label>
                                <div className="text-900 font-medium">{reportData?.report_type === 'revenue' ? 'Doanh thu' : reportData?.report_type === 'orders' ? 'Đơn hàng' : reportData?.report_type === 'products' ? 'Sản phẩm' : 'Khách hàng'}</div>
                            </div>
                        </div>
                        
                        <div className="col-12 md:col-6">
                            <div className="mb-3">
                                <label className="text-500 font-medium block mb-2">Khoảng Thời Gian</label>
                                <div className="text-900 font-medium">{formatDateRange()}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="text-500 font-medium block mb-2">Nội Dung Báo Cáo</label>
                        <div className="border-1 surface-border border-round p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {reportData?.report_type === 'revenue' && (
                                <div>
                                    <h6>Doanh Thu</h6>
                                    <p><strong>Tổng doanh thu:</strong> {formatCurrency(reportData.total_revenue)}</p>
                                    <p><strong>Doanh thu hoàn thành:</strong> {formatCurrency(reportData.completed_revenue)}</p>
                                    <p><strong>Tổng đơn hàng:</strong> {reportData.total_orders}</p>
                                    <p className="text-green-600 font-medium"><strong>Trung bình/đơn:</strong> {formatCurrency(reportData.avg_order_value)}</p>
                                </div>
                            )}
                            
                            {reportData?.report_type === 'orders' && (
                                <div>
                                    <h6>Đơn Hàng</h6>
                                    <p><strong>Tổng:</strong> {reportData.total}</p>
                                    <p><strong>Chờ xác nhận:</strong> {reportData.pending}</p>
                                    <p><strong>Đã xác nhận:</strong> {reportData.confirmed}</p>
                                    <p><strong>Đang vận chuyển:</strong> {reportData.shipping}</p>
                                    <p><strong>Đã giao:</strong> {reportData.delivered}</p>
                                    <p><strong>Đã hủy:</strong> {reportData.cancelled}</p>
                                </div>
                            )}
                            
                            {reportData?.report_type === 'products' && (
                                <div>
                                    <h6>Sản phẩm bán chạy</h6>
                                    <table style={{ width: '100%', fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                <th style={{ padding: '4px', textAlign: 'left' }}>Sản phẩm</th>
                                                <th style={{ padding: '4px', textAlign: 'right' }}>Số lượng</th>
                                                <th style={{ padding: '4px', textAlign: 'right' }}>Doanh thu</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.top_products?.map((product: any, idx: number) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '4px' }}>{product.product_name}</td>
                                                    <td style={{ padding: '4px', textAlign: 'right' }}>{product.sold}</td>
                                                    <td style={{ padding: '4px', textAlign: 'right' }}>{formatCurrency(product.revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            
                            {reportData?.report_type === 'customers' && (
                                <div>
                                    <h6>Khách Hàng</h6>
                                    <p><strong>Tổng khách hàng:</strong> {reportData.unique_customers}</p>
                                    <p><strong>Tổng đơn hàng:</strong> {reportData.total_orders}</p>
                                    <p><strong>Tổng chi tiêu:</strong> {formatCurrency(reportData.total_spending)}</p>
                                    <p className="text-green-600 font-medium"><strong>Chi tiêu trung bình:</strong> {formatCurrency(reportData.avg_spending)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-content-end gap-2 mt-4">
                    <Button label="Hủy" icon="pi pi-times" severity="secondary" onClick={() => setExportDialogVisible(false)} />
                    <Button
                        label={exportType === 'excel' ? 'Tải Excel' : 'Tải PDF'}
                        icon={exportType === 'excel' ? 'pi pi-download' : 'pi pi-file-pdf'}
                        onClick={exportType === 'excel' ? handleExportExcel : handleExportPDF}
                    />
                </div>
            </Dialog>
        </div>
    );
};

export default ReportsPage;
