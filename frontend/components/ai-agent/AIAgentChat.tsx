'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { cartAPI, getStoredUser } from '@/services/api';
import { addItemToLocalCart, getLocalCartTotalQuantity } from '@/services/localCart';
import styles from './AIAgentChat.module.css';

interface Message {
  role: 'user' | 'assistant';
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
  price?: number;
  description?: string;
  quantity?: number;
  unit?: string;
  stock?: number;
  variants?: ProductVariant[];
}

interface FAQItem {
  id: string;
  label: string;
  question: string;
}

const FAQ_QUESTIONS: FAQItem[] = [
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
}

// Product Card Component
function ProductCard({ product, conversationId }: { product: Product; conversationId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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

  // Get available stock based on selected size or product stock
  const getAvailableStock = (): number => {
    if (product.variants && product.variants.length > 0 && selectedSize) {
      const selectedVariant = product.variants.find(v => v.size === selectedSize);
      return selectedVariant?.stock || 0;
    }
    return product.stock || 0;
  };

  // Get price based on selected size or product price
  const getProductPrice = (): number => {
    if (product.variants && product.variants.length > 0 && selectedSize) {
      const selectedVariant = product.variants.find(v => v.size === selectedSize);
      return selectedVariant?.price || product.price || 0;
    }
    return product.price || 0;
  };

  const availableStock = getAvailableStock();
  
  const handleViewMore = async () => {
    console.log('[ProductCard] handleViewMore clicked for product:', product.id);
    try {
      // Navigate to product detail page using ID (like customer product page does)
      router.push(`/customer/products/${product.id}`);
    } catch (error) {
      console.error('Failed to navigate:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể mở chi tiết sản phẩm'
      });
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
          flexWrap: 'wrap',
          '@media (max-width: 600px)': { gap: '15px' }
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
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold',
                  color: '#d63739',
                  letterSpacing: '-0.5px'
                }}>
                  {getProductPrice().toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            {/* Stock Status */}
            <div style={{
              padding: '12px',
              backgroundColor: availableStock > 0 ? '#e6f7ed' : '#faddd1',
              border: `2px solid ${availableStock > 0 ? '#52b788' : '#e76f51'}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: availableStock > 0 ? '#1b5e20' : '#c41c3b'
            }}>
              📦 {availableStock > 0 ? `Còn ${availableStock} sản phẩm` : 'Hết hàng'}
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
                      title={variant.stock === 0 ? 'Hết hàng' : `${variant.size}`}
                    >
                      <div>{variant.size}</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                        {variant.price.toLocaleString('vi-VN')}₫
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
                  onMouseEnter={(e) => !isLoading && quantity > 1 && (e.target.style.backgroundColor = '#ffe5e5')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#fff')}
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
                  onMouseEnter={(e) => !isLoading && quantity < availableStock && (e.target.style.backgroundColor = '#ffe5e5')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#fff')}
                >
                  +
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                Tối đa: {availableStock}
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
                    label="Mua ngay" 
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
        {product.image_url && (
          <div className={styles.productImage}>
            <img src={product.image_url} alt={product.name} />
          </div>
        )}
        <div className={styles.productInfo}>
          <h4 className={styles.productName}>{product.name}</h4>
          {getProductPrice() > 0 && (
            <p className={styles.productPrice}>{getProductPrice().toLocaleString('vi-VN')} đ</p>
          )}
          <p className={styles.productQuantity} style={{color: availableStock > 0 ? '#28a745' : '#dc3545'}}>
            📦 Số lượng còn lại: {availableStock}
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
            disabled={isLoading || availableStock === 0}
            title={availableStock === 0 ? 'Sản phẩm đã hết hàng' : ''}
          >
            Thêm vào giỏ
          </button>
          <button 
            className={styles.btnBuyNow} 
            onClick={openBuyNowModal}
            disabled={isLoading || availableStock === 0}
            title={availableStock === 0 ? 'Sản phẩm đã hết hàng' : ''}
          >
            Mua ngay
          </button>
        </div>
      </div>
    </>
  );
}

export default function AIAgentChat({
  conversationId
}: AIAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Guard: Check if conversationId is valid
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory();
  }, [conversationId]);

  const loadConversationHistory = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${apiUrl}/api/ai/conversations/${conversationId}/get_history/`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${apiUrl}/api/ai/conversations/${conversationId}/send_message/`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: userMessage.content,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('[AIAgentChat] Received response:', data);
        console.log('[AIAgentChat] Products in response:', data.products);

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.ai_response || 'Không có phản hồi',
          timestamp: new Date().toISOString(),
          products: data.products || [],
        };
        
        console.log('[AIAgentChat] Assistant message with products:', assistantMessage);
        setMessages((prev) => [...prev, assistantMessage]);
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFAQClick = (faq: FAQItem) => {
    setInputValue(faq.question);
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
          const token = localStorage.getItem('access_token');
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const headers: any = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const response = await fetch(
            `${apiUrl}/api/ai/conversations/${conversationId}/send_message/`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({
                message: faq.question,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const assistantMessage: Message = {
              role: 'assistant',
              content: data.ai_response || 'Không có phản hồi',
              timestamp: new Date().toISOString(),
              products: data.products || [],
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
        } catch (error) {
          console.error('Failed to send FAQ:', error);
        } finally {
          setIsLoading(false);
        }
      })();
    }, 100);
  };

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerAvatar}>🧸</div>
        <div className={styles.headerInfo}>
          <h2 className={styles.headerTitle}>Trợ lý AI Teddy Shop</h2>
          <p className={styles.headerSubtitle}>Sẵn sàng giúp bạn tìm gấu thú yêu thích</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className={styles.messagesContainer}>
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
                  {msg.content && <p>{msg.content}</p>}
                  
                  {/* Product Display */}
                  {msg.products && msg.products.length > 0 && (
                    <>
                      {console.log('[AIAgentChat] Rendering products:', msg.products)}
                      <div className={styles.productsGrid}>
                        {msg.products.map((product) => (
                          <ProductCard key={product.id} product={product} conversationId={conversationId} />
                        ))}
                      </div>
                    </>
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
