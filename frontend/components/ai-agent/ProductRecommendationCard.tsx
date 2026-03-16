'use client';

import React, { useState, useRef } from 'react';
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
  rating?: number;
  reviews_count?: number;
  sold_count?: number;
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
  const [isImageHovering, setIsImageHovering] = useState(false);
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

  const isOutOfStock = recommendation.stock === 0;
  
  // Render star rating
  const renderStars = (rating?: number) => {
    if (!rating) return '★★★★☆';
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalf && fullStars < 5) stars += '✦';
    if (stars.length < 5) stars += '☆'.repeat(5 - stars.length);
    return stars;
  };

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
          <div className={styles.compactImageContainer} onMouseEnter={() => setIsImageHovering(true)} onMouseLeave={() => setIsImageHovering(false)}>
            {recommendation.image_url ? (
              <Image
                src={recommendation.image_url}
                alt={recommendation.product_name}
                fill
                style={{ objectFit: 'cover' }}
                className={styles.compactProductImage}
                priority
              />
            ) : (
              <div className={styles.compactPlaceholderImage}>
                <span>📷</span>
              </div>
            )}
            
            {discount > 0 && (
              <div className={styles.compactDiscountBadge}>
                -{discount}%
              </div>
            )}
            
            {isOutOfStock && (
              <div className={styles.compactOutOfStockOverlay}>Hết hàng</div>
            )}
          </div>

          {/* Right Content */}
          <div className={styles.compactProductInfo}>
            {/* Name */}
            <h3 className={styles.compactProductName}>{recommendation.product_name}</h3>

            {/* Rating and Sold */}
            {(recommendation.rating || recommendation.sold_count) && (
              <div className={styles.compactStats}>
                {recommendation.rating && (
                  <span className={styles.compactRating}>
                    <span className={styles.compactStars}>{renderStars(recommendation.rating)}</span>
                    {recommendation.reviews_count && <span className={styles.compactReviews}>({recommendation.reviews_count})</span>}
                  </span>
                )}
                {recommendation.sold_count && (
                  <span className={styles.compactSold}>Bán {recommendation.sold_count}</span>
                )}
              </div>
            )}

            {/* Price and Quantity */}
            <div className={styles.compactPrice}>
              <div className={styles.compactPriceRow}>
                <span className={styles.compactCurrentPrice}>
                  {(recommendation.price || 0).toLocaleString('vi-VN')} ₫
                </span>
                {recommendation.old_price && (
                  <span className={styles.compactOldPrice}>
                    {recommendation.old_price.toLocaleString('vi-VN')} ₫
                  </span>
                )}
              </div>
              {recommendation.quantity > 0 && (
                <div className={styles.compactQuantityBadge}>
                  <span>📦</span>
                  <span>SL: {recommendation.quantity}</span>
                </div>
              )}
            </div>

            {/* Compact Buttons */}
            <div className={styles.compactButtons}>
              <button
                className={`${styles.compactBtn} ${styles.compactViewBtn}`}
                onClick={handleViewMore}
                title="Xem chi tiết sản phẩm"
                disabled={isLoading}
              >
                Chi tiết
              </button>

              <button
                className={`${styles.compactBtn} ${styles.compactCartBtn}`}
                onClick={handleAddToCart}
                title="Thêm vào giỏ hàng"
                disabled={isLoading || isOutOfStock}
              >
                Giỏ hàng
              </button>

              <button
                className={`${styles.compactBtn} ${styles.compactBuyBtn}`}
                onClick={handleBuyNow}
                title="Mua ngay"
                disabled={isLoading || isOutOfStock}
              >
                Mua ngay
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
          <div className={styles.imageContainer} onMouseEnter={() => setIsImageHovering(true)} onMouseLeave={() => setIsImageHovering(false)}>
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
                <div className={styles.discountValue}>-{discount}%</div>
              </div>
            )}
            
            {/* Stock Status */}
            {isOutOfStock && (
              <div className={styles.outOfStockOverlay}>Hết hàng</div>
            )}
          </div>

          {/* Product Info - Minimal */}
          <div className={styles.productInfo}>
            {/* Name only */}
            <h3 className={styles.productName}>
              {recommendation.product_name}
            </h3>

            {/* Rating and Social Proof */}
            {(recommendation.rating || recommendation.sold_count) && (
              <div className={styles.trustIndicators}>
                {recommendation.rating && (
                  <span className={styles.ratingBadge}>
                    <span className={styles.ratingStar}>★</span>
                    {recommendation.rating}
                    {recommendation.reviews_count && <span className={styles.reviewCount}>({recommendation.reviews_count})</span>}
                  </span>
                )}
                {recommendation.sold_count && (
                  <span className={styles.soldBadge}>
                    🔥 Đã bán {recommendation.sold_count}
                  </span>
                )}
              </div>
            )}

            {/* Price and Quantity */}
            <div className={styles.priceSection}>
              <div className={styles.priceRow}>
                <span className={styles.price}>
                  {(recommendation.price || 0).toLocaleString('vi-VN')} ₫
                </span>
                {recommendation.old_price && (
                  <span className={styles.oldPrice}>
                    {recommendation.old_price.toLocaleString('vi-VN')} ₫
                  </span>
                )}
              </div>
              {recommendation.quantity > 0 && (
                <div className={styles.quantityBadge}>
                  <span className={styles.quantityIcon}>📦</span>
                  <span className={styles.quantityText}>Số lượng: {recommendation.quantity}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
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
                disabled={isLoading || isOutOfStock}
              >
                <span className={styles.btnIcon}>🛒</span>
                <span className={styles.btnText}>Giỏ hàng</span>
              </button>

              <button
                className={`${styles.button} ${styles.buyNowBtn}`}
                onClick={handleBuyNow}
                title="Mua ngay"
                disabled={isLoading || isOutOfStock}
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

  // Original mode with reason text - Modern design
  return (
    <>
      <Toast ref={toastRef} position="bottom-right" />
      <div 
        className={`${styles.card} ${isHovering ? styles.hovered : ''}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Image Container with Badges */}
        <div className={styles.imageContainer} onMouseEnter={() => setIsImageHovering(true)} onMouseLeave={() => setIsImageHovering(false)}>
          {recommendation.image_url ? (
            <Image
              src={recommendation.image_url}
              alt={recommendation.product_name}
              fill
              style={{ objectFit: 'cover' }}
              className={`${styles.productImage} ${isImageHovering ? styles.imageZoomed : ''}`}
            />
          ) : (
            <div className={styles.placeholderImage}>
              <span>📷</span>
            </div>
          )}
          
          {/* Top Left - Discount Badge */}
          {discount > 0 && (
            <div className={styles.discountBadge}>
              <div className={styles.discountValue}>-{discount}%</div>
            </div>
          )}
          
          {/* Top Right - AI Badge */}
          <div className={styles.aiBadge} title={`AI khuyến nghị ${(recommendation.confidence_score * 100).toFixed(0)}%`}>
            <span className={styles.aiBadgeIcon}>🤖</span>
            <span className={styles.aiBadgeText}>{(recommendation.confidence_score * 100).toFixed(0)}%</span>
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className={styles.outOfStockOverlay}>
              <div>HẾT HÀNG</div>
            </div>
          )}
          
          {/* Hover Overlay with Quick Actions */}
          <div className={styles.hoverOverlay}>
            <button className={styles.quickViewBtn} onClick={handleViewMore} title="Xem chi tiết">
              👁️ Xem chi tiết
            </button>
          </div>
        </div>

        {/* Product Info Section */}
        <div className={styles.productInfo}>
          {/* Product Name */}
          <h3 className={styles.productName}>
            {recommendation.product_name}
          </h3>

          {/* Recommendation Reason */}
          {recommendation.reason && (
            <div className={styles.reasonTag}>
              💡 {recommendation.reason}
            </div>
          )}

          {/* Trust Indicators - Rating, Sold Count */}
          {(recommendation.rating || recommendation.sold_count) && (
            <div className={styles.trustIndicators}>
              {recommendation.rating && (
                <span className={styles.ratingBadge}>
                  <span className={styles.ratingStar}>★</span>
                  {recommendation.rating}
                  {recommendation.reviews_count && <span className={styles.reviewCount}>({recommendation.reviews_count})</span>}
                </span>
              )}
              {recommendation.sold_count && (
                <span className={styles.soldBadge}>
                  <span className={styles.fireIcon}>🔥</span>
                  Đã bán {recommendation.sold_count}
                </span>
              )}
            </div>
          )}

          {/* Price and Quantity Section */}
          <div className={styles.priceSection}>
            <div className={styles.priceRow}>
              <span className={styles.price}>
                {(recommendation.price || 0).toLocaleString('vi-VN')} ₫
              </span>
              {recommendation.old_price && (
                <span className={styles.oldPrice}>
                  {recommendation.old_price.toLocaleString('vi-VN')} ₫
                </span>
              )}
            </div>
            {recommendation.quantity > 0 && (
              <div className={styles.quantityBadge}>
                <span className={styles.quantityIcon}>📦</span>
                <span className={styles.quantityText}>Số lượng: {recommendation.quantity}</span>
              </div>
            )}
          </div>

          {/* Size Info */}
          {recommendation.size && (
            <div className={styles.sizeInfo}>
              <span className={styles.sizeLabel}>📏 Size:</span>
              <span className={styles.sizeValue}>{recommendation.size}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.buttonsContainer}>
            <button
              className={`${styles.button} ${styles.viewMoreBtn}`}
              onClick={handleViewMore}
              title="Xem thêm chi tiết"
              disabled={isLoading}
            >
              <span className={styles.btnIcon}>👁️</span>
              <span className={styles.btnText}>Xem chi tiết</span>
              <span className={styles.btnArrow}>→</span>
            </button>

            <button
              className={`${styles.button} ${styles.addToCartBtn}`}
              onClick={handleAddToCart}
              title="Thêm vào giỏ hàng"
              disabled={isLoading || isOutOfStock}
            >
              <span className={styles.btnIcon}>🛒</span>
              <span className={styles.btnText}>Giỏ hàng</span>
            </button>

            <button
              className={`${styles.button} ${styles.buyNowBtn}`}
              onClick={handleBuyNow}
              title="Mua ngay"
              disabled={isLoading || isOutOfStock}
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
