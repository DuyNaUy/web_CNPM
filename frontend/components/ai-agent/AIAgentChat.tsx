'use client';

import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { cartAPI, getStoredUser } from '@/services/api';
import { addItemToLocalCart, getLocalCartTotalQuantity } from '@/services/localCart';
import { LayoutContext } from '@/layout/context/layoutcontext';
import styles from './AIAgentChat.module.css';

interface Message {
  role: 'user' | 'assistant' | 'admin';
  content: string;
  timestamp?: string;
  products?: Product[];
}

interface ProductVariant {
  id?: number;
  size: string;
  price: number;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  image_url?: string;
  main_image_url?: string;
  price?: number;
  description?: string;
  quantity?: number;
  unit?: string;
  stock?: number;
  variants?: ProductVariant[];
  sold_count?: number;
  rating?: number;
  similarity?: number;
  isBestSeller?: boolean;
  price_range?: {
    min: number;
    max: number;
  };
  min_price?: number;
  max_price?: number;
}

interface FAQItem {
  id: string;
  label: string;
  question: string;
}

const FAQ_QUESTIONS: FAQItem[] = [
  {
    id: 'human-support',
    label: '👩‍💼 Liên hệ tư vấn viên',
    question: 'Tôi muốn liên hệ tư vấn viên'
  },
  {
    id: 'purchase',
    label: '🛍️ Mua hàng',
    question: 'Tôi muốn mua sắm'
  },
  {
    id: 'order-status',
    label: '📦 Đơn hàng của tôi',
    question: 'Làm sao để xem trạng thái đơn hàng của tôi?'
  },
  {
    id: 'purchase-history',
    label: '📋 Lịch sử mua hàng',
    question: 'Tôi muốn xem lịch sử mua hàng của tôi'
  },
  {
    id: 'categories',
    label: '📂 Danh mục sản phẩm',
    question: 'Tôi muốn xem thư mục sản phẩm'
  }
];

interface AIAgentChatProps {
  conversationId: string;
  onRecommendationsReceived?: (recommendations: any[]) => void;
  onConversationNotFound?: () => void;
}

interface AIProductContext {
  source?: string;
  product_id?: number;
  product_name?: string;
  category?: string;
  description?: string;
  detail_description?: string;
  selected_size?: string;
  quantity?: number;
  price?: number;
  min_price?: number;
  max_price?: number;
  image?: string | null;
  timestamp?: string;
}

const AI_PRODUCT_CONTEXT_KEY = 'ai_product_context';

// Product Card Component
function ProductCard({ product, conversationId }: { product: Product; conversationId: string }) {
  const router = useRouter();
  const { setCartCount } = useContext(LayoutContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'addToCart' | 'buyNow' | null>(null);
  const toastRef = useRef<Toast>(null);
  
  // Debug logging
  useEffect(() => {
    console.log('[ProductCard] Product data:', {
      id: product.id,
      name: product.name,
      variants: product.variants,
      variantsLength: product.variants?.length || 0,
      stock: product.stock,
      price: product.price
    });
  }, [product]);

  const getProductImage = (targetProduct: Product): string => {
    return targetProduct.image_url || targetProduct.main_image_url || '/demo/images/product/placeholder.png';
  };

  // Get available stock based on selected size or product stock
  const getAvailableStock = (): number => {
    if (product.variants && product.variants.length > 0) {
      if (selectedSize) {
        const selectedVariant = product.variants.find(v => v.size === selectedSize);
        return selectedVariant?.stock || 0;
      }
      // Nếu chưa chọn size, lấy stock tối đa từ tất cả variants
      return Math.max(...product.variants.map(v => v.stock || 0), 0);
    }
    return product.stock || 0;
  };

  // Get total stock from all variants
  const getTotalStock = (targetProduct: Product = product): number => {
    if (targetProduct.variants && targetProduct.variants.length > 0) {
      return targetProduct.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    return targetProduct.stock || 0;
  };

  // Get price based on selected size or product price
  const getProductPrice = (): number => {
    if (product.variants && product.variants.length > 0 && selectedSize) {
      const selectedVariant = product.variants.find(v => v.size === selectedSize);
      return selectedVariant?.price || product.price || 0;
    }
    return product.price || 0;
  };

  // Get price range (min-max) - tối đa 3 giá khác nhau
  const getPriceRange = (targetProduct: Product = product): { min: number; max: number; display: string } => {
    if (targetProduct.variants && targetProduct.variants.length >= 2) {
      const prices = targetProduct.variants
        .filter(v => v.price > 0)
        .map(v => v.price);
      
      if (prices.length > 0) {
        const uniquePrices = Array.from(new Set(prices)).sort((a, b) => a - b);
        const minPrice = Math.min(...uniquePrices);
        const maxPrice = Math.max(...uniquePrices);
        
        // Nếu chỉ có 1 giá duy nhất
        if (minPrice === maxPrice) {
          return {
            min: minPrice,
            max: maxPrice,
            display: new Intl.NumberFormat('vi-VN').format(minPrice)
          };
        }
        
        // Hiển thị min - max
        return {
          min: minPrice,
          max: maxPrice,
          display: `${new Intl.NumberFormat('vi-VN').format(minPrice)} - ${new Intl.NumberFormat('vi-VN').format(maxPrice)}`
        };
      }
    }

    if (typeof targetProduct.min_price === 'number' && typeof targetProduct.max_price === 'number') {
      if (targetProduct.min_price === targetProduct.max_price) {
        return {
          min: targetProduct.min_price,
          max: targetProduct.max_price,
          display: new Intl.NumberFormat('vi-VN').format(targetProduct.min_price)
        };
      }

      return {
        min: targetProduct.min_price,
        max: targetProduct.max_price,
        display: `${new Intl.NumberFormat('vi-VN').format(targetProduct.min_price)} - ${new Intl.NumberFormat('vi-VN').format(targetProduct.max_price)}`
      };
    }
    
    // Fallback: giá mặc định
    const price = targetProduct.price || 0;
    return {
      min: price,
      max: price,
      display: new Intl.NumberFormat('vi-VN').format(price)
    };
  };

  const availableStock = getAvailableStock();
  const totalStock = getTotalStock(product);
  const priceRange = getPriceRange();
  
  const handleViewMore = async () => {
    console.log('[ProductCard] handleViewMore clicked for product:', product.id);
    try {
      setIsLoading(true);
      
      // Gọi API backend để lấy thông tin sản phẩm chi tiết cập nhật
      console.log('[ProductCard] Fetching from API:', `/api/ai/conversations/${conversationId}/get_product_details/?product_id=${product.id}`);
      const response = await fetch(
        `/api/ai/conversations/${conversationId}/get_product_details/?product_id=${product.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const detailedProduct = data.product;
        
        console.log('[ProductCard] Received product details from API:', detailedProduct);
        console.log('[ProductCard] Product images:', detailedProduct.product_images);
        console.log('[ProductCard] Main image URL:', detailedProduct.main_image_url);
        console.log('[ProductCard] Variants:', detailedProduct.variants);
        console.log('[ProductCard] Stock info - stock:', detailedProduct.stock, 'in_stock:', detailedProduct.in_stock);
        
        const normalizedProduct: Product = {
          ...product,
          ...detailedProduct,
          image_url: detailedProduct?.main_image_url || detailedProduct?.image_url || product.image_url || product.main_image_url,
          main_image_url: detailedProduct?.main_image_url || detailedProduct?.image_url || product.main_image_url || product.image_url,
        };

        setDetailProduct(normalizedProduct);
        setIsDetailModalOpen(true);
      } else {
        console.error('[ProductCard] Failed to fetch product details:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[ProductCard] Error response:', errorText);

        setDetailProduct(product);
        setIsDetailModalOpen(true);
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Không tải được dữ liệu mới, hiển thị thông tin hiện có'
        });
      }
    } catch (error) {
      console.error('[ProductCard] Error in handleViewMore:', error);
      setDetailProduct(product);
      setIsDetailModalOpen(true);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải chi tiết mới, hiển thị dữ liệu hiện có'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openAddToCartModal = () => {
    console.log('[ProductCard] openAddToCartModal for product:', product.id);
    console.log('[ProductCard] Product variants:', {
      variants: product.variants,
      variantsLength: product.variants?.length || 0,
      unit: product.unit,
      price: product.price,
      stock: product.stock
    });
    setSelectedSize('');
    setQuantity(1);
    setModalAction('addToCart');
    setIsModalOpen(true);
  };

  const openBuyNowModal = () => {
    console.log('[ProductCard] openBuyNowModal for product:', product.id);
    console.log('[ProductCard] Product variants:', {
      variants: product.variants,
      variantsLength: product.variants?.length || 0,
      unit: product.unit,
      price: product.price,
      stock: product.stock
    });
    setSelectedSize('');
    setQuantity(1);
    setModalAction('buyNow');
    setIsModalOpen(true);
  };

  const confirmAddToCart = async () => {
    console.log('[ProductCard] confirmAddToCart clicked for product:', product.id);
    
    // Validate size selection if variants exist
    if (product.variants && product.variants.length > 0) {
      if (!selectedSize) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Vui lòng chọn kích thước sản phẩm',
          life: 3000
        });
        return;
      }
      
      // Check stock for selected variant
      const selectedVariant = product.variants.find(v => v.size === selectedSize);
      if (!selectedVariant || selectedVariant.stock <= 0) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Kích thước này đã hết hàng',
          life: 3000
        });
        return;
      }
    }

    // Check stock if no variants
    if ((!product.variants || product.variants.length === 0) && availableStock <= 0) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Sản phẩm đã hết hàng',
        life: 3000
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = getStoredUser();
      const itemPrice = getProductPrice();
      
      // Determine the unit/size to send
      let sizeStr = '';
      if (product.variants && product.variants.length > 0) {
        sizeStr = selectedSize;
      } else if (product.unit) {
        sizeStr = product.unit;
      }

      if (user) {
        // User đã đăng nhập - call API backend
        try {
          const response = await cartAPI.addItem(product.id, quantity, sizeStr);
          
          console.log('[ProductCard] Add to cart response:', response);
          
          // Check if response has error field
          if (response?.error) {
            toastRef.current?.show({
              severity: 'error',
              summary: 'Lỗi',
              detail: response.error
            });
            return;
          }
          
          // Check if response has cart data (success)
          if (response && response.id) {
            // Update cart count in top bar
            if (response.total_quantity) {
              setCartCount(response.total_quantity);
            }
            toastRef.current?.show({
              severity: 'success',
              summary: 'Đã thêm vào giỏ',
              detail: `Đã thêm ${quantity} ${product.name} (${sizeStr}) vào giỏ hàng`,
              life: 3000
            });
            setIsModalOpen(false);
          } else {
            toastRef.current?.show({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Phản hồi từ server không hợp lệ'
            });
          }
        } catch (apiError: any) {
          console.error('[ProductCard] API Error:', apiError);
          toastRef.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: apiError.message || 'Không thể thêm vào giỏ hàng'
          });
        }
      } else {
        // User chưa đăng nhập - lưu vào localStorage
        addItemToLocalCart(
          product.id,
          product.name,
          itemPrice,
          quantity,
          sizeStr,
          product.image_url || ''
        );
        
        // Update cart count from localStorage
        const newTotal = getLocalCartTotalQuantity();
        setCartCount(newTotal);
        
        toastRef.current?.show({
          severity: 'success',
          summary: 'Đã thêm vào giỏ',
          detail: `Đã thêm ${quantity} ${product.name} (${sizeStr}) vào giỏ hàng`
        });
        setIsModalOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: error.message || 'Không thể thêm vào giỏ hàng'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmBuyNow = async () => {
    console.log('[ProductCard] confirmBuyNow clicked for product:', product.id);
    try {
      const user = getStoredUser();
      
      // Kiểm tra đăng nhập
      if (!user) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Vui lòng đăng nhập để mua hàng'
        });
        setIsModalOpen(false);
        setTimeout(() => {
          router.push('/auth/login');
        }, 1000);
        return;
      }

      // Validate size selection if variants exist
      if (product.variants && product.variants.length > 0) {
        if (!selectedSize) {
          toastRef.current?.show({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Vui lòng chọn kích thước sản phẩm',
            life: 3000
          });
          return;
        }
        
        // Check stock for selected variant
        const selectedVariant = product.variants.find(v => v.size === selectedSize);
        if (!selectedVariant || selectedVariant.stock <= 0) {
          toastRef.current?.show({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: `Chỉ còn ${selectedVariant?.stock || 0} sản phẩm trong kho`,
            life: 3000
          });
          return;
        }
      }

      // Check stock if no variants
      if ((!product.variants || product.variants.length === 0) && availableStock <= 0) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Sản phẩm đã hết hàng',
          life: 3000
        });
        return;
      }

      // Determine the unit/size to send
      let sizeStr = '';
      if (product.variants && product.variants.length > 0) {
        sizeStr = selectedSize;
      } else if (product.unit) {
        sizeStr = product.unit;
      }
      const itemPrice = getProductPrice();
      
      // Tạo item object giống như customer product page
      const item = {
        id: product.id,
        name: product.name,
        price: itemPrice,
        quantity: quantity,
        unit: sizeStr,
        size: sizeStr,
        image: product.image_url
      };
      
      console.log('[ProductCard] Buy Now - Item:', item);
      
      // Lưu vào sessionStorage
      sessionStorage.setItem('buyNowItem', JSON.stringify(item));
      
      // Close modal and redirect tới checkout
      setIsModalOpen(false);
      router.push('/customer/checkout');
    } catch (error: any) {
      console.error('Failed to buy now:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: error.message || 'Không thể mua hàng'
      });
    }
  };

  return (
    <>
      <Toast ref={toastRef} position="bottom-right" />

      {/* Product Detail Modal */}
      <Dialog
        visible={isDetailModalOpen}
        onHide={() => setIsDetailModalOpen(false)}
        modal
        style={{ width: '90vw', maxWidth: '820px' }}
        header={detailProduct?.name || 'Chi tiết sản phẩm'}
      >
        {detailProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <img
                src={getProductImage(detailProduct)}
                alt={detailProduct.name}
                style={{
                  width: '220px',
                  height: '220px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  border: '1px solid #f0f0f0',
                }}
              />

              <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '14px', color: '#666' }}>Giá: <strong style={{ color: '#d63739' }}>{getPriceRange(detailProduct).display} ₫</strong></div>
                <div style={{ fontSize: '14px', color: getTotalStock(detailProduct) > 0 ? '#2d8a43' : '#c41c3b', fontWeight: 600 }}>
                  Tồn kho tổng: {getTotalStock(detailProduct)}
                </div>
                {detailProduct.description && (
                  <p style={{ margin: 0, color: '#444', lineHeight: 1.6 }}>{detailProduct.description}</p>
                )}
              </div>
            </div>

            {detailProduct.variants && detailProduct.variants.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <strong style={{ fontSize: '14px' }}>Bảng size có sẵn</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {detailProduct.variants.map((variant) => (
                    <span
                      key={`detail-${detailProduct.id}-${variant.size}`}
                      style={{
                        fontSize: '12px',
                        borderRadius: '999px',
                        border: '1px solid #e6e6e6',
                        padding: '6px 10px',
                        background: '#fafafa',
                      }}
                    >
                      Size {variant.size}: {variant.price.toLocaleString('vi-VN')} ₫ | {variant.stock} cái
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                label="Thêm vào giỏ"
                icon="pi pi-shopping-cart"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openAddToCartModal();
                }}
                disabled={getTotalStock(detailProduct) === 0 || isLoading}
                style={{ backgroundColor: '#2ecc71', borderColor: '#27ae60' }}
              />
              <Button
                label="Mua ngay"
                icon="pi pi-shopping-bag"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openBuyNowModal();
                }}
                disabled={getTotalStock(detailProduct) === 0 || isLoading}
                style={{ backgroundColor: '#d63739', borderColor: '#b71c1c' }}
              />
            </div>
          </div>
        )}
      </Dialog>
      
      {/* Product Modal Dialog - Redesigned 2-Column Layout */}
      <Dialog 
        visible={isModalOpen} 
        onHide={() => setIsModalOpen(false)}
        modal
        style={{ width: '90vw', maxWidth: '750px' }}
        className="p-fluid"
        header={null}
      >
        <div style={{ 
          display: 'flex', 
          gap: '30px',
          flexWrap: 'wrap'
        }}>
          {/* LEFT COLUMN: Product Image */}
          {product.image_url && (
            <div style={{ 
              flex: '0 0 45%', 
              minWidth: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={product.image_url} 
                alt={product.name}
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  maxHeight: '400px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            </div>
          )}

          {/* RIGHT COLUMN: Product Details */}
          <div style={{ 
            flex: '1', 
            minWidth: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Product Name & Price */}
            <div>
              <h2 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '24px',
                color: '#1a1a1a',
                fontWeight: '700'
              }}>
                {product.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                {/* Hiển thị giá - nếu còn chọn size thì hiển thị theo selection, nếu chưa chọn thì hiển thị min-max */}
                {selectedSize && product.variants && product.variants.length > 0 ? (
                  <span style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold',
                    color: '#d63739',
                    letterSpacing: '-0.5px'
                  }}>
                    {getProductPrice().toLocaleString('vi-VN')}₫
                  </span>
                ) : (
                  <span style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold',
                    color: '#d63739',
                    letterSpacing: '-0.5px'
                  }}>
                    {priceRange.display}₫
                  </span>
                )}
                
                {/* Hiển thị giá cũ nếu có (optional) */}
                {product.variants && product.variants.length > 0 && selectedSize && (
                  <span style={{
                    fontSize: '14px',
                    color: '#999',
                    textDecoration: 'line-through'
                  }}>
                    (Chọn size: {selectedSize})
                  </span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div style={{
              padding: '12px',
              backgroundColor: totalStock > 0 ? '#e6f7ed' : '#faddd1',
              border: `2px solid ${totalStock > 0 ? '#52b788' : '#e76f51'}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: totalStock > 0 ? '#1b5e20' : '#c41c3b'
            }}>
              📦 {totalStock > 0 ? `Tồn kho: ${totalStock} sản phẩm` : 'Hết hàng'}
              {product.variants && product.variants.length > 0 && selectedSize && (
                <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.8 }}>
                  (Size {selectedSize}: {availableStock} cái)
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p style={{ 
                margin: '0',
                color: '#555',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                {product.description}
              </p>
            )}

            {/* Size Selection - Button Style */}
            {product.variants && product.variants.length > 0 ? (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  fontWeight: '700',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}>
                  Kích thước <span style={{ color: '#d63739' }}>*</span>
                </label>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '8px'
                }}>
                  {product.variants.map((variant) => (
                    <button
                      key={variant.size}
                      onClick={() => variant.stock > 0 && setSelectedSize(variant.size)}
                      disabled={variant.stock === 0 || isLoading}
                      style={{
                        padding: '12px 16px',
                        border: selectedSize === variant.size ? '2px solid #d63739' : '2px solid #ddd',
                        borderRadius: '8px',
                        backgroundColor: selectedSize === variant.size ? '#ffe5e5' : '#fff',
                        cursor: variant.stock === 0 ? 'not-allowed' : 'pointer',
                        opacity: variant.stock === 0 ? 0.5 : 1,
                        transition: 'all 0.25s ease',
                        fontWeight: '600',
                        fontSize: '14px',
                        color: selectedSize === variant.size ? '#d63739' : '#333',
                        boxShadow: selectedSize === variant.size ? '0 2px 8px rgba(214,55,57,0.15)' : 'none'
                      }}
                      title={variant.stock === 0 ? 'Hết hàng' : `Size ${variant.size} - ${variant.stock} cái`}
                    >
                      <div>{variant.size}</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                        {variant.price.toLocaleString('vi-VN')}₫ 
                        <div style={{ fontSize: '11px', marginTop: '2px', color: variant.stock > 0 ? '#2ecc71' : '#e74c3c' }}>
                          ({variant.stock > 0 ? `${variant.stock} cái` : 'Hết'})
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : product.unit ? (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '700',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}>
                  Kích thước
                </label>
                <div style={{ 
                  padding: '12px 16px',
                  backgroundColor: '#f5f5f5',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#555',
                  fontWeight: '600'
                }}>
                  {product.unit}
                </div>
              </div>
            ) : null}

            {/* Quantity Selection with +/- buttons */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '700',
                fontSize: '14px',
                color: '#1a1a1a'
              }}>
                Số lượng
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                border: '2px solid #ddd',
                width: 'fit-content'
              }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isLoading || quantity <= 1}
                  style={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRight: '1px solid #ddd',
                    padding: '10px 14px',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: quantity <= 1 ? '#ccc' : '#d63739',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && quantity > 1) {
                      e.currentTarget.style.backgroundColor = '#ffe5e5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }}
                >
                  −
                </button>
                
                <input
                  type="text"
                  value={quantity}
                  disabled
                  style={{
                    backgroundColor: '#f5f5f5',
                    border: 'none',
                    textAlign: 'center',
                    width: '50px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#333',
                    cursor: 'default'
                  }}
                />
                
                <button
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  disabled={isLoading || quantity >= availableStock}
                  style={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderLeft: '1px solid #ddd',
                    padding: '10px 14px',
                    cursor: quantity >= availableStock ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: quantity >= availableStock ? '#ccc' : '#d63739',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && quantity < availableStock) {
                      e.currentTarget.style.backgroundColor = '#ffe5e5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }}
                >
                  +
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                Tối đa: {availableStock} {selectedSize ? `(${selectedSize})` : '(tổng cộng)'}
              </p>
            </div>

            {/* Total Price Highlight */}
            <div style={{
              backgroundColor: '#fff8e1',
              padding: '16px',
              borderRadius: '10px',
              border: '2px solid #ffc107',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ 
                fontWeight: '700',
                fontSize: '14px',
                color: '#666'
              }}>
                Tổng cộng:
              </span>
              <span style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#d63739'
              }}>
                {(getProductPrice() * quantity).toLocaleString('vi-VN')}₫
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              marginTop: '8px'
            }}>
              {modalAction === 'addToCart' ? (
                <>
                  <Button 
                    label="Thêm vào giỏ" 
                    icon="pi pi-shopping-cart"
                    onClick={confirmAddToCart}
                    loading={isLoading}
                    disabled={isLoading || availableStock === 0 || (product.variants && product.variants.length > 0 && !selectedSize)}
                    style={{ 
                      flex: 1, 
                      backgroundColor: '#2ecc71',
                      borderColor: '#27ae60'
                    }}
                  />
                  <Button 
                    label="Hủy" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={isLoading}
                    severity="secondary"
                    outlined
                    style={{ flex: '0 0 100px' }}
                  />
                </>
              ) : (
                <>
                  <Button 
                    label="Thanh toán" 
                    icon="pi pi-shopping-bag"
                    onClick={confirmBuyNow}
                    loading={isLoading}
                    disabled={isLoading || availableStock === 0 || (product.variants && product.variants.length > 0 && !selectedSize)}
                    style={{ 
                      flex: 1, 
                      backgroundColor: '#d63739',
                      borderColor: '#b71c1c'
                    }}
                  />
                  <Button 
                    label="Hủy" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={isLoading}
                    severity="secondary"
                    outlined
                    style={{ flex: '0 0 100px' }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Product Card */}
      <div className={styles.productCard}>
        {/* Best Seller Badge */}
        {product.isBestSeller && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '10px',
            backgroundColor: '#ff6b35',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            ⭐ Bán chạy
          </div>
        )}
        
        <div className={styles.productImage}>
          <img src={getProductImage(product)} alt={product.name} />
        </div>
        <div className={styles.productInfo}>
          <h4 className={styles.productName}>{product.name}</h4>
          
          <p className={styles.productPrice}>Giá: {priceRange.display} ₫</p>
          
          {/* Price Range Display - fallback */}
          {product.price_range && product.variants && product.variants.length < 2 && (
            <p style={{
              fontSize: '12px',
              color: '#ff6b35',
              margin: '4px 0 8px 0',
              fontWeight: '600'
            }}>
              💰 {product.price_range.min.toLocaleString('vi-VN')} - {product.price_range.max.toLocaleString('vi-VN')} ₫
            </p>
          )}
          
          {/* Stock Display - hiển thị tổng stock từ tất cả variants */}
          <p className={styles.productQuantity} style={{color: totalStock > 0 ? '#28a745' : '#dc3545'}}>
            📦 Tồn kho: {totalStock > 0 ? totalStock : 'Hết hàng'}
          </p>
          
          {product.description && (
            <p className={styles.productDescription}>{product.description}</p>
          )}
        </div>
        <div className={styles.productButtons}>
          <button 
            className={styles.btnViewMore} 
            onClick={handleViewMore}
            disabled={isLoading}
          >
            Xem thêm
          </button>
          <button 
            className={styles.btnAddCart} 
            onClick={openAddToCartModal}
            disabled={isLoading || totalStock === 0}
            title={totalStock === 0 ? 'Sản phẩm đã hết hàng' : ''}
          >
            Thêm vào giỏ
          </button>
          <button 
            className={styles.btnBuyNow} 
            onClick={openBuyNowModal}
            disabled={isLoading || totalStock === 0}
            title={totalStock === 0 ? 'Sản phẩm đã hết hàng' : ''}
          >
            Mua ngay
          </button>
        </div>
      </div>
    </>
  );
}

export default function AIAgentChat({
  conversationId,
  onConversationNotFound,
}: AIAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiPaused, setAiPaused] = useState(false);
  const [pendingProductContext, setPendingProductContext] = useState<AIProductContext | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const disableAiAuthRef = useRef(false);
  const hasLoadedProductContextRef = useRef(false);
  const hasHandledConversationNotFoundRef = useRef(false);
  const router = useRouter();

  const fetchAiEndpoint = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    const token = localStorage.getItem('access_token');
    const requestHeaders: any = {
      ...((init?.headers as any) || {}),
    };

    if (token && !disableAiAuthRef.current && !requestHeaders.Authorization) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...init,
      headers: requestHeaders,
    });

    if (response.status === 401 && token && !disableAiAuthRef.current) {
      console.warn('[AIAgentChat] AI endpoint got 401, disable auth and retry without token...');
      disableAiAuthRef.current = true;

      const retryHeaders: any = {
        ...requestHeaders,
      };
      delete retryHeaders.Authorization;

      response = await fetch(url, {
        ...init,
        headers: retryHeaders,
      });
    }

    return response;
  }, []);

  const handleConversationNotFound = useCallback(() => {
    if (hasHandledConversationNotFoundRef.current) return;
    hasHandledConversationNotFoundRef.current = true;
    setIsLoading(false);
    onConversationNotFound?.();
  }, [onConversationNotFound]);

  // Helper function to sort and filter products by relevance and sales
  const sortProductsByRelevance = (products: Product[]): Product[] => {
    if (!products || products.length === 0) return [];
    
    // Calculate relevance score for each product (similarity + sales boost)
    const productsWithScore = products.map((p: any) => ({
      ...p,
      relevanceScore: (p.similarity || 0.5) + ((p.sold_count || 0) / 100) * 0.3,
      isBestSeller: (p.sold_count || 0) > 5
    }));
    
    // Sort by relevance score (descending)
    const sorted = productsWithScore.sort((a: any, b: any) => 
      (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );
    
    // Return top 5 products (minimum 3 if available)
    return sorted.slice(0, 5);
  };

  const normalizeProductsPayload = (rawProducts: any[]): Product[] => {
    if (!Array.isArray(rawProducts)) return [];

    return rawProducts
      .map((item: any, index: number): Product | null => {
        const source = item?.product && typeof item.product === 'object' ? item.product : item;
        if (!source || typeof source !== 'object') return null;

        const rawId = source.id ?? source.product_id;
        const normalizedId = Number(rawId);
        const rawPrice = source.price ?? source.min_price ?? source?.price_range?.min ?? 0;
        const normalizedPrice = Number(rawPrice) || 0;

        const product: Product = {
          id: Number.isFinite(normalizedId) && normalizedId > 0 ? normalizedId : Date.now() + index,
          name: String(source.name || source.product_name || source.title || `Sản phẩm #${index + 1}`),
          image_url: source.image_url || source.image || source.main_image_url,
          main_image_url: source.main_image_url || source.image_url || source.image,
          price: normalizedPrice,
          description: source.description || source.detail_description,
          stock: Number(source.stock ?? source.total_stock ?? 0) || 0,
          variants: Array.isArray(source.variants) ? source.variants : [],
          sold_count: Number(source.sold_count ?? 0) || 0,
          rating: Number(source.rating ?? 0) || 0,
          similarity: Number(source.similarity ?? 0) || 0,
          quantity: Number(source.quantity ?? 1) || 1,
          unit: source.unit,
          price_range: source.price_range,
          min_price: Number(source.min_price ?? source?.price_range?.min ?? normalizedPrice) || normalizedPrice,
          max_price: Number(source.max_price ?? source?.price_range?.max ?? normalizedPrice) || normalizedPrice,
        };

        return product;
      })
      .filter((p): p is Product => Boolean(p));
  };

  const isUserNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceToBottom <= 120;
  }, []);

  const handleMessagesScroll = () => {
    shouldAutoScrollRef.current = isUserNearBottom();
  };

  const buildProductContextPrompt = (ctx: AIProductContext): string => {
    const name = ctx.product_name || 'sản phẩm này';
    const category = ctx.category || 'không rõ danh mục';
    const size = ctx.selected_size || 'chưa chọn';
    const quantity = ctx.quantity || 1;
    const priceText = typeof ctx.price === 'number'
      ? `${ctx.price.toLocaleString('vi-VN')} VND`
      : 'chưa có giá cụ thể';
    const desc = ctx.description || '';

    return `Tôi vừa xem sản phẩm "${name}" (danh mục: ${category}, size: ${size}, số lượng: ${quantity}, giá: ${priceText}). Hãy tư vấn giúp tôi sản phẩm này có phù hợp không, ưu/nhược điểm chính, và gợi ý thêm 2-3 lựa chọn tương tự cùng tầm giá. Mô tả ngắn hiện có: ${desc}`;
  };

  const buildProductCardPayload = (ctx: AIProductContext): Product => {
    const minPrice = typeof ctx.min_price === 'number' ? ctx.min_price : (typeof ctx.price === 'number' ? ctx.price : 0);
    const maxPrice = typeof ctx.max_price === 'number' ? ctx.max_price : (typeof ctx.price === 'number' ? ctx.price : minPrice);

    return {
      id: ctx.product_id || Date.now(),
      name: ctx.product_name || 'Sản phẩm đã chọn',
      image_url: ctx.image || '/demo/images/product/placeholder.png',
      price: typeof ctx.price === 'number' ? ctx.price : minPrice,
      min_price: minPrice,
      max_price: maxPrice,
      price_range: {
        min: minPrice,
        max: maxPrice,
      },
      unit: ctx.selected_size,
    };
  };

  const getPendingContextPriceLabel = (ctx: AIProductContext): string => {
    if (typeof ctx.min_price === 'number' && typeof ctx.max_price === 'number') {
      if (ctx.min_price === ctx.max_price) {
        return `${ctx.min_price.toLocaleString('vi-VN')} VND`;
      }
      return `${ctx.min_price.toLocaleString('vi-VN')} - ${ctx.max_price.toLocaleString('vi-VN')} VND`;
    }

    if (typeof ctx.price === 'number') {
      return `${ctx.price.toLocaleString('vi-VN')} VND`;
    }

    return 'Đang cập nhật giá';
  };

  const sendTextMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !conversationId) return;

    shouldAutoScrollRef.current = true;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetchAiEndpoint(
        `${apiUrl}/api/ai/conversations/${conversationId}/send_message/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.ai_paused) {
          setAiPaused(true);
          if (data.message) {
            const noticeMessage: Message = {
              role: 'assistant',
              content: data.message,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, noticeMessage]);
          }
          return;
        }

        setAiPaused(false);
        if (data.ai_response) {
          const assistantMessage: Message = {
            role: 'assistant',
            content: data.ai_response,
            timestamp: new Date().toISOString(),
            products: data.products || [],
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } else if (response.status === 404) {
        handleConversationNotFound();
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, fetchAiEndpoint]);

  // Chỉ auto-scroll khi có tin nhắn mới và user đang ở gần cuối danh sách.
  useEffect(() => {
    const hasNewMessage = messages.length > previousMessageCountRef.current;
    if (hasNewMessage && shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    previousMessageCountRef.current = messages.length;
  }, [messages.length]);

  const loadConversationHistory = useCallback(async () => {
    if (!conversationId) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetchAiEndpoint(
        `${apiUrl}/api/ai/conversations/${conversationId}/get_history/`,
        {}
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setAiPaused(Boolean(data.human_support_active));
      } else if (response.status === 404) {
        handleConversationNotFound();
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  }, [conversationId, fetchAiEndpoint, handleConversationNotFound]);

  // Load conversation history on mount
  useEffect(() => {
    void loadConversationHistory();
  }, [loadConversationHistory]);

  // Poll history to receive admin replies in near real time.
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(() => {
      void loadConversationHistory();
    }, 4000);

    return () => clearInterval(interval);
  }, [conversationId, loadConversationHistory]);

  // Nếu user đi từ trang chi tiết sản phẩm sang, tự gửi 1 câu hỏi có ngữ cảnh sản phẩm.
  useEffect(() => {
    if (!conversationId || hasLoadedProductContextRef.current) return;

    const raw = sessionStorage.getItem(AI_PRODUCT_CONTEXT_KEY);
    if (!raw) return;

    hasLoadedProductContextRef.current = true;

    try {
      const contextData: AIProductContext = JSON.parse(raw);
      setPendingProductContext(contextData);
    } catch (error) {
      console.error('Failed to parse AI product context:', error);
      sessionStorage.removeItem(AI_PRODUCT_CONTEXT_KEY);
    }
  }, [conversationId]);

  const sendPendingProductContext = async () => {
    if (!pendingProductContext || isLoading) return;

    const prompt = buildProductContextPrompt(pendingProductContext);
    if (!prompt.trim()) return;

    shouldAutoScrollRef.current = true;

    const cardPayload = buildProductCardPayload(pendingProductContext);
    const userCardMessage: Message = {
      role: 'user',
      content: '',
      timestamp: new Date().toISOString(),
      products: [cardPayload],
    };

    setMessages((prev) => [...prev, userCardMessage]);
    setPendingProductContext(null);
    sessionStorage.removeItem(AI_PRODUCT_CONTEXT_KEY);

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetchAiEndpoint(
        `${apiUrl}/api/ai/conversations/${conversationId}/send_message/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: prompt,
            user_products: [cardPayload],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.ai_paused) {
          setAiPaused(true);
          if (data.message) {
            const noticeMessage: Message = {
              role: 'assistant',
              content: data.message,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, noticeMessage]);
          }
          return;
        }

        setAiPaused(false);
        if (data.ai_response) {
          const assistantMessage: Message = {
            role: 'assistant',
            content: data.ai_response,
            timestamp: new Date().toISOString(),
            products: data.products || [],
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to send product context message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !conversationId) return;
    await sendTextMessage(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFAQClick = (faq: FAQItem) => {
    if (!conversationId) return;

    shouldAutoScrollRef.current = true;

    if (faq.id === 'human-support') {
      setInputValue('');
      setIsLoading(true);

      (async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await fetchAiEndpoint(
            `${apiUrl}/api/ai/conversations/${conversationId}/request_human_support/`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setAiPaused(Boolean(data.ai_paused ?? data.human_support_active));
            await loadConversationHistory();
          } else {
            // Fallback: gửi tin nhắn thường để backend tự nhận diện yêu cầu tư vấn viên.
            const fallbackResponse = await fetchAiEndpoint(
              `${apiUrl}/api/ai/conversations/${conversationId}/send_message/`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: faq.question }),
              }
            );

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              setAiPaused(Boolean(fallbackData.ai_paused));
              await loadConversationHistory();
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: 'Không thể gửi yêu cầu liên hệ tư vấn viên lúc này. Vui lòng thử lại sau.',
                  timestamp: new Date().toISOString(),
                },
              ]);
            }
          }
        } catch (error) {
          console.error('Failed to request human support:', error);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'Kết nối đang gặp sự cố, chưa gửi được yêu cầu tư vấn viên.',
              timestamp: new Date().toISOString(),
            },
          ]);
        } finally {
          setIsLoading(false);
        }
      })();

      return;
    }

    setInputValue('');
    setTimeout(() => {
      const userMessage: Message = {
        role: 'user',
        content: faq.question,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      (async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await fetchAiEndpoint(
            `${apiUrl}/api/ai/conversations/${conversationId}/send_message/`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: faq.question,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.ai_paused) {
              setAiPaused(true);
              if (data.message) {
                const noticeMessage: Message = {
                  role: 'assistant',
                  content: data.message,
                  timestamp: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, noticeMessage]);
              }
            } else {
              setAiPaused(false);
              if (data.ai_response) {
                const assistantMessage: Message = {
                  role: 'assistant',
                  content: data.ai_response,
                  timestamp: new Date().toISOString(),
                  products: data.products || [],
                };
                setMessages((prev) => [...prev, assistantMessage]);
              }
            }
          }
        } catch (error) {
          console.error('Failed to send FAQ:', error);
        } finally {
          setIsLoading(false);
        }
      })();
    }, 100);
  };

  const handleCustomerResumeAI = async () => {
    if (!conversationId || !aiPaused) return;

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetchAiEndpoint(
        `${apiUrl}/api/ai/conversations/${conversationId}/customer_resume_ai/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setAiPaused(false);
        await loadConversationHistory();
      } else {
        // Fallback: gửi intent, backend sẽ tự chuyển về AI mode.
        const fallbackResponse = await fetchAiEndpoint(
          `${apiUrl}/api/ai/conversations/${conversationId}/send_message/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Chat với AI' }),
          }
        );

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setAiPaused(Boolean(fallbackData.ai_paused));
          await loadConversationHistory();
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'Không thể chuyển sang chế độ Chat với AI lúc này. Vui lòng thử lại.',
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to switch back to AI mode:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Đã xảy ra lỗi kết nối khi chuyển về Chat với AI.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSenderName = (role: Message['role']) => {
    if (role === 'user') return 'Tôi';
    if (role === 'admin') return 'Admin tư vấn';
    return 'AI tư vấn';
  };

  const formatMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!conversationId) {
    console.warn('[AIAgentChat] conversationId is null/undefined');
    return (
      <div className={styles.chatContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🧸</div>
          <p className={styles.emptyText}>Đang khởi tạo cuộc trò chuyện...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerAvatar}>🧸</div>
        <div className={styles.headerInfo}>
          <h2 className={styles.headerTitle}>Trợ lý AI Teddy Shop</h2>
          <p className={styles.headerSubtitle}>
            {aiPaused ? 'Đang chờ tư vấn viên phản hồi trực tiếp' : 'Sẵn sàng giúp bạn tìm gấu thú yêu thích'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className={styles.messagesContainer}
        onScroll={handleMessagesScroll}
      >
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🧸</div>
            <p className={styles.emptyText}>Bắt đầu cuộc trò chuyện với AI trợ lý</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
                <div className={styles.messageBubble}>
                  <div className={styles.messageHeader}>
                    <span className={`${styles.senderTag} ${styles[`${msg.role}Tag`]}`}>
                      {getSenderName(msg.role)}
                    </span>
                    {msg.timestamp && (
                      <span className={styles.messageTimestamp}>{formatMessageTime(msg.timestamp)}</span>
                    )}
                  </div>

                  {msg.content && !(msg.role === 'user' && msg.products && msg.products.length > 0) && (
                    <p className={styles.messageText}>{msg.content}</p>
                  )}
                  
                  {/* Product Display */}
                  {msg.products && msg.products.length > 0 && (
                    msg.role === 'user' ? (
                      <div className={styles.sentProductGrid}>
                        {normalizeProductsPayload(msg.products).map((product) => {
                          const minPrice = typeof product.min_price === 'number'
                            ? product.min_price
                            : (product.price_range?.min || product.price || 0);
                          const maxPrice = typeof product.max_price === 'number'
                            ? product.max_price
                            : (product.price_range?.max || product.price || minPrice);
                          const priceText = minPrice === maxPrice
                            ? `${minPrice.toLocaleString('vi-VN')} VND`
                            : `${minPrice.toLocaleString('vi-VN')} - ${maxPrice.toLocaleString('vi-VN')} VND`;

                          return (
                            <div key={`${product.id}-${priceText}`} className={styles.sentProductCard}>
                              <img
                                src={product.image_url || '/demo/images/product/placeholder.png'}
                                alt={product.name}
                                className={styles.sentProductImage}
                              />
                              <div className={styles.sentProductInfo}>
                                <p className={styles.sentProductName}>{product.name}</p>
                                <p className={styles.sentProductPrice}>{priceText}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={styles.productsGrid}>
                        {sortProductsByRelevance(normalizeProductsPayload(msg.products)).map((product) => (
                          <ProductCard key={product.id} product={product} conversationId={conversationId} />
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.assistant}`}>
                <div className={styles.messageBubble}>
                  <div className={styles.loadingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* FAQ Questions */}
      {aiPaused && (
        <div className={styles.humanSupportNotice}>
          <span>AI đã tạm dừng. Bạn vẫn có thể nhắn tin và tư vấn viên sẽ trả lời trực tiếp.</span>
          <button
            type="button"
            className={styles.resumeAiButton}
            onClick={handleCustomerResumeAI}
            disabled={isLoading}
          >
            Chat với AI
          </button>
        </div>
      )}

      <div className={styles.faqSection}>
        <p className={styles.faqLabel}>Câu hỏi thường gặp:</p>
        <div className={styles.faqButtons}>
          {FAQ_QUESTIONS.map((faq) => (
            <button
              key={faq.id}
              className={styles.faqButton}
              onClick={() => handleFAQClick(faq)}
              disabled={isLoading}
            >
              {faq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className={styles.inputContainer}>
        {pendingProductContext && (
          <div className={styles.pendingProductBar}>
            <div className={styles.pendingProductLeft}>
              <img
                src={pendingProductContext.image || '/demo/images/product/placeholder.png'}
                alt={pendingProductContext.product_name || 'Sản phẩm'}
                className={styles.pendingProductImage}
              />
              <div className={styles.pendingProductMeta}>
                <p className={styles.pendingProductName}>{pendingProductContext.product_name || 'Sản phẩm đã chọn'}</p>
                <p className={styles.pendingProductPrice}>{getPendingContextPriceLabel(pendingProductContext)}</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.pendingSendButton}
              onClick={sendPendingProductContext}
              disabled={isLoading}
            >
              Gửi
            </button>
          </div>
        )}
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập câu hỏi của bạn..."
          className={styles.textInput}
          rows={3}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !inputValue.trim()}
          className={styles.sendButton}
        >
          {isLoading ? '⏳' : '📤'} Gửi
        </button>
      </div>
    </div>
  );
}
