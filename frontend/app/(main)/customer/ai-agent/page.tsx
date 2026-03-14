'use client';

import React from 'react';
import { AIAgentConsole } from '@/components/ai-agent';
import styles from './ai-agent.module.css';

/**
 * AI Agent Tư vấn bán hàng - Trang chính
 * 
 * Tích hợp component AIAgentConsole để cung cấp giao diện tư vấn với AI
 * 
 * Được sử dụng tại: /customer/ai-agent
 */
export default function AIAgentPage() {
  // Lấy user ID từ auth state
  // Trong thực tế, bạn sẽ lấy từ context hoặc session
  const userId = 1; // Replace with actual user ID from auth

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>AI Tư vấn bán hàng</h1>
        <p>Được trợ giúp bởi AI để tìm sản phẩm phù hợp nhất</p>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
          💡 Bạn không cần đăng nhập để sử dụng tính năng này
        </p>
      </header>

      <main className={styles.mainContent}>
        <AIAgentConsole userId={userId} />
      </main>

      <footer className={styles.footer}>
        <p>
          © 2024 TeddyShop. Tất cả quyền được bảo vệ. |
          <a href="/help">Trợ giúp</a> |
          <a href="/contact">Liên hệ</a>
        </p>
      </footer>
    </div>
  );
}
