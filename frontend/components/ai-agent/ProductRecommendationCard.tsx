'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Toast } from 'primereact/toast';
import styles from './ProductRecommendationCard.module.css';

interface Recommendation {
  product_id: number;
  product_name: string;
  reason: string;
  confidence_score: number;
  quantity: number;
  price?: number;
  image_url?: string;
  size?: string;
  category?: string;
  old_price?: number;
  stock?: number;
  slug?: string;
}

interface ProductRecommendationCardProps {
  recommendation: Recommendation;
  onAddToCart?: (product: Recommendation) => void;
  onBuyNow?: (product: Recommendation) => void;
  onViewMore?: (productId: number) => void;
  hideText?: boolean; // When true, only show product UI without reason
  compact?: boolean; // When true, show horizontal compact layout for chat
}

export default function ProductRecommendationCard({
  recommendation,
  onAddToCart,
  onBuyNow,
  onViewMore,
  hideText = false,
  compact = false
}: ProductRecommendationCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toastRef = useRef<Toast>(null);

  const handleViewMore = () => {
    if (onViewMore) {
      onViewMore(recommendation.product_id);
    } else {
      const slug = recommendation.slug || recommendation.product_id;
      router.push(`/customer/products/${slug}`);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    
    try {
      if (onAddToCart) {
        await onAddToCart(recommendation);
      }
      toastRef.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: `"${recommendation.product_name}" đã được thêm vào giỏ hàng`,
        life: 2000,
      });
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể thêm vào giỏ hàng',
        life: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuyNow) {
      onBuyNow(recommendation);
    } else {
      const slug = recommendation.slug || recommendation.product_id;
      router.push(`/customer/products/${slug}`);
    }
  };

  const discount = (recommendation.old_price && recommendation.price)
    ? Math.round(((recommendation.old_price - recommendation.price) / recommendation.old_price) * 100)
    : 0;

  // Compact horizontal mode - for chat display
  if (compact) {
    return (
      <>
        <Toast ref={toastRef} position="bottom-right" />
        <div 
          className={`${styles.card} ${styles.compact}`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Small Image */}
          <div className={styles.imageContainer}>
            {recommendation.image_url ? (
              <Image
                src={recommendation.image_url}
                alt={recommendation.product_name}
                fill
                style={{ objectFit: 'cover' }}
                className={styles.productImage}
                priority
              />
            ) : (
              <div className={styles.placeholderImage}>
                <span>📷</span>
              </div>
            )}
            
            {discount > 0 && (
              <div className={styles.discountBadge}>
                -{discount}%
              </div>
            )}
          </div>

          {/* Right Content */}
          <div className={styles.productInfo}>
            {/* Name and Price on same line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3 className={styles.productName}>{recommendation.product_name}</h3>
              <span className={styles.price}>
                {(recommendation.price || 0).toLocaleString('vi-VN')} ₫
              </span>
            </div>

            {/* Compact Buttons */}
            <div className={styles.buttonsContainer}>
              <button
                className={`${styles.button} ${styles.viewMoreBtn}`}
                onClick={handleViewMore}
                title="Xem chi tiết sản phẩm"
                disabled={isLoading}
              >
                <span className={styles.btnText}>Xem chi tiết</span>
              </button>

              <button
                className={`${styles.button} ${styles.addToCartBtn}`}
                onClick={handleAddToCart}
                title="Thêm vào giỏ hàng"
                disabled={isLoading}
              >
                <span className={styles.btnText}>Thêm giỏ</span>
              </button>

              <button
                className={`${styles.button} ${styles.buyNowBtn}`}
                onClick={handleBuyNow}
                title="Mua ngay"
                disabled={isLoading}
              >
                <span className={styles.btnText}>Mua ngay</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // UI-only mode - minimal text, focus on product display and buttons
  if (hideText) {
    return (
      <>
        <Toast ref={toastRef} position="bottom-right" />
        <div 
          className={`${styles.card} ${styles.uiOnly}`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Image Container */}
          <div className={styles.imageContainer}>
            {recommendation.image_url ? (
              <Image
                src={recommendation.image_url}
                alt={recommendation.product_name}
                fill
                style={{ objectFit: 'cover' }}
                className={styles.productImage}
                priority
              />
            ) : (
              <div className={styles.placeholderImage}>
                <span>📷</span>
              </div>
            )}
            
            {/* Discount Badge */}
            {discount > 0 && (
              <div className={styles.discountBadge}>
                -{discount}%
              </div>
            )}
          </div>

          {/* Product Info - Minimal */}
          <div className={styles.productInfo}>
            {/* Name only */}
            <h3 className={styles.productName}>
              {recommendation.product_name}
            </h3>

            {/* Price only */}
            <div className={styles.priceSection}>
              <span className={styles.price}>
                {(recommendation.price || 0).toLocaleString('vi-VN')} ₫
              </span>
              {recommendation.old_price && (
                <span className={styles.oldPrice}>
                  {recommendation.old_price.toLocaleString('vi-VN')} ₫
                </span>
              )}
            </div>

            {/* Action Buttons - Full Width */}
            <div className={styles.buttonsContainer}>
              <button
                className={`${styles.button} ${styles.viewMoreBtn}`}
                onClick={handleViewMore}
                title="Xem chi tiết sản phẩm"
                disabled={isLoading}
              >
                <span className={styles.btnIcon}>👁️</span>
                <span className={styles.btnText}>Xem chi tiết</span>
              </button>

              <button
                className={`${styles.button} ${styles.addToCartBtn}`}
                onClick={handleAddToCart}
                title="Thêm vào giỏ hàng"
                disabled={isLoading || recommendation.stock === 0}
              >
                <span className={styles.btnIcon}>🛒</span>
                <span className={styles.btnText}>Thêm giỏ</span>
              </button>

              <button
                className={`${styles.button} ${styles.buyNowBtn}`}
                onClick={handleBuyNow}
                title="Mua ngay"
                disabled={isLoading || recommendation.stock === 0}
              >
                <span className={styles.btnIcon}>⚡</span>
                <span className={styles.btnText}>Mua ngay</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Original mode with reason text
  return (
    <>
      <Toast ref={toastRef} position="bottom-right" />
      <div 
        className={styles.card}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Image Container */}
        <div className={styles.imageContainer}>
          {recommendation.image_url ? (
            <Image
              src={recommendation.image_url}
              alt={recommendation.product_name}
              fill
              style={{ objectFit: 'cover' }}
              className={styles.productImage}
            />
          ) : (
            <div className={styles.placeholderImage}>
              <span>📷</span>
            </div>
          )}
          
          {/* Confidence Badge */}
          <div className={styles.confidenceBadge}>
            ⭐ {(recommendation.confidence_score * 100).toFixed(0)}%
          </div>
        </div>

        {/* Product Info */}
        <div className={styles.productInfo}>
          <h3 className={styles.productName}>
            {recommendation.product_name}
          </h3>

          {/* Reason/Description */}
          {recommendation.reason && (
            <p className={styles.reason}>
              {recommendation.reason}
            </p>
          )}

          {/* Price */}
          <div className={styles.priceSection}>
            <span className={styles.price}>
              {(recommendation.price || 0).toLocaleString('vi-VN')} ₫
            </span>
            {recommendation.quantity > 1 && (
              <span className={styles.quantity}>
                x{recommendation.quantity}
              </span>
            )}
          </div>

          {/* Size Info */}
          {recommendation.size && (
            <div className={styles.sizeInfo}>
              <span className={styles.sizeLabel}>Size:</span>
              <span className={styles.sizeValue}>{recommendation.size}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.buttonsContainer}>
            <button
              className={`${styles.button} ${styles.viewMoreBtn}`}
              onClick={handleViewMore}
              title="Xem thêm chi tiết"
            >
              <span className={styles.btnText}>Xem thêm</span>
              <span className={styles.btnIcon}>→</span>
            </button>

            <button
              className={`${styles.button} ${styles.addToCartBtn}`}
              onClick={handleAddToCart}
              title="Thêm vào giỏ hàng"
              disabled={isLoading}
            >
              <span className={styles.btnText}>Giỏ hàng</span>
              <span className={styles.btnIcon}>🛒</span>
            </button>

            <button
              className={`${styles.button} ${styles.buyNowBtn}`}
              onClick={handleBuyNow}
              title="Mua ngay"
              disabled={isLoading}
            >
              <span className={styles.btnText}>Mua ngay</span>
              <span className={styles.btnIcon}>✓</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
