# 🔍 Cải tiến Lọc Sản phẩm Đề xuất Chatbot v2.0

## 📋 Tổng quát

Hệ thống lọc sản phẩm đề xuất trong chatbot đã được cải tiến toàn diện:
- ✅ Lọc sản phẩm dựa trên **câu hỏi/ý định của khách hàng** (intent-based filtering)
- ✅ **Ưu tiên sản phẩm bán chạy** (best-sellers) kết hợp với độ liên quan
- ✅ **Tối thiểu 3 sản phẩm** được hiển thị (tối đa 5)
- ✅ **Hiển thị badge "Bán chạy"** cho các sản phẩm phổ biến
- ✅ **Sắp xếp thông minh** theo relevance score

---

## 🔧 Chi tiết Thay đổi

### Backend (`backend/ai_agent/services.py`)

#### 1. **Phương thức mới: `_filter_products_by_intent()` (Dòng ~918)**

Lọc sản phẩm dựa trên ý định khách hàng:

```python
def _filter_products_by_intent(self, ai_response: str, user_message: str) -> List[Dict]:
    """
    Lọc sản phẩm dựa trên ý định của khách hàng từ câu hỏi
    Ưu tiên sản phẩm bán chạy (sold_count cao) và phù hợp nhất
    """
    # Công thức tính score:
    # total_score = similarity + (sold_count / max_sold) * 0.3
    #
    # - similarity: độ khớp với intention (0-1)
    # - sold_count: số lượng đã bán (từ database)
    # - 0.3: boost factor cho sales (30%)
```

**Cách hoạt động:**
- Kết hợp response từ AI + user message để tìm sản phẩm
- Tính similarity score cho mỗi sản phẩm (fuzzy matching)
- Boost score dựa trên sales count (sản phẩm bán chạy được ưu tiên)
- Sắp xếp theo total_score từ cao xuống thấp
- Đảm bảo **tối thiểu 3 sản phẩm** (nếu dưới 3, thêm top sellers)
- Trả về **tối đa 5 sản phẩm**

**Logic:**
```
Bước 1: Tìm sản phẩm matching (similarity >= 0.5)
Bước 2: Tính relevance score (similarity + sales boost)
Bước 3: Sắp xếp theo score
Bước 4: Lấy top 5 (hoặc thêm best-sellers nếu < 3)
```

#### 2. **Phương thức cập nhật: `improve_product_extraction()` (Dòng ~992)**

Bây giờ nhận 2 tham số:
```python
def improve_product_extraction(self, ai_response: str, user_message: str = None) -> Dict:
    # Nếu có user_message -> dùng intent-based filtering
    # Nếu không -> dùng phương thức cũ (fallback)
```

#### 3. **Cập nhật các API calls:**
- `_call_openai_api()` - Truyền `user_message` đến `_extract_products_from_response()`
- `_call_gemini_api()` - Truyền `user_message` đến `_extract_products_from_response()`
- `_extract_products_from_response()` - Nhận `user_message` và truyền đến `improve_product_extraction()`

#### 4. **Import bổ sung:**
```python
from django.db import models
from django.db.models import Max  # Để tính max(sold_count)
```

---

### Frontend (`frontend/components/ai-agent/AIAgentChat.tsx`)

#### 1. **Helper Function: `sortProductsByRelevance()` (Dòng ~768)**

```typescript
const sortProductsByRelevance = (products: Product[]): Product[] => {
  // Tính relevance score mỗi product
  const productsWithScore = products.map((p: any) => ({
    ...p,
    relevanceScore: (p.similarity || 0.5) + ((p.sold_count || 0) / 100) * 0.3,
    isBestSeller: (p.sold_count || 0) > 5
  }));
  
  // Sắp xếp theo relevance score (cao xuống thấp)
  return sorted.slice(0, 5);
};
```

**Công thức:**
```
relevanceScore = similarity + (sold_count / 100) * 0.3

isBestSeller = true if sold_count > 5
```

#### 2. **Cập nhật Product Interface:**

```typescript
interface Product {
  // ... existing fields
  sold_count?: number;      // Số lượng đã bán
  rating?: number;          // Đánh giá
  similarity?: number;      // Độ khớp từ backend
  isBestSeller?: boolean;   // Cư xử được tính toán
}
```

#### 3. **Badge "Bán chạy" trong ProductCard:**

```typescript
{/* Best Seller Badge */}
{product.isBestSeller && (
  <div style={{
    position: 'absolute',
    top: '-8px',
    right: '10px',
    backgroundColor: '#ff6b35',
    color: 'white',
    // ... styling
  }}>
    ⭐ Bán chạy
  </div>
)}
```

#### 4. **Sắp xếp hiển thị sản phẩm:**

```typescript
{sortProductsByRelevance(msg.products).map((product) => (
  <ProductCard key={product.id} product={product} conversationId={conversationId} />
))}
```

#### 5. **CSS Update:**

Thêm `position: relative` vào `.productCard` để badge positioning hoạt động:

```css
.productCard {
  /* ... existing styles */
  position: relative;
}
```

---

## 📊 Ví dụ Hoạt động

### Kịch bản 1: Khách hỏi "Tôi muốn gấu bông hồng"

**Backend:**
```
1. AI Response: "Tôi tìm thấy gấu hồng Cute, gấu hồng Love..."
2. User Message: "Tôi muốn gấu bông hồng"

3. Tìm sản phẩm matching:
   - "Gấu bông hồng" -> similarity: 0.95, sold_count: 50 -> score: 0.95 + 0.15 = 1.10 ⭐ #1
   - "Gấu hồng Cute" -> similarity: 0.80, sold_count: 30 -> score: 0.80 + 0.09 = 0.89 ⭐ #2
   - "Gấu Pink Love" -> similarity: 0.70, sold_count: 60 -> score: 0.70 + 0.18 = 0.88 ⭐ #3

4. Return: [Gấu bông hồng, Gấu hồng Cute, Gấu Pink Love]
```

**Frontend:**
```
1. Receive 3 products với sold_count > 5
2. Render ProductCard mỗi cái có badge "⭐ Bán chạy"
3. Sắp xếp theo relevanceScore từ cao xuống thấp
```

### Kịch bản 2: Khách hỏi "Sản phẩm bán chạy nhất"

**Backend:**
```
1. User message: "Sản phẩm bán chạy nhất"
2. AI không nhắc sản phẩm cụ thể
3. Trigger fallback: Thêm top 3-5 best-sellers
4. Return: [Top Sales #1, Top Sales #2, Top Sales #3, ...]
```

---

## 🧪 Testing

### Backend Testing

```python
# File: test_filtered_products.py

from backend.ai_agent.services import AIAgentService
from products.models import Product

service = AIAgentService()

# Test 1: Filter by intent
result = service._filter_products_by_intent(
    ai_response="Tôi tìm thấy gấu hồng Love...",
    user_message="Tôi muốn gấu bông hồng"
)
print(f"Products: {result}")

# Kiểm tra:
# ✓ Tối thiểu 3 sản phẩm
# ✓ Sắp xếp theo relevance score
# ✓ sold_count >= 5 cho best-sellers

# Test 2: Improve product extraction
result = service.improve_product_extraction(
    ai_response="Tôi có Gấu xanh, Gấu hồng...",
    user_message="Tôi muốn xem gấu"
)
print(f"Cleaned: {result['cleaned_response']}")
print(f"Products: {len(result['products'])}")
print(f"Confidence: {result['confidence']}")

# Kiểm tra:
# ✓ confidence > 0.5 khi có match
# ✓ products list có tối thiểu 3 item
```

### Frontend Testing

```typescript
// Test 1: sortProductsByRelevance
const testProducts = [
  { id: 1, name: "Gấu A", similarity: 0.8, sold_count: 10, isBestSeller: true },
  { id: 2, name: "Gấu B", similarity: 0.6, sold_count: 5, isBestSeller: true },
  { id: 3, name: "Gấu C", similarity: 0.9, sold_count: 20, isBestSeller: true },
];

const sorted = sortProductsByRelevance(testProducts);
// Expected: Gấu C (score: 0.96) -> Gấu A (score: 0.83) -> Gấu B (score: 0.62)

// Test 2: Badge rendering
// Kiểm tra: Sản phẩm với sold_count > 5 có badge "⭐ Bán chạy"
```

---

## 🎯 Metrics & KPIs

### Backend
- `similarity`: Độ khớp intent (0-1) - Target >= 0.6
- `sold_count`: Số lượng đã bán - Target >= 5 cho best-seller
- `total_score`: Relevance score - Dùng để sắp xếp
- `min_products`: Tối thiểu 3 sản phẩm được trả về

### Frontend
- `relevanceScore`: Sắp xếp hiển thị
- `isBestSeller`: Flag hiển thị badge
- `sortProductsByRelevance()`: Đảm bảo sắp xếp đúng

---

## 🚀 Deployment

### Bước 1: Update Backend
```bash
cd backend
python manage.py migrate  # Nếu có migration nào
python manage.py test ai_agent.tests  # Run tests
```

### Bước 2: Update Frontend
```bash
cd frontend
npm run build  # Build Next.js project
npm run dev    # Test locally
```

### Bước 3: Verify
```
1. Start backend: python manage.py runserver
2. Start frontend: npm run dev
3. Test chatbot với các câu hỏi
4. Kiểm tra:
   - ✓ Sản phẩm hiển thị đúng thứ tự
   - ✓ Badge "⭐ Bán chạy" xuất hiện
   - ✓ Tối thiểu 3 sản phẩm
```

---

## 📝 Ghi chú

- **Ngưỡng similarity**: Thay đổi từ 0.6 thành 0.5 để bắt được nhiều sản phẩm hợp lệ
- **Best-seller threshold**: sold_count > 5 có thể điều chỉnh theo nhu cầu
- **Sales boost**: 0.3 (30%) có thể tăng/giảm tùy ưu tiên bán hàng
- **Max products**: Giới hạn 5 sản phẩm để tránh quá tải UI

---

## ✅ Checklist Hoàn thành

- [x] Backend: `_filter_products_by_intent()` - Lọc theo intent
- [x] Backend: Update `improve_product_extraction()` - Nhận user_message
- [x] Backend: Update API calls - Truyền user_message
- [x] Frontend: `sortProductsByRelevance()` - Sắp xếp theo relevance
- [x] Frontend: Product interface - Thêm sold_count, isBestSeller
- [x] Frontend: Best-seller badge - Hiển thị ⭐ Bán chạy
- [x] Frontend: CSS update - Thêm position: relative
- [x] Documentation - Tài liệu này

---

**Created**: March 17, 2026  
**Version**: 2.0  
**Status**: ✅ Ready for Testing
