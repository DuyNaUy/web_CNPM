# 🛒 Quick Start: Size Modal cho Product Recommendation

## ✅ Đã hoàn thành

Thêm **Modal chọn size** vào component **ProductRecommendationCard** với 3 nút:
- "Xem chi tiết" → redirect product page
- "Thêm vào giỏ" ← **[MODAL MỚI]**
- "Mua ngay" ← **[MODAL MỚI]**

---

## 🎯 Tính năng Modal

### 1️⃣ Chọn Size
```
┌─ Chọn kích thước ─────────────────┐
│ [30cm] [40cm] [50cm] [60cm]       │
│  (10)   (5)   Hết   (8)           │
│     + Có hiển thị giá khác (nếu)  │
└───────────────────────────────────┘
```

### 2️⃣ Nhập Số Lượng
```
┌─ Số lượng ────────────────────────┐
│   [- 1 +]  Còn 10 sản phẩm        │
└───────────────────────────────────┘
```

### 3️⃣ Tóm Tắt Giá
```
┌─ Tóm tắt ─────────────────────────┐
│ Giá:       250,000 ₫              │
│ Số lượng:  2                      │
├───────────────────────────────────┤
│ Tổng:      500,000 ₫              │
└───────────────────────────────────┘
```

---

## 📁 File mới

| File | Mô tả |
|------|-------|
| `SizeSelectionModal.tsx` | React component |
| `SizeSelectionModal.module.css` | Styles |

---

## 🚀 Cách sử dụng (tự động)

```typescript
// Không cần thay đổi code hiện tại!
// Khi user click button, modal tự động:
1. Fetch variants từ API
2. Mở modal
3. User chọn size + quantity
4. Submit → add to cart / checkout
```

---

## 🎨 Visual

- ✨ **Gradient header** (purple → blue)
- 🎯 **Interactive size buttons** (hover effect)
- 📱 **Responsive** (desktop + mobile)
- 🔔 **Toast notifications** (success/error/warning)

---

## ✔️ Validation

- ✅ Bắt buộc chọn size
- ✅ Số lượng >= 1
- ✅ Không vượt quá stock
- ✅ Disable nút nếu hết hàng

---

## 🔗 Files đã sửa

- `ProductRecommendationCard.tsx` - Add modal logic
- `index.ts` - Export SizeSelectionModal

---

## 💻 Local Testing

```bash
# Frontend already updated
# Just test by clicking buttons on product recommendation

# Steps:
1. Start AI Agent chat
2. Get product recommendation
3. Click "Thêm vào giỏ" → Modal appears
4. Select size → Input quantity → Click confirm
5. Should show toast: "Sản phẩm đã được thêm vào giỏ"
```

---

## 📋 Validation Messages

| Event | Message |
|-------|---------|
| No size selected | "Vui lòng chọn kích thước" |
| Invalid quantity | "Vui lòng nhập số lượng >= 1" |
| Over stock | "Chỉ còn X sản phẩm trong kho" |
| Success add | "{name} (size) xN đã được thêm vào giỏ hàng" |
| API error | "Không thể tải thông tin sản phẩm" |

---

## 🎮 User Flow

```
Product Recommendation Card
        ↓
  User sees 3 buttons:
  [Xem chi tiết] [Giỏ hàng] [Mua ngay]
        ↓
  Click [Giỏ hàng] or [Mua ngay]
        ↓
✨ MODAL OPENS ✨
        ↓
  1. Select Size (required)
  2. Enter Quantity (default 1, max = stock)
  3. See Total Price
  4. Click [Thêm vào giỏ] or [Mua ngay]
        ↓
  - Add to cart: Toast + Close modal
  - Buy now: Save to sessionStorage + Redirect checkout
```

---

## 🐛 Debug Tips

```typescript
// If modal not showing, check:
1. productVariants state has data
2. API returns variants: Array
3. Console errors in browser

// If buttons disabled:
1. Check stock > 0
2. Check selectedSize is set
3. Check quantity >= 1
```

---

## 📞 Debug INFO

- Component: `ProductRecommendationCard`
- Modal: `SizeSelectionModal`
- Uses: `productAPI.getById()` to fetch variants
- Style: CSS Modules (scoped)

---

**Status**: ✅ Ready to use  
**Tested**: ✅ No TypeScript errors  
**Browser Support**: ✅ All modern browsers
