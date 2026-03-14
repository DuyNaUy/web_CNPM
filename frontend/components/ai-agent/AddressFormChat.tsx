'use client';

import React, { useState } from 'react';
import styles from './AddressFormChat.module.css';

interface AddressInfo {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  payment_method: string;
}

interface AddressFormChatProps {
  onSubmit?: (addressInfo: AddressInfo) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  recommendations?: any[];
  estimatedTotal?: number;
}

export default function AddressFormChat({
  onSubmit,
  onCancel,
  isLoading = false,
  recommendations = [],
  estimatedTotal = 0,
}: AddressFormChatProps) {
  const [addressInfo, setAddressInfo] = useState<AddressInfo>({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    payment_method: 'cod',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateAddressForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!addressInfo.full_name.trim()) newErrors.full_name = 'Vui lòng nhập họ tên';
    if (!addressInfo.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    if (!addressInfo.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ';
    if (!addressInfo.city.trim()) newErrors.city = 'Vui lòng chọn tỉnh/thành phố';

    const phoneRegex = /^(0\d{9,10}|\+84\d{9,10})$/;
    if (addressInfo.phone && !phoneRegex.test(addressInfo.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressChange = (field: keyof AddressInfo, value: string) => {
    setAddressInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSubmit = () => {
    if (validateAddressForm()) {
      onSubmit?.(addressInfo);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4>📋 Để hoàn tất đơn hàng, vui lòng cung cấp thông tin giao hàng</h4>
      </div>

      {/* Order Summary */}
      {recommendations.length > 0 && (
        <div className={styles.summary}>
          <h5>Kiểm tra đơn hàng:</h5>
          <div className={styles.itemsList}>
            {recommendations.map((rec, idx) => (
              <div key={idx} className={styles.summaryItem}>
                <span className={styles.itemName}>{rec.product_name}</span>
                <span className={styles.itemQty}>x{rec.quantity}</span>
              </div>
            ))}
          </div>
          {estimatedTotal > 0 && (
            <div className={styles.priceBreakdown}>
              <div className={styles.priceRow}>
                <span>Tạm tính:</span>
                <span>{(estimatedTotal - 30000).toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className={styles.priceRow}>
                <span>Phí ship:</span>
                <span>30,000 ₫</span>
              </div>
              <div className={styles.totalAmount}>
                💰 Tổng cộng: {estimatedTotal.toLocaleString('vi-VN')} VND
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className={styles.formGroup}>
          <label>Họ và tên <span className={styles.required}>*</span></label>
          <input
            type="text"
            placeholder="Nhập họ và tên"
            value={addressInfo.full_name}
            onChange={(e) => handleAddressChange('full_name', e.target.value)}
            disabled={isLoading}
            className={errors.full_name ? styles.inputError : ''}
          />
          {errors.full_name && <span className={styles.error}>{errors.full_name}</span>}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Số điện thoại <span className={styles.required}>*</span></label>
            <input
              type="tel"
              placeholder="0123456789"
              value={addressInfo.phone}
              onChange={(e) => handleAddressChange('phone', e.target.value)}
              disabled={isLoading}
              className={errors.phone ? styles.inputError : ''}
            />
            {errors.phone && <span className={styles.error}>{errors.phone}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={addressInfo.email}
              onChange={(e) => handleAddressChange('email', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Địa chỉ <span className={styles.required}>*</span></label>
          <textarea
            placeholder="Nhập địa chỉ giao hàng chi tiết"
            value={addressInfo.address}
            onChange={(e) => handleAddressChange('address', e.target.value)}
            disabled={isLoading}
            className={errors.address ? styles.inputError : ''}
            rows={2}
          />
          {errors.address && <span className={styles.error}>{errors.address}</span>}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Tỉnh/Thành phố <span className={styles.required}>*</span></label>
            <input
              type="text"
              placeholder="Tỉnh/thành phố"
              value={addressInfo.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              disabled={isLoading}
              className={errors.city ? styles.inputError : ''}
            />
            {errors.city && <span className={styles.error}>{errors.city}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Quận/Huyện</label>
            <input
              type="text"
              placeholder="Quận/huyện"
              value={addressInfo.district}
              onChange={(e) => handleAddressChange('district', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Phương thức thanh toán <span className={styles.required}>*</span></label>
          <select
            value={addressInfo.payment_method}
            onChange={(e) => handleAddressChange('payment_method', e.target.value)}
            disabled={isLoading}
            className={styles.select}
          >
            <option value="cod">Thanh toán khi nhận hàng (COD)</option>
            <option value="momo">Momo</option>
            <option value="vnpay">VNPay</option>
            <option value="banking">Chuyển khoản ngân hàng</option>
          </select>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={styles.cancelBtn}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitBtn}
          >
            {isLoading ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
          </button>
        </div>
      </form>
    </div>
  );
}
