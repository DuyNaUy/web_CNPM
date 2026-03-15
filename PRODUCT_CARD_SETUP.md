# Setup & Testing Guide

## Backend Setup

```bash
cd d:\TeddyShop\backend

# Chạy migrations
python manage.py migrate

# Start dev server
python manage.py runserver
```

Backend sẽ chạy trên: `http://localhost:8000`

## Frontend Setup

```bash
cd d:\TeddyShop\frontend

# Install dependencies (nếu chưa)
npm install

# Start dev server
npm run dev
```

Frontend sẽ chạy trên: `http://localhost:3000`

## Test AI Recommendations

1. Mở browser: `http://localhost:3000`
2. Click vào **"Chat với AI tư vấn bán hàng"** 🧸💬
3. Gõ câu hỏi theo các theme sau, AI sẽ recommend sản phẩm dưới dạng **ProductCard**:

### Recommended Test Prompts:

#### Test 1: Gấu mật ong
- **Input**: "Bạn có gấu mật ong không ạ?"
- **Expected**: Hiển thị card cho "Gấu mật ong 700k" với ảnh, giá, kích thước, các nút hành động

#### Test 2: Gấu dưa
- **Input**: "Tôi muốn xem gấu dưa"
- **Expected**: Hiển thị card cho "Gấu dưa 10k"

#### Test 3: Multiple products
- **Input**: "Bạn có những mẫu gấu nào vậy ạ?"
- **Expected**: Hiển thị multiple product cards (Gấu dưa, Gấu mật ong, v.v.)

## Component Architecture

### ProductCard Component
- Location: `frontend/components/ProductCard.tsx`
- Features:
  - Image with hover animation
  - Price + discount badge
  - Size information (from specifications JSON)
  - Rating + sold count
  - 3 buttons: "Xem thêm" | "Mua ngay" | "Thêm giỏ"

### ProductRecommendationsGrid
- Location: `frontend/components/ai-agent/ProductRecommendationsGrid.tsx`
- Uses ProductCard component
- Responsive grid: 1 col (mobile) → 2 cols (tablet) → 3-4 cols (desktop)

### Backend Extraction
- Location: `backend/ai_agent/services.py`
- Method: `_extract_recommendations()`
- Logic:
  1. Remove markdown formatting from AI response
  2. Match product names (case-insensitive)
  3. Deduplicate by name (ưu tiên sản phẩm có giá cao hơn)
  4. Return list of recommendations with product data

## Troubleshooting

### Recommendations not showing?

1. **Check backend response**:
   ```bash
   # In backend Django shell
   python manage.py shell
   >>> from ai_agent.services import AIAgentService
   >>> service = AIAgentService()
   >>> recs = service._extract_recommendations("Gấu mật ong 700k")
   >>> len(recs)  # Should be > 0
   ```

2. **Check API response**:
   - Network tab in browser DevTools
   - Look for `/api/ai/conversations/{id}/send_message/`
   - Check if `recommendations` array is populated

3. **Check frontend logs**:
   - Open browser console (F12)
   - Look for recommendation rendering logs

## Database Seeding

If you need test products:
```bash
cd d:\TeddyShop\backend
python manage.py shell

from products.models import Product
Product.objects.create(
    name="Gấu mật ong",
    price=700000,
    status='active'
)
```

Current products in DB:
- Gấu mật ong: 700k (ID: 72) ✅
- Gấu dưa: 10k (ID: 68) ✅
- Gấu hồng nâu: 200k (ID: 71) ✅
