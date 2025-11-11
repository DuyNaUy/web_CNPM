/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Rating } from 'primereact/rating';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import React, { useRef, useState } from 'react';

interface Review {
    id: number;
    productId: number;
    productName: string;
    productImage: string;
    orderId: string;
    rating: number;
    comment: string;
    date: string;
}

const ReviewsPage = () => {
    const [reviews, setReviews] = useState<Review[]>([
        {
            id: 1,
            productId: 1,
            productName: 'Cải Thảo Hữu Cơ',
            productImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300',
            orderId: 'DH001234',
            rating: 5,
            comment: 'Sản phẩm rất tươi và sạch, rất hài lòng!',
            date: '2024-11-06'
        },
        {
            id: 2,
            productId: 4,
            productName: 'Trứng Gà Organic',
            productImage: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300',
            orderId: 'DH001234',
            rating: 4.5,
            comment: 'Trứng tươi, lòng đỏ đẹp. Giá hơi cao nhưng chất lượng xứng đáng.',
            date: '2024-11-06'
        }
    ]);

    const [unreviewed] = useState([
        {
            productId: 2,
            productName: 'Thịt Bò Úc',
            productImage: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=300',
            orderId: 'DH001235'
        },
        {
            productId: 5,
            productName: 'Gạo ST25',
            productImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300',
            orderId: 'DH001235'
        }
    ]);

    const [reviewDialog, setReviewDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentReview, setCurrentReview] = useState<any>({
        id: 0,
        productId: 0,
        productName: '',
        productImage: '',
        orderId: '',
        rating: 5,
        comment: ''
    });
    const toast = useRef<Toast>(null);

    const openNewReview = (product: any) => {
        setEditMode(false);
        setCurrentReview({
            id: 0,
            productId: product.productId,
            productName: product.productName,
            productImage: product.productImage,
            orderId: product.orderId,
            rating: 5,
            comment: ''
        });
        setReviewDialog(true);
    };

    const openEditReview = (review: Review) => {
        setEditMode(true);
        setCurrentReview({ ...review });
        setReviewDialog(true);
    };

    const hideDialog = () => {
        setReviewDialog(false);
        setCurrentReview({
            id: 0,
            productId: 0,
            productName: '',
            productImage: '',
            orderId: '',
            rating: 5,
            comment: ''
        });
    };

    const saveReview = () => {
        if (!currentReview.comment.trim()) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng nhập nội dung đánh giá',
                life: 3000
            });
            return;
        }

        if (editMode) {
            setReviews((prev) => prev.map((r) => (r.id === currentReview.id ? { ...currentReview, date: new Date().toISOString().split('T')[0] } : r)));
            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đánh giá đã được cập nhật',
                life: 3000
            });
        } else {
            const newReview = {
                ...currentReview,
                id: Math.max(...reviews.map((r) => r.id), 0) + 1,
                date: new Date().toISOString().split('T')[0]
            };
            setReviews((prev) => [...prev, newReview]);
            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đánh giá đã được gửi',
                life: 3000
            });
        }
        hideDialog();
    };

    const confirmDelete = (review: Review) => {
        confirmDialog({
            message: `Bạn có chắc chắn muốn xóa đánh giá của "${review.productName}"?`,
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: () => deleteReview(review.id),
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const deleteReview = (id: number) => {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        toast.current?.show({
            severity: 'success',
            summary: 'Đã xóa',
            detail: 'Đánh giá đã được xóa',
            life: 3000
        });
    };

    const productBodyTemplate = (rowData: Review | any) => {
        return (
            <div className="flex align-items-center">
                <img src={rowData.productImage} alt={rowData.productName} className="w-4rem h-4rem border-round mr-3" style={{ objectFit: 'cover' }} />
                <div>
                    <div className="font-bold">{rowData.productName}</div>
                    <div className="text-sm text-600">Đơn hàng: {rowData.orderId}</div>
                </div>
            </div>
        );
    };

    const ratingBodyTemplate = (rowData: Review) => {
        return <Rating value={rowData.rating} readOnly cancel={false} />;
    };

    const actionBodyTemplate = (rowData: Review) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded outlined onClick={() => openEditReview(rowData)} tooltip="Sửa" />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Xóa" />
            </div>
        );
    };

    const unreviewedActionTemplate = (rowData: any) => {
        return <Button label="Đánh giá ngay" icon="pi pi-star" onClick={() => openNewReview(rowData)} />;
    };

    const dialogFooter = (
        <div>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveReview} />
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />

            {unreviewed.length > 0 && (
                <div className="col-12">
                    <div className="card">
                        <h5>Sản phẩm chưa đánh giá</h5>
                        <DataTable value={unreviewed} responsiveLayout="scroll">
                            <Column header="Sản phẩm" body={productBodyTemplate} />
                            <Column body={unreviewedActionTemplate} style={{ width: '200px' }} />
                        </DataTable>
                    </div>
                </div>
            )}

            <div className="col-12">
                <div className="card">
                    <h5>Đánh giá của tôi</h5>

                    {reviews.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="pi pi-star text-6xl text-400 mb-3"></i>
                            <h6 className="text-600">Bạn chưa có đánh giá nào</h6>
                        </div>
                    ) : (
                        <DataTable value={reviews} responsiveLayout="scroll">
                            <Column header="Sản phẩm" body={productBodyTemplate} style={{ minWidth: '300px' }} />
                            <Column header="Đánh giá" body={ratingBodyTemplate} style={{ minWidth: '150px' }} />
                            <Column field="comment" header="Nhận xét" style={{ minWidth: '300px' }} />
                            <Column field="date" header="Ngày đánh giá" style={{ minWidth: '120px' }} />
                            <Column body={actionBodyTemplate} exportable={false} style={{ width: '150px' }} />
                        </DataTable>
                    )}
                </div>
            </div>

            <Dialog visible={reviewDialog} style={{ width: '600px' }} header={editMode ? 'Sửa đánh giá' : 'Đánh giá sản phẩm'} modal className="p-fluid" footer={dialogFooter} onHide={hideDialog}>
                <div className="field">
                    <div className="flex align-items-center mb-3 pb-3 border-bottom-1 surface-border">
                        <img src={currentReview.productImage} alt={currentReview.productName} className="w-5rem h-5rem border-round mr-3" style={{ objectFit: 'cover' }} />
                        <div>
                            <div className="font-bold text-lg">{currentReview.productName}</div>
                            <div className="text-600">Đơn hàng: {currentReview.orderId}</div>
                        </div>
                    </div>
                </div>

                <div className="field">
                    <label>Đánh giá của bạn</label>
                    <Rating value={currentReview.rating} onChange={(e) => setCurrentReview({ ...currentReview, rating: e.value })} cancel={false} className="text-2xl" />
                </div>

                <div className="field">
                    <label htmlFor="comment">Nhận xét của bạn</label>
                    <InputTextarea id="comment" value={currentReview.comment} onChange={(e) => setCurrentReview({ ...currentReview, comment: e.target.value })} rows={5} placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..." />
                </div>
            </Dialog>
        </div>
    );
};

export default ReviewsPage;
