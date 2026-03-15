'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  id: number;
  name: string;
  slug: string;
  price: number;
  old_price?: number;
  main_image_url?: string;
  rating: number;
  reviews_count: number;
  sold_count: number;
  stock: number;
  specifications?: string;
  onAddToCart?: (productId: number) => void;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  slug,
  price,
  old_price,
  main_image_url,
  rating,
  reviews_count,
  sold_count,
  stock,
  specifications,
  onAddToCart,
  compact = false,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const toastRef = React.useRef<Toast>(null);

  // Parse specifications để lấy size
  const getSize = () => {
    try {
      if (specifications) {
        const specs = JSON.parse(specifications);
        return specs.size || specs.kích_thước || 'N/A';
      }
    } catch (e) {
      return 'N/A';
    }
  };

  const handleViewDetails = () => {
    router.push(`/customer/products/${slug}`);
  };

  const handleBuyNow = () => {
    if (onAddToCart) {
      onAddToCart(id);
    }
    router.push('/customer/cart');
  };

  const handleAddToCart = () => {
    setIsLoading(true);
    if (onAddToCart) {
      onAddToCart(id);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: `"${name}" đã được thêm vào giỏ hàng`,
        life: 2000,
      });
    }
    setIsLoading(false);
  };

  const discount = old_price
    ? Math.round(((old_price - price) / old_price) * 100)
    : 0;

  const stockStatus = stock > 0 ? 'Còn hàng' : 'Hết hàng';
  const stockSeverity = stock > 0 ? 'success' : 'danger';

  // Compact mode - horizontal layout
  if (compact) {
    return (
      <>
        <Toast ref={toastRef} position="bottom-right" />
        <div className={`${styles.productCard} ${styles.compact}`}>
          {/* Image - Small */}
          <div className={styles.compactImageContainer}>
            <Image
              src={main_image_url || '/placeholder.png'}
              alt={name}
              width={120}
              height={120}
              className={styles.compactImage}
              priority
            />
            {discount > 0 && (
              <div className={styles.compactDiscountBadge}>-{discount}%</div>
            )}
          </div>

          {/* Content - Compact */}
          <div className={styles.compactContent}>
            <h4 className={styles.compactProductName}>{name}</h4>
            
            <div className={styles.compactPrice}>
              <span className={styles.compactCurrentPrice}>
                {price.toLocaleString('vi-VN')} ₫
              </span>
            </div>

            <div className={styles.compactButtons}>
              <Button
                label="Xem"
                icon="pi pi-eye"
                className="p-button-text p-button-xs"
                onClick={() => window.location.href = `/customer/products/${slug}`}
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              />
              <Button
                label="Mua"
                icon="pi pi-shopping-bag"
                severity="danger"
                className="p-button-xs"
                onClick={() => window.location.href = `/customer/checkout`}
                disabled={stock === 0}
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              />
              <Button
                icon="pi pi-shopping-cart"
                className="p-button-xs"
                onClick={handleAddToCart}
                loading={isLoading}
                disabled={stock === 0}
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toast ref={toastRef} position="bottom-right" />
      <div className={styles.productCard}>
        {/* Image Container */}
        <div className={styles.imageContainer}>
          <div className={styles.imageWrapper}>
            <Image
              src={main_image_url || '/placeholder.png'}
              alt={name}
              fill
              className={styles.productImage}
              priority
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>

          {/* Discount Badge */}
          {discount > 0 && (
            <div className={styles.discountBadge}>
              -{discount}%
            </div>
          )}

          {/* Stock Status Badge */}
          <div className={styles.stockBadge}>
            <Tag
              value={stockStatus}
              severity={stockSeverity}
              style={{ fontSize: '0.75rem' }}
            />
          </div>
        </div>

        {/* Content Container */}
        <div className={styles.content}>
          {/* Product Name */}
          <h3 className={styles.productName}>{name}</h3>

          {/* Price Section */}
          <div className={styles.priceSection}>
            <span className={styles.currentPrice}>
              {price.toLocaleString('vi-VN')} ₫
            </span>
            {old_price && (
              <span className={styles.oldPrice}>
                {old_price.toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>

          {/* Size Information */}
          <div className={styles.sizeInfo}>
            <span className={styles.label}>Kích thước:</span>
            <span className={styles.value}>{getSize()}</span>
          </div>

          {/* Rating & Sold */}
          <div className={styles.statsRow}>
            <div className={styles.ratingSection}>
              <span className={styles.stars}>
                {'⭐'.repeat(Math.min(Math.round(rating), 5))}
              </span>
              <span className={styles.ratingText}>
                {rating}/5 ({reviews_count} đánh giá)
              </span>
            </div>
            <div className={styles.soldSection}>
              Đã bán: {sold_count}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.buttonsContainer}>
            <Button
              label="Xem thêm"
              icon="pi pi-eye"
              className="p-button-text p-button-sm"
              onClick={handleViewDetails}
              style={{ width: '100%', color: '#666' }}
            />
          </div>

          <div className={styles.primaryButtonsContainer}>
            <Button
              label="Mua ngay"
              icon="pi pi-shopping-bag"
              severity="danger"
              className="p-button-sm"
              onClick={handleBuyNow}
              disabled={stock === 0}
              style={{ flex: 1 }}
            />
            <Button
              label="Thêm giỏ"
              icon="pi pi-shopping-cart"
              className="p-button-sm"
              onClick={handleAddToCart}
              loading={isLoading}
              disabled={stock === 0}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
