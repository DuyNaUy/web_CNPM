'use client';

import React from 'react';
import ProductRecommendationCard from './ProductRecommendationCard';
import styles from './ProductRecommendationsGrid.module.css';

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

interface ProductRecommendationsGridProps {
  recommendations: Recommendation[];
  onAddToCart?: (product: Recommendation) => void;
  onBuyNow?: (product: Recommendation) => void;
  onViewMore?: (productId: number) => void;
  title?: string;
  showTitle?: boolean;
  hideText?: boolean; // When true, show UI-only mode
  compact?: boolean; // When true, show horizontal compact cards
}

export default function ProductRecommendationsGrid({
  recommendations,
  onAddToCart,
  onBuyNow,
  onViewMore,
  title = '📦 Sản phẩm được đề xuất',
  showTitle = true,
  hideText = false,
  compact = false
}: ProductRecommendationsGridProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.container} ${compact ? styles.compactContainer : ''}`}>
      {showTitle && (
        <div className={styles.title}>
          {title}
        </div>
      )}
      
      <div className={`${styles.grid} ${compact ? styles.compactGrid : ''}`}>
        {recommendations.map((recommendation) => (
          <ProductRecommendationCard
            key={recommendation.product_id}
            recommendation={recommendation}
            onAddToCart={onAddToCart}
            onBuyNow={onBuyNow}
            onViewMore={onViewMore}
            hideText={hideText}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
