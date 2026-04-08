'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AIAgentChat from './AIAgentChat';
import OrderPreview from './OrderPreview';
import styles from './AIAgentConsole.module.css';

interface Recommendation {
  product_id: number;
  product_name: string;
  reason: string;
  confidence_score: number;
  quantity: number;
  price?: number;
}

interface AIAgentConsoleProps {
  userId: number;
}

export default function AIAgentConsole({ userId }: AIAgentConsoleProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showOrderPreview, setShowOrderPreview] = useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = useState<Recommendation[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const disableAiAuthRef = useRef(false);
  const isRecoveringSessionRef = useRef(false);

  const fetchAiEndpoint = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    const token = localStorage.getItem('access_token');
    const headers: any = {
      ...((init?.headers as any) || {}),
    };

    if (token && !disableAiAuthRef.current && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...init,
      headers,
    });

    if (response.status === 401 && token && !disableAiAuthRef.current) {
      console.warn('[AIAgentConsole] AI endpoint got 401 with token, disable auth and retry without token...');
      disableAiAuthRef.current = true;
      const retryHeaders: any = { ...headers };
      delete retryHeaders.Authorization;
      response = await fetch(url, {
        ...init,
        headers: retryHeaders,
      });
    }

    return response;
  }, []);

  const handleStartConversation = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetchAiEndpoint(`${apiUrl}/api/ai/conversations/start_conversation/`, {
        method: 'POST',
        headers: {},
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.session_id);
        localStorage.setItem('teddy_ai_session_id', data.session_id);
      } else {
        console.error('[AIAgentConsole] start_conversation failed with status:', response.status);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [fetchAiEndpoint]);

  const recoverConversationSession = useCallback(async () => {
    if (isRecoveringSessionRef.current) return;
    isRecoveringSessionRef.current = true;

    try {
      localStorage.removeItem('teddy_ai_session_id');
      setConversationId(null);
      setSelectedRecommendations([]);
      await handleStartConversation();
    } finally {
      isRecoveringSessionRef.current = false;
    }
  }, [handleStartConversation]);

  const handleNewConversation = () => {
    if (window.confirm('Bạn có chắc muốn bắt đầu cuộc trò chuyện mới? Lịch sử hiện tại sẽ được thay thế.')) {
      localStorage.removeItem('teddy_ai_session_id');
      setConversationId(null);
      setSelectedRecommendations([]);
      // Start a new one immediately
      handleStartConversation();
    }
  };

  const handleRecommendationsReceived = (recommendations: Recommendation[]) => {
    setSelectedRecommendations(recommendations);
  };

  const handleConfirmOrder = useCallback(async (orderData: any) => {
    if (!conversationId) return;

    setIsCreatingOrder(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // First, collect address info
      const baseHeaders: any = {
        'Content-Type': 'application/json',
      };
      if (token) {
        baseHeaders.Authorization = `Bearer ${token}`;
      }

      const addressResponse = await fetch(`${apiUrl}/api/ai/orders/`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({
          conversation_id: conversationId,
          suggested_products: JSON.stringify(
            selectedRecommendations.map(rec => ({
              product_id: rec.product_id,
              name: rec.product_name,
              price: rec.price || 0,
              quantity: rec.quantity,
              subtotal: (rec.price || 0) * rec.quantity
            }))
          ),
          estimated_total: selectedRecommendations.reduce((sum, rec) => sum + ((rec.price || 0) * rec.quantity), 0),
          full_name: orderData.address_info.full_name,
          phone: orderData.address_info.phone,
          email: orderData.address_info.email,
          address: orderData.address_info.address,
          city: orderData.address_info.city,
          district: orderData.address_info.district,
        }),
      });

      if (addressResponse.ok) {
        const addressData = await addressResponse.json();
        const orderId = addressData.id;

        // Then create the actual order
        const createResponse = await fetch(
          `${apiUrl}/api/ai/orders/${orderId}/confirm_and_create/`,
          {
            method: 'POST',
            headers: baseHeaders,
            body: JSON.stringify({
              payment_method: orderData.payment_method,
            }),
          }
        );

        if (createResponse.ok) {
          const createData = await createResponse.json();
          
          if (createData.payUrl) {
            // Redirect to payment gateway
            window.location.href = createData.payUrl;
            return;
          }

          alert(`✅ Đơn hàng được tạo thành công!\n\nMã đơn hàng: ${createData.order_code}\n\nCảm ơn bạn đã mua hàng tại TeddyShop!`);

          // Clear state, but we might want to let the AI say something
          setShowOrderPreview(false);
          setSelectedRecommendations([]);

          // Instead of setConversationId(null), we keep it to let the AI message sync
          // The AI will add a "Success" message to the history, which AIAgentChat polls
        } else {
          const errorData = await createResponse.json();
          alert(`Có lỗi: ${errorData.error || 'Không thể tạo đơn hàng'}`);
        }
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsCreatingOrder(false);
    }
  }, [conversationId, selectedRecommendations]);

  // Listen for address form submission from chat
  useEffect(() => {
    const handleAddressFormSubmit = (event: any) => {
      const { addressInfo } = event.detail;
      handleConfirmOrder({
        address_info: addressInfo,
        payment_method: addressInfo.payment_method || 'cod'
      });
    };

    window.addEventListener('addressFormSubmit', handleAddressFormSubmit);
    return () => window.removeEventListener('addressFormSubmit', handleAddressFormSubmit);
  }, [handleConfirmOrder]);

  // Kiểm tra localStorage khi component mount
  useEffect(() => {
    const bootstrapConversation = async () => {
      const savedSessionId = localStorage.getItem('teddy_ai_session_id');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      if (!savedSessionId) {
        console.log('[AIAgentConsole] No conversation found, auto-starting...');
        await handleStartConversation();
        return;
      }

      try {
        const verifyResponse = await fetchAiEndpoint(
          `${apiUrl}/api/ai/conversations/${savedSessionId}/get_history/`,
          {}
        );

        if (verifyResponse.ok) {
          console.log('[AIAgentConsole] Loaded valid conversation from localStorage:', savedSessionId);
          setConversationId(savedSessionId);
          return;
        }

        if (verifyResponse.status === 404) {
          console.warn('[AIAgentConsole] Saved conversation not found (404), recreating...');
          await recoverConversationSession();
          return;
        }

        // Trường hợp status khác 404, vẫn thử dùng session cũ để tránh làm mất ngữ cảnh không cần thiết.
        setConversationId(savedSessionId);
      } catch (error) {
        console.error('[AIAgentConsole] Failed to verify saved conversation:', error);
        await recoverConversationSession();
      }
    };

    void bootstrapConversation();
  }, [fetchAiEndpoint, handleStartConversation, recoverConversationSession]);

  if (!conversationId) {
    return (
      <div className={styles.welcome}>
        <div className={styles.welcomeContent}>
          <h2>AI Tư vấn bán hàng</h2>
          <p>Chào mừng bạn! Tôi là trợ lý AI của TeddyShop.</p>
          <p>Tôi sẽ giúp bạn tìm sản phẩm phù hợp và tạo đơn hàng.</p>
          <button onClick={handleStartConversation} className={styles.startBtn}>
            Bắt đầu tư vấn
          </button>
        </div>
      </div>
    );
  }

  const estimatedTotal = selectedRecommendations.reduce((sum, rec) => {
    return sum + ((rec.price || 0) * rec.quantity);
  }, 0);

  return (
    <div className={styles.console}>
      {!showOrderPreview ? (
        <div className={styles.chatWrapper}>
          <div className={styles.chatHeader}>
            <button
              onClick={handleNewConversation}
              className={styles.newChatBtn}
              title="Bắt đầu cuộc trò chuyện mới"
            >
              🔄 Chat mới
            </button>
          </div>
          <AIAgentChat
            conversationId={conversationId}
            onRecommendationsReceived={handleRecommendationsReceived}
            onConversationNotFound={() => {
              void recoverConversationSession();
            }}
          />
          {selectedRecommendations.length > 0 && (
            <button
              onClick={() => setShowOrderPreview(true)}
              className={styles.createOrderBtn}
            >
              Tạo đơn hàng từ đề xuất
            </button>
          )}
        </div>
      ) : (
        <OrderPreview
          items={selectedRecommendations.map((rec) => ({
            product_id: rec.product_id,
            name: rec.product_name,
            price: rec.price || 0,
            quantity: rec.quantity,
            subtotal: (rec.price || 0) * rec.quantity,
          }))}
          estimatedTotal={estimatedTotal}
          onConfirm={handleConfirmOrder}
          onCancel={() => setShowOrderPreview(false)}
          isLoading={isCreatingOrder}
        />
      )}
    </div>
  );
}
