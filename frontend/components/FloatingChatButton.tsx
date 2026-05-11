'use client';

import React, { useState, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutContext } from '../layout/context/layoutcontext';
import styles from './FloatingChatButton.module.css';

interface FloatingChatButtonProps {
  userId?: number;
}

export default function FloatingChatButton({ userId }: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useContext(LayoutContext);

  const zaloUrl = 'https://zalo.me/84913526547';
  const facebookUrl = 'https://www.facebook.com/share/14bWyJrT9h1/';
  const tiktokUrl = 'https://www.tiktok.com/@2222dyu?_r=1&_t=ZS-96FX98TcgT6';

  // Only show on customer pages and hide for admin users
  if (role === 'admin' || !pathname?.startsWith('/customer')) {
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

      <div className={styles.socialStack}>
        <a
          className={`${styles.socialButton} ${styles.socialZalo}`}
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Zalo"
          title="Zalo"
        >
          Zalo
        </a>
        <a
          className={`${styles.socialButton} ${styles.socialFacebook}`}
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          title="Facebook"
        >
          FB
        </a>
        <a
          className={`${styles.socialButton} ${styles.socialTikTok}`}
          href={tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="TikTok"
          title="TikTok"
        >
          TikTok
        </a>
      </div>

      {/* Ripple effect */}
      <div className={styles.ripple}></div>
    </div>
  );
}
