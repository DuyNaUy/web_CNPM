'use client';
import React from 'react';
import { DataView } from 'primereact/dataview';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  old_price?: number;
  discount_percentage?: number;
  rating: number;
  reviews_count: number;
  sold_count: number;
  stock: number;
  unit: string;
  main_image_url?: string;
  description?: string;
  category_name?: string;
  in_stock?: boolean;
}

interface ProductDisplayLayoutProps {
  displayType: 'detail' | 'list' | 'comparison' | 'recommendation';
  products: Product[];
  analysis?: string;
  filters?: Record<string, any>;
  loading?: boolean;
  className?: string;
}

export const ProductDisplayLayout: React.FC<ProductDisplayLayoutProps> = ({
  displayType,
  products,
  analysis,
  filters,
  loading = false,
  className = ''
}) => {
  const router = useRouter();

  const handleViewProduct = (slug: string) => {
    router.push(`/customer/products/${slug}`);
  };

  const renderStockTag = (product: Product) => {
    if (product.stock <= 0) {
      return <Tag severity="danger" value="Hết hàng" />;
    } else if (product.stock < 50) {
      return <Tag severity="warning" value={`Còn ${product.stock}`} />;
    }
    return <Tag severity="success" value="Còn hàng" />;
  };

  const renderRating = (rating: number, count: number) => {
    const stars = Math.round(rating);
    return (
      <div className="rating">
        <span className="stars">
          {'⭐'.repeat(Math.min(stars, 5))}
        </span>
        <span className="rating-text">{rating}/5 ({count} đánh giá)</span>
      </div>
    );
  };

  const renderDetailView = () => {
    if (products.length === 0) {
      return (
        <div className="no-products">
          <p>Không tìm thấy sản phẩm phù hợp</p>
        </div>
      );
    }

    const product = products[0]; // Show first product in detail

    return (
      <div className="detail-view">
        <Card className="product-detail-card">
          <div className="detail-content">
            <div className="detail-image">
              {product.main_image_url ? (
                <Image
                  src={product.main_image_url}
                  alt={product.name}
                  width={400}
                  height={400}
                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                />
              ) : (
                <div className="placeholder-image">Không có hình ảnh</div>
              )}
            </div>

            <div className="detail-info">
              <h2 className="product-name">{product.name}</h2>
              
              <div className="category">
                <span className="label">Danh mục:</span>
                <span className="value">{product.category_name}</span>
              </div>

              <div className="rating-section">
                {renderRating(product.rating, product.reviews_count)}
                <p className="sold-info">Đã bán {product.sold_count} chiếc</p>
              </div>

              <div className="price-section">
                <div className="price-display">
                  <span className="current-price">
                    {product.price.toLocaleString('vi-VN')} ₫
                  </span>
                  {product.old_price && (
                    <span className="old-price">
                      {product.old_price.toLocaleString('vi-VN')} ₫
                    </span>
                  )}
                </div>
                {product.discount_percentage && product.discount_percentage > 0 && (
                  <Tag
                    severity="danger"
                    value={`Giảm ${product.discount_percentage}%`}
                    className="discount-tag"
                  />
                )}
              </div>

              <div className="stock-info">
                <label>Tình trạng:</label>
                {renderStockTag(product)}
              </div>

              <div className="description">
                <p>{product.description}</p>
              </div>

              <div className="actions">
                <Button
                  label="Xem chi tiết"
                  icon="pi pi-arrow-right"
                  onClick={() => handleViewProduct(product.slug)}
                  className="p-button-primary"
                />
              </div>

              {analysis && (
                <div className="analysis-box">
                  <h4>AI Analysis:</h4>
                  <p>{analysis}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderListView = () => {
    if (products.length === 0) {
      return (
        <div className="no-products">
          <p>Không tìm thấy sản phẩm phù hợp</p>
        </div>
      );
    }

    return (
      <div className="list-view">
        <div className="list-header">
          <p className="total">Tìm thấy {products.length} sản phẩm</p>
          {analysis && (
            <div className="ai-analysis">
              <span className="label">🤖 AI phân tích:</span>
              <span className="text">{analysis}</span>
            </div>
          )}
        </div>

        <DataView
          value={products}
          layout="grid"
          className="grid-layout"
          itemTemplate={(product) => (
            <div key={product.id} className="product-item">
              <Card className="product-card">
                <div className="product-image-container">
                  {product.main_image_url ? (
                    <Image
                      src={product.main_image_url}
                      alt={product.name}
                      width={200}
                      height={200}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="image-placeholder">Ảnh</div>
                  )}
                  {product.discount_percentage && product.discount_percentage > 0 && (
                    <div className="discount-badge">-{product.discount_percentage}%</div>
                  )}
                </div>

                <h5 className="product-title">{product.name}</h5>

                <div className="product-rating">
                  {'⭐'.repeat(Math.round(product.rating))}
                  <span className="rating-value">({product.rating}/5)</span>
                </div>

                <div className="product-price">
                  <span className="price">{product.price.toLocaleString('vi-VN')} ₫</span>
                  {product.old_price && (
                    <span className="old-price">{product.old_price.toLocaleString('vi-VN')} ₫</span>
                  )}
                </div>

                <div className="product-stock">
                  {renderStockTag(product)}
                </div>

                <Button
                  label="Chi tiết"
                  icon="pi pi-eye"
                  onClick={() => handleViewProduct(product.slug)}
                  className="p-button-sm p-button-text"
                />
              </Card>
            </div>
          )}
        />
      </div>
    );
  };

  const renderComparisonView = () => {
    if (products.length === 0) {
      return (
        <div className="no-products">
          <p>Không tìm thấy sản phẩm để so sánh</p>
        </div>
      );
    }

    return (
      <div className="comparison-view">
        <h3>So sánh sản phẩm</h3>
        {analysis && (
          <div className="analysis-box">
            <p>{analysis}</p>
          </div>
        )}

        <div className="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Đánh giá</th>
                <th>Đã bán</th>
                <th>Tồn kho</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="product-cell">
                    <div className="product-info">
                      {product.main_image_url && (
                        <Image
                          src={product.main_image_url}
                          alt={product.name}
                          width={60}
                          height={60}
                          style={{ objectFit: 'cover', borderRadius: '4px' }}
                        />
                      )}
                      <div>
                        <p className="name">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="price-cell">{product.price.toLocaleString('vi-VN')} ₫</td>
                  <td className="rating-cell">
                    ⭐ {product.rating}/5
                  </td>
                  <td className="sold-cell">{product.sold_count}</td>
                  <td className="stock-cell">{product.stock}</td>
                  <td className="action-cell">
                    <Button
                      icon="pi pi-arrow-right"
                      className="p-button-rounded p-button-text p-button-sm"
                      onClick={() => handleViewProduct(product.slug)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRecommendationView = () => {
    if (products.length === 0) {
      return (
        <div className="no-products">
          <p>Không có sản phẩm được gợi ý</p>
        </div>
      );
    }

    return (
      <div className="recommendation-view">
        <Card className="recommendation-header">
          <div className="header-content">
            <h3>🎁 Gợi ý sản phẩm dành cho bạn</h3>
            {analysis && <p>{analysis}</p>}
          </div>
        </Card>

        <div className="recommendations-grid">
          {products.map((product) => (
            <div key={product.id} className="recommendation-card">
              <Card className="rec-card-inner">
                <div className="rec-image">
                  {product.main_image_url ? (
                    <Image
                      src={product.main_image_url}
                      alt={product.name}
                      width={150}
                      height={150}
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                    />
                  ) : (
                    <div className="image-placeholder">Ảnh</div>
                  )}
                </div>

                <h5>{product.name}</h5>

                <div className="rec-rating">
                  {'⭐'.repeat(Math.round(product.rating))}
                </div>

                <div className="rec-price">
                  {product.price.toLocaleString('vi-VN')} ₫
                </div>

                <div className="rec-stock">
                  {renderStockTag(product)}
                </div>

                <Button
                  label="Xem chi tiết"
                  icon="pi pi-arrow-right"
                  onClick={() => handleViewProduct(product.slug)}
                  className="p-button-sm p-button-primary w-full"
                />
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (displayType) {
      case 'detail':
        return renderDetailView();
      case 'comparison':
        return renderComparisonView();
      case 'recommendation':
        return renderRecommendationView();
      case 'list':
      default:
        return renderListView();
    }
  };

  return (
    <div className={`product-display-layout ${className}`}>
      {loading ? (
        <div className="loading">
          <i className="pi pi-spin pi-spinner"></i>
          <p>Đang tải...</p>
        </div>
      ) : (
        renderContent()
      )}

      <style jsx>{`
        .product-display-layout {
          width: 100%;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          gap: 1rem;
        }

        .loading i {
          font-size: 2rem;
          color: #667eea;
        }

        .no-products {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        /* Detail View */
        .detail-view {
          padding: 1rem 0;
        }

        .product-detail-card {
          background-color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
        }

        .detail-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .detail-image {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          border-radius: 12px;
          padding: 1rem;
          min-height: 400px;
        }

        .placeholder-image {
          color: #999;
          font-size: 1rem;
        }

        .detail-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .product-name {
          font-size: 1.75rem;
          font-weight: 700;
          color: #333;
          margin: 0;
        }

        .category {
          display: flex;
          gap: 0.5rem;
        }

        .category .label {
          font-weight: 600;
          color: #666;
        }

        .category .value {
          color: #667eea;
        }

        .rating-section {
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
          padding: 1rem 0;
        }

        .rating {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .rating .stars {
          font-size: 1.2rem;
        }

        .rating-text {
          color: #666;
          font-size: 0.9rem;
        }

        .sold-info {
          color: #999;
          margin: 0.5rem 0 0 0;
        }

        .price-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 0;
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 8px;
        }

        .price-display {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .current-price {
          font-size: 1.75rem;
          font-weight: 700;
          color: #e74c3c;
        }

        .old-price {
          font-size: 1rem;
          text-decoration: line-through;
          color: #999;
        }

        .stock-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stock-info label {
          font-weight: 600;
        }

        .description {
          line-height: 1.6;
          color: #555;
        }

        .actions {
          display: flex;
          gap: 0.75rem;
        }

        .analysis-box {
          margin-top: 1rem;
          padding: 1rem;
          background: #f0f4ff;
          border-left: 4px solid #667eea;
          border-radius: 4px;
        }

        /* List View */
        .list-view {
          padding: 1rem 0;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .list-header .total {
          font-weight: 600;
          color: #333;
        }

        .ai-analysis {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #666;
          background: #f0f4ff;
          padding: 0.5rem 1rem;
          border-radius: 6px;
        }

        .ai-analysis .label {
          font-weight: 600;
        }

        :global(.grid-layout) {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .product-item {
          height: 100%;
        }

        .product-card {
          height: 100%;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .product-card {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .product-card:hover {
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
          transform: translateY(-4px);
        }

        .product-image-container {
          position: relative;
          width: 100%;
          height: 200px;
          background: #f5f5f5;
          overflow: hidden;
        }

        .product-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          color: #999;
        }

        .discount-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #e74c3c;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .product-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #333;
          margin: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-rating {
          margin: 0 1rem;
          font-size: 0.85rem;
          color: #666;
        }

        .product-price {
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .product-price .price {
          font-weight: 700;
          color: #e74c3c;
          font-size: 1.1rem;
        }

        .product-price .old-price {
          font-size: 0.85rem;
          text-decoration: line-through;
          color: #999;
        }

        .product-stock {
          margin: 0.5rem 1rem;
        }

        /* Comparison View */
        .comparison-view {
          padding: 1rem 0;
        }

        .comparison-view h3 {
          margin-bottom: 1rem;
          color: #333;
        }

        .comparison-table {
          overflow-x: auto;
        }

        .comparison-table table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .comparison-table th {
          background: #f5f5f5;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #e0e0e0;
        }

        .comparison-table td {
          padding: 1rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .product-cell {
          display: flex;
          align-items: center;
        }

        .product-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .product-info .name {
          font-weight: 600;
          margin: 0;
        }

        .price-cell {
          color: #e74c3c;
          font-weight: 600;
        }

        .rating-cell {
          color: #f59e0b;
        }

        .stock-cell {
          color: #10b981;
        }

        /* Recommendation View */
        .recommendation-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          margin-bottom: 2rem;
          border-radius: 12px;
        }

        .header-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .header-content p {
          margin: 0;
          opacity: 0.9;
        }

        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1.5rem;
        }

        .rec-card-inner {
          text-align: center;
          height: 100%;
        }

        .rec-image {
          margin-bottom: 1rem;
        }

        .rec-rating {
          font-size: 1.2rem;
          margin: 0.5rem 0;
        }

        .rec-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #e74c3c;
          margin: 0.5rem 0;
        }

        .rec-stock {
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .detail-content {
            grid-template-columns: 1fr;
          }

          .list-header {
            flex-direction: column;
            align-items: flex-start;
          }

          :global(.grid-layout) {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 0.75rem;
          }

          .comparison-table {
            font-size: 0.85rem;
          }

          .comparison-table td,
          .comparison-table th {
            padding: 0.75rem;
          }

          .recommendations-grid {
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDisplayLayout;
