'use client';

import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutContext } from '../layout/context/layoutcontext';
import styles from './FloatingChatButton.module.css';

interface FloatingChatButtonProps {
  userId?: number;
}

export default function FloatingChatButton({ userId }: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { role } = useContext(LayoutContext);

  // Hide chat button for admin users
  if (role === 'admin') {
    return null;
  }

  const handleClick = () => {
    router.push('/customer/ai-agent');
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.textLabel}>Chat với AI tư vấn bán hàng</div>
        <button
          className={`${styles.floatingButton} ${isOpen ? styles.active : ''}`}
          onClick={handleClick}
          title="Tư vấn bán hàng AI"
          aria-label="AI Chatbot"
        >
          <div className={styles.iconWrapper}>
            <span className={styles.teddy}>🧸</span>
            <span className={styles.chat}>💬</span>
          </div>
        </button>
      </div>

      {/* Ripple effect */}
      <div className={styles.ripple}></div>
    </div>
  );
}
