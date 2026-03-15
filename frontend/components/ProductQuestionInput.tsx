'use client';
import React, { useState, useRef } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import apiRequest from '@/services/api';

interface ProductQuestionInputProps {
  onAnalysisComplete?: (result: any) => void;
  className?: string;
}

export const ProductQuestionInput: React.FC<ProductQuestionInputProps> = ({
  onAnalysisComplete,
  className = ''
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const toastRef = useRef<Toast>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!question.trim()) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập câu hỏi',
        life: 3000
      });
      return;
    }

    setLoading(true);
    try {
      // Call API endpoint
      const response = await apiRequest('/products/analyze_product_question/', {
        method: 'POST',
        body: JSON.stringify({
          question: question.trim()
        })
      });

      if (response) {
        toastRef.current?.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Phân tích câu hỏi thành công',
          life: 2000
        });
        
        // Pass result to parent component
        onAnalysisComplete?.(response);
        
        // Reset form
        setQuestion('');
        setIsExpanded(false);
      }
    } catch (error: any) {
      console.error('Error analyzing question:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: error.response?.data?.error || 'Lỗi khi phân tích câu hỏi',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`product-question-input ${className}`}>
      <Toast ref={toastRef} />
      
      <div className="question-input-container">
        {!isExpanded ? (
          <div 
            className="collapsed-input"
            onClick={() => setIsExpanded(true)}
          >
            <span className="input-placeholder">
              🤖 Hỏi AI về sản phẩm gấu bông... (ví dụ: &quot;Tôi muốn xem gấu bông màu hồng&quot;)
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="expanded-form">
            <div className="form-group">
              <label>Hỏi AI về sản phẩm gấu bông:</label>
              <InputTextarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Nhập câu hỏi của bạn... Ví dụ: Tôi muốn xem chi tiết gấu bông màu hồng, giá dưới 500 nghìn"
                rows={3}
                autoFocus
                onBlur={() => {
                  if (!question.trim() && !loading) {
                    setIsExpanded(false);
                  }
                }}
              />
            </div>

            <div className="form-actions">
              <Button
                label={loading ? 'Đang phân tích...' : 'Tìm kiếm'}
                icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-search'}
                onClick={handleSubmit}
                loading={loading}
                disabled={loading || !question.trim()}
                className="p-button-primary"
              />
              <Button
                label="Hủy"
                icon="pi pi-times"
                onClick={() => {
                  setQuestion('');
                  setIsExpanded(false);
                }}
                className="p-button-text"
                disabled={loading}
              />
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .product-question-input {
          margin-bottom: 2rem;
        }

        .question-input-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .collapsed-input {
          padding: 1rem 1.5rem;
          cursor: pointer;
          user-select: none;
          transition: all 0.3s ease;
        }

        .collapsed-input:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          filter: brightness(1.05);
        }

        .input-placeholder {
          color: white;
          font-size: 1rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .expanded-form {
          padding: 1.5rem;
          background: white;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .form-group :global(textarea) {
          width: 100%;
          font-size: 0.95rem;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          padding: 0.75rem;
          font-family: inherit;
          resize: vertical;
        }

        .form-group :global(textarea):focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        @media (max-width: 640px) {
          .question-input-container {
            margin: 0 -1rem;
            border-radius: 0;
          }

          .collapsed-input {
            padding: 1rem;
          }

          .input-placeholder {
            font-size: 0.9rem;
          }

          .expanded-form {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductQuestionInput;
