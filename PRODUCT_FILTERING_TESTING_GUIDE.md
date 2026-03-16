# 🧪 Hướng dẫn Testing - Lọc Sản phẩm Đề xuất v2.0

## 🚀 Chuẩn bị

### Bước 1: Chuẩn bị Database
Đảm bảo có các sản phẩm với `sold_count` khác nhau:

```sql
-- Kiểm tra products
SELECT id, name, sold_count, stock, status FROM products.Product LIMIT 10;

-- Nên có:
-- - Ít nhất 3 sản phẩm với sold_count > 5 (best-sellers)
-- - Ít nhất 2 sản phẩm với stock > 0 (có hàng)
```

### Bước 2: Start Backend

```bash
cd backend
# Nếu chưa migrate
python manage.py migrate

# Start server
python manage.py runserver
# Hoặc: python manage.py runserver 0.0.0.0:8000
```

**Kiểm tra:**
```
✓ Django server chạy tại http://localhost:8000
✓ API endpoint: GET /api/ai/conversations/
```

### Bước 3: Start Frontend

```bash
cd frontend
npm run dev
# Hoặc: npx next dev
```

**Kiểm tra:**
```
✓ Next.js server chạy tại http://localhost:3000
✓ API_URL được set đúng (nếu dev)
```

---

## 🧪 Test Cases

### Test 1: Basic Product Filtering

**Mục tiêu:** Verify sản phẩm được lọc dựa trên intent

**Steps:**
1. Mở chatbot: `http://localhost:3000`
2. Gửi tin nhắn: `"Tôi muốn xem gấu bông"`
3. Kiểm tra kết quả:
   - [ ] Ít nhất 3 sản phẩm được hiển thị
   - [ ] Products không trống (name, price, image_url)
   - [ ] Các button "Xem thêm", "Thêm vào giỏ", "Mua ngay" hiển thị

**Expected Output:**
```
AI: Cảm ơn bạn! Tôi tìm thấy các sản phẩm phù hợp...

[Product Card 1] - Gấu hồng Love
[Product Card 2] - Gấu xanh cute
[Product Card 3] - Gấu trắng dễ thương
```

**Kiểm tra Backend:**
```bash
# Check console logs
[AIAgentChat] Received response: {
  ai_response: "...",
  products: [
    { id: 1, name: "...", sold_count: 15, similarity: 0.85 },
    { id: 2, name: "...", sold_count: 10, similarity: 0.72 },
    { id: 3, name: "...", sold_count: 8, similarity: 0.60 }
  ]
}
```

---

### Test 2: Best-Seller Badge

**Mục tiêu:** Verify badge "⭐ Bán chạy" hiển thị đúng

**Steps:**
1. Từ Test 1, kiểm tra sản phẩm có badge
2. Badge chỉ xuất hiện nếu `sold_count > 5`
3. Badge có text "⭐ Bán chạy" màu vàng/cam

**Expected:**
```
[Product Card]
  ┌─────────────────────────────┐
  │ ⭐ Bán chạy  (top-right)     │
  │ [Image]  [Name]             │
  │          [Price]            │
  │          [Stock]            │
  │ [Buttons]                   │
  └─────────────────────────────┘
```

**Debug:**
```javascript
// Console: Kiểm tra isBestSeller flag
[AIAgentChat] Rendering products: [
  { ..., sold_count: 15, isBestSeller: true },   // ✓ Badge hiển thị
  { ..., sold_count: 3, isBestSeller: false },   // ✗ No badge
  { ..., sold_count: 20, isBestSeller: true }    // ✓ Badge hiển thị
]
```

---

### Test 3: Product Sorting

**Mục tiêu:** Verify sản phẩm được sắp xếp theo relevance score

**Steps:**
1. Gửi câu hỏi cụ thể: `"Tôi muốn gấu hồng bán chạy"`
2. Kiểm tra thứ tự sản phẩm (phải sắp xếp theo điểm cao nhất)

**Expected Logic:**
```
Product A: similarity=0.9, sold_count=20 -> score = 0.9 + (20/100)*0.3 = 0.96 [#1]
Product B: similarity=0.7, sold_count=15 -> score = 0.7 + (15/100)*0.3 = 0.745 [#2]
Product C: similarity=0.8, sold_count=5  -> score = 0.8 + (5/100)*0.3  = 0.815 [#3]

Displayed order: Product A -> Product C -> Product B
```

**Kiểm tra Frontend Console:**
```javascript
console.log('[AIAgentChat] Rendering products:', sortProductsByRelevance(msg.products));
// Output phải sắp xếp theo relevanceScore từ cao xuống thấp
```

---

### Test 4: Add to Cart from Chatbot

**Mục tiêu:** Verify button "Thêm vào giỏ" hoạt động

**Steps:**
1. Từ Test 1, click "Thêm vào giỏ" trên sản phẩm
2. Chọn kích thước (nếu có variants)
3. Nhập số lượng
4. Click "Thêm vào giỏ"

**Expected:**
```
✓ Modal dialog hiển thị
✓ Có thể chọn size (nếu product.variants.length > 0)
✓ Có thể nhập quantity
✓ Click button -> Toast "Đã thêm vào giỏ"
✓ Sản phẩm thêm vào cart
```

**Debug:**
```javascript
[ProductCard] Add to cart response: {
  id: 123,
  items: [...],
  total_price: 500000
}
```

---

### Test 5: Minimum 3 Products Fallback

**Mục tiêu:** Verify tối thiểu 3 sản phẩm luôn hiển thị

**Steps:**
1. Gửi câu hỏi rất cụ thể/lạ: `"Tôi muốn gấu màu tím lạ lùng"`
2. Kiểm tra kết quả

**Expected:**
```
Nếu matching sản phẩm < 3:
- Thêm best-sellers để đạt tối thiểu 3
- Thêm tối đa 5 sản phẩm

Nếu 0 matching sản phẩm:
- Return 3-5 top best-sellers
```

**Backend Check:**
```python
# backend/ai_agent/services.py, method _filter_products_by_intent

products_to_return = products_scored[:5]

# Nếu dưới 3 sản phẩm, thêm các sản phẩm bán chạy nhất
if len(products_to_return) < 3:
    top_sellers = Product.objects.filter(status='active').order_by('-sold_count')[:3]
    # ... thêm vào products_to_return
```

---

### Test 6: No API Keys (Fallback Mode)

**Mục tiêu:** Verify fallback mode hoạt động nếu không có API keys

**Steps:**
1. Comment out API keys trong `settings.py`:
   ```python
   # GEMINI_API_KEY = ""
   # OPENAI_API_KEY = ""
   ```
2. Gửi tin nhắn trong chatbot
3. Kiểm tra kết quả

**Expected:**
```
✓ AI vẫn respond (fallback mode)
✓ Sản phẩm vẫn được hiển thị
✓ Sắp xếp theo best-sellers + keyword matching
```

---

### Test 7: Product with Variants

**Mục tiêu:** Verify sản phẩm có variants hoạt động đúng

**Steps:**
1. Tìm sản phẩm có variants (size/unit khác nhau)
2. Click "Thêm vào giỏ"
3. Chọn size

**Expected:**
```javascript
product.variants = [
  { id: 1, size: "Small", price: 50000, stock: 10 },
  { id: 2, size: "Medium", price: 60000, stock: 5 },
  { id: 3, size: "Large", price: 70000, stock: 0 }
]

// UI: Hiển thị 3 button size, Large bị disable (stock = 0)
```

---

## 🔍 Debug Checks

### Check 1: Backend Logs

```bash
# Terminal: Backend
# Kiểm tra output khi gửi message

[AIAgentService] Filter products by intent
Input:
  - ai_response: "..."
  - user_message: "..."
  
Products scored:
  - Product A: similarity=0.85, sold_count=20, total_score=0.95
  - Product B: similarity=0.70, sold_count=10, total_score=0.73
  - ...

Output: 3 products returned
```

### Check 2: Frontend Console

```javascript
// Browser console
[AIAgentChat] Received response: {
  ai_response: "...",
  products: [
    { id: 1, name: "...", sold_count: 15, similarity: 0.85, ... },
    { id: 2, name: "...", sold_count: 10, similarity: 0.72, ... },
    ...
  ]
}

[AIAgentChat] Rendering products: [
  // Sorted by relevanceScore
  { ..., relevanceScore: 0.95, isBestSeller: true },
  { ..., relevanceScore: 0.73, isBestSeller: true },
  ...
]
```

### Check 3: Network Requests

```
POST /api/ai/conversations/{id}/send_message/
  → Response: 200 OK
  → products array có > 0 items
  → Mỗi product có: id, name, price, sold_count, image_url
```

---

## 📊 Performance Checks

### Query Performance
```sql
-- Kiểm tra query products performance
SELECT id, name, sold_count, price 
FROM products_product 
WHERE status='active' 
ORDER BY sold_count DESC 
LIMIT 5;

-- Nên < 100ms
```

### API Response Time
```javascript
// Console: Kiểm tra API response time
const start = performance.now();
// ... API call ...
const end = performance.now();
console.log(`Response time: ${end - start}ms`); // Target: < 1000ms
```

---

## ✅ Acceptance Criteria

- [x] Lọc sản phẩm theo intent khách hàng
- [x] Ưu tiên sản phẩm bán chạy
- [x] Tối thiểu 3 sản phẩm hiển thị
- [x] Badge "⭐ Bán chạy" hiển thị đúng
- [x] Sắp xếp theo relevance score
- [x] Fallback mode hoạt động
- [x] Variants support
- [x] Performance < 1s

---

## 🐛 Troubleshooting

### Problem: Sản phẩm không hiển thị

**Nguyên nhân:** Không có sản phẩm matching
**Giải pháp:**
1. Check database: `Products.objects.filter(status='active').count()`
2. Check API response: `data.products` array
3. Check frontend: Console logs

### Problem: Sắp xếp sai

**Nguyên nhân:** `sortProductsByRelevance()` không hoạt động
**Giải pháp:**
1. Check `similarity` và `sold_count` từ backend
2. Verify formula: `relevanceScore = similarity + (sold_count / 100) * 0.3`
3. Check sort order: `slice(0, 5)`

### Problem: Badge không hiển thị

**Nguyên nhân:** `isBestSeller` không được set
**Giải pháp:**
1. Check `sold_count > 5`: `isBestSeller: (p.sold_count || 0) > 5`
2. Check CSS: `.productCard { position: relative; }`
3. Check JSX: `{product.isBestSeller && <div>⭐ Bán chạy</div>}`

---

## 📞 Support

Nếu gặp lỗi:
1. Kiểm tra console logs (backend & frontend)
2. Kiểm tra network requests (DevTools)
3. Kiểm tra database (products có sold_count?)
4. Restart server (backend & frontend)

---

**Version:** 2.0  
**Created:** March 17, 2026  
**Last Updated:** March 17, 2026
