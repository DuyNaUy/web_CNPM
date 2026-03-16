'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toast } from 'primereact/toast';
import { cartAPI, getStoredUser } from '@/services/api';
import { addItemToLocalCart, getLocalCartTotalQuantity } from '@/services/localCart';
import styles from './AIAgentChat.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  products?: Product[];
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
  const toastRef = useRef<Toast>(null);
  
  console.log('[ProductCard] Rendering product:', product);
  
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

  const handleAddToCart = async () => {
    console.log('[ProductCard] handleAddToCart clicked for product:', product.id);
    setIsLoading(true);
    try {
      const user = getStoredUser();
      const sizeStr = product.unit || 'default';
      const quantity = 1;

      if (user) {
        // User đã đăng nhập - call API backend
        const response = await cartAPI.addItem(product.id, quantity, sizeStr);
        
        console.log('[ProductCard] Add to cart response:', response);
        
        if (response && response.id) {
          toastRef.current?.show({
            severity: 'success',
            summary: 'Đã thêm vào giỏ',
            detail: `Đã thêm ${quantity} ${product.name} vào giỏ hàng`,
            life: 3000
          });
        } else if (response && response.error) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: response.error || 'Không thể thêm vào giỏ hàng'
          });
        }
      } else {
        // User chưa đăng nhập - lưu vào localStorage
        addItemToLocalCart(
          product.id,
          product.name,
          product.price || 0,
          quantity,
          sizeStr,
          product.image_url || ''
        );
        
        toastRef.current?.show({
          severity: 'success',
          summary: 'Đã thêm vào giỏ',
          detail: `Đã thêm ${quantity} ${product.name} vào giỏ hàng`
        });
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

  const handleBuyNow = async () => {
    console.log('[ProductCard] handleBuyNow clicked for product:', product.id);
    try {
      const user = getStoredUser();
      
      // Kiểm tra đăng nhập
      if (!user) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Vui lòng đăng nhập để mua hàng'
        });
        setTimeout(() => {
          router.push('/auth/login');
        }, 1000);
        return;
      }

      // Kiểm tra số lượng >= 1
      const quantity = 1;
      if (quantity < 1) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Vui lòng nhập số lượng >= 1'
        });
        return;
      }

      // Kiểm tra stock
      if (product.stock !== undefined && quantity > product.stock) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: `Chỉ còn ${product.stock} sản phẩm trong kho`
        });
        return;
      }

      // Tạo item object giống như customer product page
      const size = product.unit || '30cm';
      const item = {
        id: product.id,
        name: product.name,
        price: product.price || 0,
        quantity: quantity,
        unit: size,
        size: size,
        image: product.image_url
      };
      
      console.log('[ProductCard] Buy Now - Item:', item);
      
      // Lưu vào sessionStorage
      sessionStorage.setItem('buyNowItem', JSON.stringify(item));
      
      // Redirect tới checkout
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
      <div className={styles.productCard}>
        {product.image_url && (
          <div className={styles.productImage}>
            <img src={product.image_url} alt={product.name} />
          </div>
        )}
        <div className={styles.productInfo}>
          <h4 className={styles.productName}>{product.name}</h4>
          {product.price && (
            <p className={styles.productPrice}>{product.price.toLocaleString('vi-VN')} đ</p>
          )}
          {product.quantity && product.quantity > 0 && (
            <p className={styles.productQuantity}>📦 Số lượng: {product.quantity}</p>
          )}
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
            onClick={handleAddToCart}
            disabled={isLoading || (product.stock === 0)}
          >
            Thêm vào giỏ
          </button>
          <button 
            className={styles.btnBuyNow} 
            onClick={handleBuyNow}
            disabled={isLoading || (product.stock === 0)}
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
