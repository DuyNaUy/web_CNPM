'use client';

import React, { useState, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import styles from './SizeSelectionModal.module.css';

interface ProductVariant {
  id?: number;
  size: string;
  price: number;
  stock: number;
}

interface Recommendation {
  product_id: number;
  product_name: string;
  price?: number;
  image_url?: string;
  old_price?: number;
  slug?: string;
}

interface SizeSelectionModalProps {
  isOpen: boolean;
  product: Recommendation;
  variants: ProductVariant[];
  onActionType: 'add-to-cart' | 'buy-now' | null;
  onConfirm: (selectedSize: string, quantity: number) => void;
  onClose: () => void;
}

export default function SizeSelectionModal({
  isOpen,
  product,
  variants,
  onActionType,
  onConfirm,
  onClose,
}: SizeSelectionModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const toastRef = React.useRef<Toast>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSize('');
      setQuantity(1);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    // Validate size selection
    if (!selectedSize) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng chọn kích thước',
        life: 3000,
      });
      return;
    }

    // Validate quantity
    if (quantity < 1) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập số lượng >= 1',
        life: 3000,
      });
      return;
    }

    // Check stock
    const selectedVariant = variants.find((v) => v.size === selectedSize);
    if (selectedVariant && quantity > selectedVariant.stock) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: `Chỉ còn ${selectedVariant.stock} sản phẩm trong kho`,
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      onConfirm(selectedSize, quantity);
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Có lỗi xảy ra',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getMaxStock = (): number => {
    if (!selectedSize) return 0;
    const variant = variants.find((v) => v.size === selectedSize);
    return variant ? variant.stock : 0;
  };

  const getSelectedPrice = (): number => {
    if (!selectedSize) return product.price || 0;
    const variant = variants.find((v) => v.size === selectedSize);
    return variant ? variant.price : (product.price || 0);
  };

  if (!isOpen) return null;

  return (
    <>
      <Toast ref={toastRef} position="bottom-right" />
      
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose} />
      
      {/* Modal */}
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {onActionType === 'buy-now' ? '🛍️ Mua ngay' : '🛒 Thêm vào giỏ'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {/* Product Info */}
          <div className={styles.productInfo}>
            <div className={styles.productImage}>
              {product.image_url ? (
                <img src={product.image_url} alt={product.product_name} />
              ) : (
                <div className={styles.placeholderImage}>📷</div>
              )}
            </div>

            <div className={styles.productDetails}>
              <h3 className={styles.productName}>{product.product_name}</h3>
              <p className={styles.productPrice}>
                <span className={styles.currentPrice}>
                  {(getSelectedPrice() || 0).toLocaleString('vi-VN')} ₫
                </span>
                {product.old_price && (
                  <span className={styles.oldPrice}>
                    {(product.old_price || 0).toLocaleString('vi-VN')} ₫
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Size Selection */}
          <div className={styles.sectionContainer}>
            <label className={styles.sectionLabel}>Chọn kích thước:</label>
            <div className={styles.sizeGrid}>
              {variants.map((variant) => (
                <button
                  key={variant.size}
                  onClick={() => variant.stock > 0 && setSelectedSize(variant.size)}
                  className={`${styles.sizeButton} ${
                    selectedSize === variant.size ? styles.selected : ''
                  } ${variant.stock === 0 ? styles.disabled : ''}`}
                  disabled={variant.stock === 0}
                  title={variant.stock === 0 ? 'Hết hàng' : `${variant.size} - Còn ${variant.stock}`}
                >
                  <span className={styles.sizeName}>{variant.size}</span>
                  <span className={styles.sizeStock}>
                    {variant.stock > 0 ? `(${variant.stock})` : 'Hết'}
                  </span>
                  {variant.price !== product.price && (
                    <span className={styles.sizePrice}>
                      +{(variant.price - (product.price || 0)).toLocaleString('vi-VN')} ₫
                    </span>
                  )}
                </button>
              ))}
            </div>
            {selectedSize && (
              <p className={styles.selectedInfo}>
                ✓ Đã chọn: <strong>{selectedSize}</strong>
              </p>
            )}
          </div>

          {/* Quantity Selection */}
          <div className={styles.sectionContainer}>
            <label className={styles.sectionLabel}>Số lượng:</label>
            <div className={styles.quantityContainer}>
              <InputNumber
                value={quantity}
                onValueChange={(e) => setQuantity(e.value || 1)}
                mode="decimal"
                showButtons
                min={1}
                max={getMaxStock()}
                buttonLayout="horizontal"
                decrementButtonClassName={`${styles.quantityBtn} p-button-secondary`}
                incrementButtonClassName={`${styles.quantityBtn} p-button-secondary`}
                incrementButtonIcon="pi pi-plus"
                decrementButtonIcon="pi pi-minus"
                disabled={!selectedSize || getMaxStock() === 0}
                inputClassName={styles.quantityInput}
              />
              {selectedSize && (
                <span className={styles.stockInfo}>
                  Còn {getMaxStock()} sản phẩm
                </span>
              )}
            </div>
          </div>

          {/* Price Summary */}
          {selectedSize && (
            <div className={styles.priceSummary}>
              <div className={styles.priceSummaryRow}>
                <span>Giá:</span>
                <span>{(getSelectedPrice() || 0).toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className={styles.priceSummaryRow}>
                <span>Số lượng:</span>
                <span>{quantity}</span>
              </div>
              <div className={styles.priceSummaryTotal}>
                <span>Tổng:</span>
                <span>{((getSelectedPrice() || 0) * quantity).toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Buttons */}
        <div className={styles.modalFooter}>
          <Button
            label="Huỷ"
            icon="pi pi-times"
            className={`${styles.footerBtn} p-button-text`}
            onClick={onClose}
            disabled={loading}
          />
          <Button
            label={onActionType === 'buy-now' ? 'Mua ngay' : 'Thêm vào giỏ'}
            icon={onActionType === 'buy-now' ? 'pi pi-bolt' : 'pi pi-shopping-cart'}
            className={`${styles.footerBtn} p-button-success`}
            onClick={handleConfirm}
            loading={loading}
            disabled={!selectedSize || loading}
          />
        </div>
      </div>
    </>
  );
}
