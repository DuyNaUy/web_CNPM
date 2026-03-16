# Hướng dẫn: UI Chọn Size trong Modal Sản Phẩm Đề Xuất

**Ngày tạo:** 16 Tháng 3, 2026  
**Phiên bản:** 1.0

## 📋 Tóm tắt

Đã bổ sung **modal/cửa sổ nổi (floating window)** với chọn size cho nút "Thêm vào giỏ" và "Mua ngay" trong component **ProductRecommendationCard**. Modal này hoạt động giống trang sản phẩm chính với:

- ✅ Chọn size với radio buttons (hiển thị tên size, số lượng còn, giá)
- ✅ Nhập số lượng với +/- button
- ✅ Hiển thị tổng giá
- ✅ Xác nhân thông tin sản phẩm (hình, tên, giá gốc)

---

## 🎯 Tính năng

### 1. **Modal Size Selection**
- Hiển thị tất cả size sản phẩm có sẵn
- Hiển thị số lượng còn hàng cho mỗi size
- Hiển thị giá khác nhau nếu có (so với giá mặc định)
- Radio button selection với visual feedback
- Disable size nếu hết hàng

### 2. **Quantity Input**
- Input với +/- buttons
- Min: 1, Max: tương ứng với số lượng của size được chọn
- Kiểm tra stock validity
- Disable nếu chưa chọn size

### 3. **Price Summary**
- Hiển thị giá / size
- Hiển thị số lượng
- Tính toán và hiển thị tổng giá

### 4. **Validation**
- Bắt buộc chọn size
- Kiểm tra số lượng >= 1
- Kiểm tra stock availability
- Thông báo toast cho từng trường hợp

### 5. **Responsive Design**
- Desktop: grid layout với size button
- Mobile: responsive grid với font-size nhỏ hơn
- Modal max-width 500px, tự nhân rộng nếu màn hình nhỏ

---

## 📁 File được tạo/sửa

### 1. **Tạo mới:**
   - `frontend/components/ai-agent/SizeSelectionModal.tsx` - React component
   - `frontend/components/ai-agent/SizeSelectionModal.module.css` - Styles

### 2. **Sửa đổi:**
   - `frontend/components/ai-agent/ProductRecommendationCard.tsx` - Logic modal
   - `frontend/components/ai-agent/index.ts` - Export SizeSelectionModal

---

## 🔧 Cách sử dụng

### Tự động hoạt động:
Khi người dùng click **"Thêm vào giỏ"** hoặc **"Mua ngay"** trong ProductRecommendationCard:

1. Modal mở ra
2. Component tự động fetch variants từ API
3. Hiển thị tất cả size sản phẩm
4. Người dùng chọn size → nhập số lượng → click "Thêm vào giỏ" hoặc "Mua ngay"

### Xử lý sau submit:
```typescript
// Nếu click "Thêm vào giỏ"
- Gọi callback onAddToCart() (nếu có)
- Thêm vào cart (backend sẽ xử lý size)
- Toast notification success

// Nếu click "Mua ngay"
- Gọi callback onBuyNow() hoặc 
- Lưu item vào sessionStorage
- Redirect sang /customer/checkout
```

---

## 💡 Công nghệ

- **React/TypeScript**: Component + State management
- **PrimeReact**: InputNumber component
- **CSS Modules**: Scoped styling
- **Next.js**: Image optimization, routing

---

## 🎨 Giao diện

### Modal Header
- Gradient background (purple → blue)
- Tiêu đề với icon emoji
- Nút close

### Size Selection
```
[Size 30cm] [Size 40cm] [Size 50cm]
  Còn 10     Còn 5      Hết hàng
```

### Quantity Input
```
Số lượng: [- 1 +]  Còn 10 sản phẩm
```

### Price Summary
```
┌─────────────────────────┐
│ Giá: 250,000 ₫        │
│ Số lượng: 2           │
├─────────────────────────┤
│ Tổng: 500,000 ₫       │
└─────────────────────────┘
```

### Buttons
- Cancel button (text)
- Confirm button (success - xanh)

---

## 🚀 Testing

### Test cases:
1. ✅ Click "Thêm vào giỏ" → Modal mở
2. ✅ Modal show tất cả size
3. ✅ Chọn size → quantity input enable
4. ✅ Nhập số lượng → tính tổng giá
5. ✅ Size hết hàng → disable button
6. ✅ Không chọn size → show warning khi submit
7. ✅ Vượt quá stock → show warning
8. ✅ Click "Mua ngay" → redirect checkout
9. ✅ Responsive trên mobile

---

## 🐛 Debugging

### Kiểm tra variants:
```typescript
// Console log trong fetchProductVariants
console.log('Product variants:', productData.variants);
```

### Kiểm tra API:
```bash
# Backend API
GET /api/products/{id}/
# Response có field "variants" là array
```

### Kiểm tra timeout/loading:
```typescript
const [loadingVariants, setLoadingVariants] = useState(false);
// Modal sẽ hiển thị loading state
```

---

## 📝 Notes

- Modal sẽ tự động fetch variants khi mở
- Nếu product không có variants, sử dụng default size
- Modal closekhông reset giỏ hàng (nếu người dùng confirm)
- Size selection bắt buộc (không thể bypass)
- Toast notifications cho mọi action

---

## 🔄 Flow chi tiết

```
User clicks "Thêm vào giỏ"
    ↓
openModal('add-to-cart') called
    ↓
fetchProductVariants() → API call
    ↓
Modal mở với variants list
    ↓
User chọn size + nhập quantity
    ↓
Click "Thêm vào giỏ" button
    ↓
handleModalConfirm()
    ↓
onAddToCart(recommendation) called
    ↓
Toast: "Thêm vào giỏ thành công"
    ↓
Modal close
```

---

## 📞 Support

Nếu có issue:
1. Kiểm tra variants API response
2. Kiểm tra console.log trong fetchProductVariants
3. Kiểm tra CSS module import
4. Kiểm tra PrimeReact components import
