'use client';

import React, { useState, useEffect, useRef } from 'react';
import AddressFormChat from './AddressFormChat';
import styles from './AIAgentChat.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Recommendation {
  product_id: number;
  product_name: string;
  reason: string;
  confidence_score: number;
  quantity: number;
  price?: number;
  image_url?: string;
}

interface AIAgentChatProps {
  conversationId: string;
  onRecommendationsReceived?: (recommendations: Recommendation[]) => void;
  onOrderCreationStart?: (recommendations: Recommendation[], total: number) => void;
}

export default function AIAgentChat({
  conversationId,
  onRecommendationsReceived,
  onOrderCreationStart
}: AIAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [cart, setCart] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef<number>(0);
  const shouldScrollRef = useRef<boolean>(false);

  const scrollToBottom = () => {
    if (shouldScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      shouldScrollRef.current = false;
    }
  };

  useEffect(() => {
    // Only scroll if new messages were added
    if (messages.length > previousMessageCountRef.current) {
      scrollToBottom();
    }
    previousMessageCountRef.current = messages.length;
  }, [messages]);

  // Load conversation history
  useEffect(() => {
    loadConversationHistory();
  }, [conversationId]);

  // Auto-load new messages every 2 seconds for real-time updates
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadConversationHistory();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
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
        {
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        // normalize any recommendations from history to our expected shape
        if (data.recommendations) {
          const recs = data.recommendations.map((rec: any) => {
            const productObj = rec.product || {};
            const imageUrl = rec.image_url || productObj.main_image_url || '';
            const priceVal = rec.price || productObj.price || 0;
            const nameVal = rec.product_name || productObj.name || rec.product__name || 'Sản phẩm';
            let finalImage = imageUrl;
            if (finalImage && !finalImage.startsWith('http')) {
              const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
              finalImage = base.replace(/\/$/, '') + finalImage;
            }
            return {
              product_id: rec.product_id || rec.product?.id || rec.id,
              product_name: nameVal,
              reason: rec.reason || '',
              confidence_score: rec.confidence_score || rec.confidence || 0.8,
              quantity: rec.quantity || 1,
              price: priceVal,
              image_url: finalImage,
            };
          });
          setRecommendations(recs);
        } else {
          setRecommendations([]);
        }
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

    shouldScrollRef.current = true; // Enable scroll when user sends message
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
        // prepare assistant message and inject recommendations text inline
        let assistantContent: string = data.ai_response;

        let recs: Recommendation[] = [];
        // if backend handled a special command, it may still send back recommendations
        if (data.recommendations && data.recommendations.length > 0) {
          recs = data.recommendations.map((rec: any) => {
            const productObj = rec.product || {};
            const imageUrl = rec.image_url || productObj.main_image_url || '';
            const priceVal = rec.price || productObj.price || 0;
            const nameVal = rec.product_name || productObj.name || rec.product__name || 'Sản phẩm';
            let finalImage = imageUrl;
            if (finalImage && !finalImage.startsWith('http')) {
              const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
              finalImage = base.replace(/\/$/, '') + finalImage;
            }
            return {
              product_id: rec.product_id || rec.id || productObj.id,
              product_name: nameVal,
              reason: rec.reason || '',
              confidence_score: rec.confidence_score || rec.confidence || 0.8,
              quantity: rec.quantity || 1,
              price: priceVal,
              image_url: finalImage,
            };
          });

          // append formatted recommendation block to assistantContent
          assistantContent += "\n\n📦 **Sản phẩm được đề xuất:**\n";
          recs.forEach((rec, idx) => {
            assistantContent += `\n${idx + 1}. **${rec.product_name}**\n`;
            assistantContent += `   💰 Giá: ${(rec.price || 0).toLocaleString()} ₫\n`;
            if (rec.image_url) {
              assistantContent += `   ![image](${rec.image_url})\n`;
            }
            assistantContent += `   ${rec.reason}\n`;
          });

          setRecommendations(recs);
          const total = recs.reduce((s, r) => s + ((r.price || 0) * r.quantity), 0);
          setEstimatedTotal(total);
          onRecommendationsReceived?.(recs);
        }

        // update cart state if provided
        if (data.cart) {
          setCart(data.cart);
          const cartSubtotal = data.cart.reduce((s: number, i: any) => s + (i.price * (i.quantity || 1)), 0);
          setEstimatedTotal(cartSubtotal > 0 ? cartSubtotal + 30000 : 0);
        }

        // trigger address form by backend flag instead of string matching
        if (data.should_create_order) {
          setTimeout(() => {
            setShowAddressForm(true);
            onOrderCreationStart?.(recs, data.cart ? data.cart.reduce((s: number, i: any) => s + (i.price || 0), 0) : estimatedTotal);
          }, 500);
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date().toISOString(),
        };

        shouldScrollRef.current = true; // Enable scroll when AI responds
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
      };
      shouldScrollRef.current = true; // Enable scroll for error message
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

  // helper to convert simple markdown images & line breaks to HTML
  const renderContentHtml = (text: string) => {
    // escape any < or > to avoid injection (minimal)
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // convert markdown image syntax to img tag
    html = html.replace(/!\[.*?\]\((.*?)\)/g, (_, url) => {
      let finalUrl = url;
      if (finalUrl && !finalUrl.startsWith('http')) {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        finalUrl = base.replace(/\/$/, '') + finalUrl;
      }
      // use CSS class to render small thumbnail at left
      return `<img src="${finalUrl}" class="${styles.msgImage}" />`;
    });
    // convert newlines to <br>
    html = html.replace(/\r?\n/g, '<br/>');
    return { __html: html };
  };

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerAvatar}>🧸</div>
        <div className={styles.headerInfo}>
          <h2 className={styles.headerTitle}>Teddy AI Assistant</h2>
          <div className={styles.headerStatus}>
            <span className={styles.statusDot}></span>
            Online
          </div>
        </div>
      </div>

      <div className={styles.messagesArea}>
        {messages.length === 0 ? (
          <div className={styles.welcomeMessage}>
            <div className={styles.welcomeLogo}>💬</div>
            <h3>Chào mừng đến với AI Tư vấn bán hàng</h3>
            <p>Hãy cho tôi biết bạn đang tìm kiếm gì, tôi sẽ giúp bạn tìm sản phẩm phù hợp nhất.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
              <div className={styles.avatar}>
                {msg.role === 'user' ? '👤' : '🧸'}
              </div>
              <div
                className={styles.content}
                dangerouslySetInnerHTML={renderContentHtml(msg.content)}
              />
            </div>
          ))
        )}
        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.avatar}>🧸</div>
            <div className={styles.loadingBubble}>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
            </div>
          </div>
        )}

        {/* Show cart summary if items added */}
        {cart.length > 0 && (
          <div className={styles.cartSummary}>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: '#E63A6C' }}>🛍️ Giỏ hàng hiện tại:</div>
            {cart.map((item, idx) => (
              <div key={idx} className={styles.cartItem}>
                <span>{item.name} {item.size ? `(${item.size})` : ''}</span>
                <span>{item.price.toLocaleString()} ₫</span>
              </div>
            ))}
            <div className={styles.cartTotal}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
                <span>Tạm tính:</span>
                <span>{(estimatedTotal - 30000).toLocaleString()} ₫</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
                <span>Phí ship:</span>
                <span>30,000 ₫</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px', borderTop: '1px dashed #eee', paddingTop: '4px' }}>
                <span>Tổng cộng:</span>
                <span>{estimatedTotal.toLocaleString()} ₫</span>
              </div>
            </div>
          </div>
        )}

        {/* Address Form in Chat */}
        {showAddressForm && !isLoading && (
          <div className={styles.formContainer}>
            <AddressFormChat
              recommendations={recommendations}
              estimatedTotal={estimatedTotal}
              onSubmit={(addressInfo) => {
                // This will be handled by parent component
                setShowAddressForm(false);
                // Emit event to parent to create order
                const event = new CustomEvent('addressFormSubmit', {
                  detail: { addressInfo, recommendations, estimatedTotal }
                });
                window.dispatchEvent(event);
              }}
              onCancel={() => setShowAddressForm(false)}
              isLoading={isLoading}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>


      {!showAddressForm && (
        <div className={styles.inputArea}>
          <div className={styles.textareaWrapper}>
            <textarea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              className={styles.textarea}
              disabled={isLoading}
              rows={1}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
            className={styles.sendButton}
            title="Gửi tin nhắn"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
