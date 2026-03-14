'use client';

import React, { useState } from 'react';
import styles from './OrderPreview.module.css';

interface OrderItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  size?: string;
}

interface AddressInfo {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
}

interface OrderPreviewProps {
  items: OrderItem[];
  estimatedTotal: number;
  onConfirm?: (orderData: any) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  userInfo?: Partial<AddressInfo>;
}

export default function OrderPreview({
  items,
  estimatedTotal,
  onConfirm,
  onCancel,
  isLoading = false,
  userInfo = {},
}: OrderPreviewProps) {
  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const [addressInfo, setAddressInfo] = useState<AddressInfo>({
    full_name: userInfo.full_name || '',
    phone: userInfo.phone || '',
    email: userInfo.email || '',
    address: userInfo.address || '',
    city: userInfo.city || '',
    district: userInfo.district || '',
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
    setAddressInfo(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleContinueToPayment = () => {
    if (validateAddressForm()) {
      setStep('payment');
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm({
        payment_method: paymentMethod,
        address_info: addressInfo,
      });
    }
  };

  return (
    <div className={styles.container}>
      <h3>Xác nhận đơn hàng</h3>

      {/* Items List */}
      <div className={styles.itemsList}>
        <h4>Sản phẩm được đề xuất:</h4>
        {items.map((item, idx) => (
          <div key={idx} className={styles.itemRow}>
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{item.name}</span>
              <span className={styles.itemPrice}>
                {item.price.toLocaleString('vi-VN')} VND × {item.quantity}
              </span>
            </div>
            <div className={styles.itemSubtotal}>
              {item.subtotal.toLocaleString('vi-VN')} VND
            </div>
          </div>
        ))}
      </div>

      <div className={styles.totals}>
        <div className={styles.totalRow}>
          <span>Tạm tính:</span>
          <span>
            {(estimatedTotal - 30000).toLocaleString('vi-VN')} VND
          </span>
        </div>
        <div className={styles.totalRow}>
          <span>Phí vận chuyển:</span>
          <span>30,000 VND</span>
        </div>
        <div className={styles.totalRow}>
          <span>Tổng cộng:</span>
          <span className={styles.totalAmount}>
            {estimatedTotal.toLocaleString('vi-VN')} VND
          </span>
        </div>
      </div>

      {/* Address Form - Step 1 */}
      {step === 'address' && (
        <div className={styles.addressForm}>
          <h4>📍 Thông tin giao hàng</h4>

          <div className={styles.formGroup}>
            <label>Họ và tên:</label>
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

          <div className={styles.formGroup}>
            <label>Số điện thoại:</label>
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
            <label>Email:</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={addressInfo.email}
              onChange={(e) => handleAddressChange('email', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Địa chỉ:</label>
            <textarea
              placeholder="Nhập địa chỉ giao hàng chi tiết"
              value={addressInfo.address}
              onChange={(e) => handleAddressChange('address', e.target.value)}
              disabled={isLoading}
              className={errors.address ? styles.inputError : ''}
              rows={3}
            />
            {errors.address && <span className={styles.error}>{errors.address}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Tỉnh/Thành phố:</label>
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
              <label>Quận/Huyện:</label>
              <input
                type="text"
                placeholder="Quận/huyện"
                value={addressInfo.district}
                onChange={(e) => handleAddressChange('district', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className={styles.cancelBtn}
            >
              Hủy
            </button>
            <button
              onClick={handleContinueToPayment}
              disabled={isLoading}
              className={styles.continueBtn}
            >
              {isLoading ? 'Đang xử lý...' : 'Tiếp tục'}
            </button>
          </div>
        </div>
      )}

      {/* Payment Method - Step 2 */}
      {step === 'payment' && (
        <div className={styles.paymentSection}>
          <h4>💳 Chọn phương thức thanh toán</h4>

          <div className={styles.paymentMethod}>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={isLoading}
              className={styles.select}
            >
              <option value="cod">Thanh toán khi nhận hàng (COD)</option>
              <option value="momo">Momo</option>
              <option value="vnpay">VNPay</option>
              <option value="banking">Chuyển khoản ngân hàng</option>
            </select>
          </div>

          {/* Order Summary */}
          <div className={styles.summary}>
            <h5>Kiểm tra thông tin</h5>
            <p><strong>Người nhận:</strong> {addressInfo.full_name}</p>
            <p><strong>Số điện thoại:</strong> {addressInfo.phone}</p>
            <p><strong>Địa chỉ:</strong> {addressInfo.address}, {addressInfo.district}, {addressInfo.city}</p>
            <div className={styles.finalTotals}>
              <p>Tạm tính: {(estimatedTotal - 30000).toLocaleString('vi-VN')} VND</p>
              <p>Phí ship: 30,000 VND</p>
              <p><strong>Tổng tiền:</strong> <span className={styles.totalAmount}>{estimatedTotal.toLocaleString('vi-VN')} VND</span></p>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              onClick={() => setStep('address')}
              disabled={isLoading}
              className={styles.backBtn}
            >
              Quay lại
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={styles.confirmBtn}
            >
              {isLoading ? 'Đang xử lý...' : 'Xác nhận và tạo đơn hàng'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
