/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useRef, useState } from 'react';
import { Rating } from 'primereact/rating';
import { Tag } from 'primereact/tag';

interface Review {
    id: number;
    productName: string;
    customerName: string;
    rating: number;
    comment: string;
    status: string;
    createdAt: string;
}

const ReviewsPage = () => {
    const [reviews, setReviews] = useState<Review[]>([
        {
            id: 1,
            productName: 'Cải Thảo Hữu Cơ',
            customerName: 'Hoàng Văn Quang',
            rating: 5,
            comment: 'Sản phẩm rất tươi và sạch, tôi rất hài lòng!',
            status: 'approved',
            createdAt: '2024-11-08'
        },
        {
            id: 2,
            productName: 'Thịt Bò Úc',
            customerName: 'Lê Thu Mai',
            rating: 4,
            comment: 'Thịt ngon, chất lượng tốt nhưng giá hơi cao',
            status: 'approved',
            createdAt: '2024-11-07'
        },
        {
            id: 3,
            productName: 'Tôm Sú Sống',
            customerName: 'Lê Thu Mai',
            rating: 5,
            comment: 'Tôm rất tươi, size lớn đẹp!',
            status: 'pending',
            createdAt: '2024-11-07'
        },
        {
            id: 4,
            productName: 'Trứng Gà Organic',
            customerName: 'Nguyễn Hoàng Dương',
            rating: 3,
            comment: 'Bình thường, không có gì đặc biệt',
            status: 'pending',
            createdAt: '2024-11-06'
        },
        {
            id: 5,
            productName: 'Gạo ST25',
            customerName: 'Lương Trọng Duy',
            rating: 5,
            comment: 'Gạo ngon, hạt dẻo thơm, gia đình rất thích',
            status: 'approved',
            createdAt: '2024-11-05'
        }
    ]);

    const [reviewDialog, setReviewDialog] = useState(false);
    const [deleteReviewDialog, setDeleteReviewDialog] = useState(false);
    const [review, setReview] = useState<Review | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef<Toast>(null);

    const viewReview = (review: Review) => {
        setReview({ ...review });
        setReviewDialog(true);
    };

    const hideDialog = () => {
        setReviewDialog(false);
    };

    const hideDeleteReviewDialog = () => {
        setDeleteReviewDialog(false);
    };

    const approveReview = (reviewId: number) => {
        let _reviews = [...reviews];
        const index = _reviews.findIndex((r) => r.id === reviewId);
        _reviews[index].status = 'approved';
        setReviews(_reviews);
        toast.current?.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã duyệt đánh giá',
            life: 3000
        });
    };

    const rejectReview = (reviewId: number) => {
        let _reviews = [...reviews];
        const index = _reviews.findIndex((r) => r.id === reviewId);
        _reviews[index].status = 'rejected';
        setReviews(_reviews);
        toast.current?.show({
            severity: 'info',
            summary: 'Thông báo',
            detail: 'Đã từ chối đánh giá',
            life: 3000
        });
    };

    const confirmDeleteReview = (review: Review) => {
        setReview(review);
        setDeleteReviewDialog(true);
    };

    const deleteReview = () => {
        if (review) {
            let _reviews = reviews.filter((val) => val.id !== review.id);
            setReviews(_reviews);
            setDeleteReviewDialog(false);
            setReview(null);
            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Xóa đánh giá thành công',
                life: 3000
            });
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <h4 className="m-0">Quản Lý Đánh Giá</h4>
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        return <Button label="Xuất Excel" icon="pi pi-download" className="p-button-help" />;
    };

    const actionBodyTemplate = (rowData: Review) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-eye" rounded outlined className="mr-2" onClick={() => viewReview(rowData)} tooltip="Xem chi tiết" />
                {rowData.status === 'pending' && (
                    <>
                        <Button icon="pi pi-check" rounded outlined severity="success" className="mr-2" onClick={() => approveReview(rowData.id)} tooltip="Duyệt" />
                        <Button icon="pi pi-times" rounded outlined severity="warning" className="mr-2" onClick={() => rejectReview(rowData.id)} tooltip="Từ chối" />
                    </>
                )}
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteReview(rowData)} tooltip="Xóa" />
            </React.Fragment>
        );
    };

    const statusBodyTemplate = (rowData: Review) => {
        const statusMap: { [key: string]: { label: string; severity: any } } = {
            pending: { label: 'Chờ duyệt', severity: 'warning' },
            approved: { label: 'Đã duyệt', severity: 'success' },
            rejected: { label: 'Đã từ chối', severity: 'danger' }
        };
        const status = statusMap[rowData.status] || statusMap['pending'];
        return <Tag value={status.label} severity={status.severity} />;
    };

    const ratingBodyTemplate = (rowData: Review) => {
        return <Rating value={rowData.rating} readOnly cancel={false} />;
    };

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <h4 className="m-0">Danh Sách Đánh Giá</h4>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" placeholder="Tìm kiếm..." onInput={(e) => setGlobalFilter((e.target as HTMLInputElement).value)} />
            </span>
        </div>
    );

    const reviewDialogFooter = (
        <React.Fragment>
            <Button label="Đóng" icon="pi pi-times" outlined onClick={hideDialog} />
        </React.Fragment>
    );

    const deleteReviewDialogFooter = (
        <React.Fragment>
            <Button label="Không" icon="pi pi-times" outlined onClick={hideDeleteReviewDialog} />
            <Button label="Có" icon="pi pi-check" severity="danger" onClick={deleteReview} />
        </React.Fragment>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <DataTable
                        value={reviews}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} đánh giá"
                        globalFilter={globalFilter}
                        header={header}
                    >
                        <Column field="id" header="ID" sortable style={{ minWidth: '4rem' }}></Column>
                        <Column field="productName" header="Sản phẩm" sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="customerName" header="Khách hàng" sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="rating" header="Đánh giá" body={ratingBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="status" header="Trạng thái" body={statusBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="createdAt" header="Ngày đánh giá" sortable style={{ minWidth: '10rem' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '16rem' }}></Column>
                    </DataTable>

                    <Dialog visible={reviewDialog} style={{ width: '40rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Chi Tiết Đánh Giá" modal footer={reviewDialogFooter} onHide={hideDialog}>
                        {review && (
                            <div className="grid">
                                <div className="col-12">
                                    <div className="field">
                                        <label className="font-bold">Sản phẩm:</label>
                                        <p className="text-xl">{review.productName}</p>
                                    </div>
                                    <div className="field">
                                        <label className="font-bold">Khách hàng:</label>
                                        <p>{review.customerName}</p>
                                    </div>
                                    <div className="field">
                                        <label className="font-bold">Đánh giá:</label>
                                        <div>
                                            <Rating value={review.rating} readOnly cancel={false} />
                                        </div>
                                    </div>
                                    <div className="field">
                                        <label className="font-bold">Nhận xét:</label>
                                        <p className="line-height-3">{review.comment}</p>
                                    </div>
                                    <div className="field">
                                        <label className="font-bold">Trạng thái:</label>
                                        <div className="mt-2">{statusBodyTemplate(review)}</div>
                                    </div>
                                    <div className="field">
                                        <label className="font-bold">Ngày đánh giá:</label>
                                        <p>{review.createdAt}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Dialog>

                    <Dialog visible={deleteReviewDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Xác nhận" modal footer={deleteReviewDialogFooter} onHide={hideDeleteReviewDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {review && <span>Bạn có chắc chắn muốn xóa đánh giá này?</span>}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default ReviewsPage;
