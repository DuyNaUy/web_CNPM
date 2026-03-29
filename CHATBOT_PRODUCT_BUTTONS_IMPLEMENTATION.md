# Chatbot Product Buttons Implementation Guide

## Overview
Đã hoàn tất tích hợp các chức năng **"Xem thêm"**, **"Thêm giỏ hàng"**, **"Mua ngay"** cho sản phẩm trong chatbox. Ba nút này hoạt động giống như ở ProductCard component và không ảnh hưởng đến bất kì trang nào.

## 🆕 Updates (v2)

### Auto-Start Conversation
- ✅ Conversation tự động bắt đầu khi vào chatbot
- ✅ Không cần click "Bắt đầu" button
- ✅ Lưu sessionID vào localStorage để sử dụng lại

### Fallback Mode (No API Keys Required)
- ✅ Hoạt động mà không cần Gemini hay OpenAI API keys
- ✅ Tự động tìm kiếm sản phẩm dựa trên keywords từ user message
- ✅ Trả về top products nếu không tìm được keywords
- ✅ All 3 buttons (Xem thêm, Thêm giỏ, Mua ngay) vẫn hoạt động

### Console Debugging
- ✅ Chi tiết logs để track mọi step
- ✅ Dễ debug khi có vấn đề
- ✅ Logs format: `[ComponentName] Action: Details`

## Architecture

### Frontend Components
**File**: `frontend/components/ai-agent/AIAgentChat.tsx`

Component `ProductCard` yêu cầu các prop:
- `product: Product` - Thông tin sản phẩm từ API
- `conversationId: string` - ID phiên hội thoại (để gọi API)

```typescript
interface Product {
  id: number;
  name: string;
  image_url?: string;
  price?: number;
  description?: string;
  quantity?: number;
}
```

### Backend API Endpoints
**Base URL**: `/api/ai/conversations/{conversationId}/`

#### 1. **Xem thêm** (View Details)
```
GET /api/ai/conversations/{conversationId}/get_product_details/?product_id={id}
```

**Response**:
```json
{
  "product": {
    "id": 123,
    "name": "Gấu bông...",
    "slug": "gau-bong-...",
    "category": "...",
    "price": 150000,
    "old_price": 200000,
    "discount_percentage": 25,
    "stock": 50,
    "rating": 4.5,
    "reviews_count": 100,
    "sold_count": 1500,
    "description": "...",
    "detail_description": "...",
    "main_image_url": "...",
    "images": [...],
    "specifications": {...},
    "variants": [...],
    "in_stock": true
  }
}
```

#### 2. **Thêm giỏ hàng** (Add to Cart)
```
POST /api/ai/conversations/{conversationId}/add_to_cart/
Content-Type: application/json

{
  "product_id": 123,
  "quantity": 1,
  "unit": ""
}
```

**Response** (Authenticated User):
```json
{
  "success": true,
  "message": "Đã thêm 1 product_name vào giỏ hàng",
  "product_id": 123,
  "quantity": 1,
  "total_items": 5
}
```

**Response** (Anonymous User):
```json
{
  "success": true,
  "message": "Sản phẩm đã được chọn. Vui lòng đăng nhập để hoàn tất thêm vào giỏ hàng",
  "product": {
    "id": 123,
    "name": "...",
    "price": 150000,
    "quantity": 1,
    "unit": "",
    "image_url": "..."
  }
}
```

#### 3. **Mua ngay** (Buy Now)
```
POST /api/ai/conversations/{conversationId}/buy_now/
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "product_id": 123,
  "quantity": 1,
  "unit": ""
}
```

**Requirements**: Phải đăng nhập (authenticated user required)

**Response**:
```json
{
  "success": true,
  "message": "Sản phẩm \"product_name\" đã được thêm vào giỏ hàng. Vui lòng tiếp tục để thanh toán.",
  "product_id": 123,
  "product_name": "...",
  "quantity": 1,
  "total_items": 5,
  "redirect_to_checkout": true
}
```

## Button Behaviors

### 1. Xem thêm Button
- **Action**: Gọi `get_product_details` endpoint
- **Navigation**: Redirect tới `/customer/products/{slug}`
- **Data**: Lưu thông tin sản phẩm nếu cần
- **Không yêu cầu**: Đăng nhập

### 2. Thêm vào Giỏ Button
- **Action**: Gọi `add_to_cart` endpoint
- **Success**: Hiển thị toast success message
- **For Authenticated**: Thêm vào user's cart
- **For Anonymous**: Gợi ý đăng nhập (optional)
- **Total Items**: Cập nhật số lượng items trong giỏ

### 3. Mua Ngay Button
- **Action**: Gọi `buy_now` endpoint
- **Requirement**: Phải đăng nhập (required authentication)
- **Process**: Thêm vào cart → redirect to checkout
- **Navigation**: `/customer/checkout`
- **Behavior**: Giống như "Thêm vào giỏ" + automatic redirect

## Isolation & Safety

### Namespace Isolation
- Tất cả endpoints đều dưới `/api/ai/conversations/`
- Không ảnh hưởng đến endpoints về product, order, cart pages
- Không change existing cart/order logic

### Data Integrity
- Cả ba nút đều sử dụng cùng **Cart model** (chính xác)
- "Mua ngay" không tạo Order không hoàn chỉnh (đã fix)
- Tất cả operations kiểm tra stock trước khi add

### User Scenarios
| Action | Authenticated | Anonymous | Behavior |
|--------|---------------|-----------|----------|
| Xem thêm | ✅ | ✅ | Redirect to product page |
| Thêm giỏ | ✅ Add to cart | ℹ️ Show message | Add to user's cart / Show login suggestion |
| Mua ngay | ✅ Add + Redirect | ❌ Error | Add to cart + redirect to checkout / Show login message |

## Implementation Details

### Backend Service Layer
**File**: `backend/ai_agent/services.py`

#### Method: `get_product_details(product_id: int)`
- Lấy tất cả thông tin chi tiết sản phẩm
- Include: images, specifications, variants, ratings, stock status
- Format: Compatible with product detail page

#### Method: `add_to_cart_from_chatbot(user, product_id, quantity, unit)`
- Add item to user's cart (Cart model)
- Handle variants/sizes
- Return total items in cart
- Support both authenticated and anonymous users

#### Method: `create_buy_now_order(user, product_id, quantity, unit)`
- **Previous**: Created incomplete Order (missing required fields)
- **Current**: Adds to cart + returns redirect flag
- Reason: Order requires address info, can't be filled from chatbot
- User completes checkout on checkout page

### Frontend Integration
**File**: `frontend/components/ai-agent/AIAgentChat.tsx`

#### Handler: `handleViewMore()`
```typescript
- Calls: GET /api/ai/conversations/{id}/get_product_details/?product_id={id}
- Success: Navigate to product page
- Error: Show alert message
```

#### Handler: `handleAddToCart()`
```typescript
- Calls: POST /api/ai/conversations/{id}/add_to_cart/
- Body: {product_id, quantity, unit}
- Success: Show toast "Added to cart"
- Error: Show alert with error message
- Status Code: 200/400
```

#### Handler: `handleBuyNow()`
```typescript
- Requires: access_token in localStorage
- If not logged in: Redirect to /auth/login
- If logged in:
  - Calls: POST /api/ai/conversations/{id}/buy_now/
  - Success: Show message + check redirect_to_checkout flag
  - If redirect: Navigate to /customer/checkout
- Error: Show alert message
```

## Error Handling

### Product Not Found
```json
{
  "error": "Sản phẩm không tồn tại",
  "success": false
}
```

### Out of Stock
```json
{
  "error": "Số lượng tồn kho không đủ. Tồn kho: 10",
  "success": false
}
```

### Invalid Product ID
```json
{
  "error": "Invalid product_id",
  "success": false
}
```

### Not Authenticated (Buy Now Only)
```json
{
  "error": "Please login to use buy now feature",
  "success": false
}
HTTP: 401 Unauthorized
```

### Server Error
```json
{
  "error": "Error fetching product: ...",
  "success": false
}
HTTP: 500 Internal Server Error
```

## Testing Checklist

- [ ] Xem thêm: Non-authenticated user can view product details
- [ ] Thêm giỏ: Authenticated user adds to cart successfully
- [ ] Thêm giỏ: Anonymous user sees login message
- [ ] Mua ngay: Authenticated user can proceed to checkout
- [ ] Mua ngay: Non-authenticated user sees login prompt
- [ ] Stock check: Cannot add when stock is insufficient
- [ ] Variants: Can select size/unit properly
- [ ] No interference: Regular product/cart pages work normally
- [ ] Cart consistency: Items added from chatbot appear in cart page
- [ ] Duplicate items: Multiple adds of same product increase quantity
- [ ] Error handling: All errors display proper messages

## Configuration

### No Additional Configuration Required
- API URLs: Auto-detected from `NEXT_PUBLIC_API_URL` env var
- Auth: Uses existing access token from localStorage
- Cart model: Uses existing Cart/CartItem models
- Order model: Uses existing Order model (no changes needed)

### Environment Variables (Already Configured)
```bash
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
```

## Future Enhancements

1. **Quantity Selection**: Allow user to select quantity before add to cart
2. **Size Selection**: Show variant selector if product has sizes
3. **Real-time Stock Updates**: Check stock before each action
4. **Cart Preview**: Show mini cart with item count
5. **Wishlist**: Add to wishlist button
6. **Product Comparison**: Compare multiple products from chat
7. **Batch Add**: Add multiple products at once
8. **Quick Checkout**: Complete checkout without leaving chat

## Troubleshooting

### Issue: "Product not found" error
**Solution**: Ensure product has `status='active'` in database

### Issue: Cart items not appearing
**Solution**: Check if user is authenticated, ensure Cart model integrity

### Issue: Buy Now redirect not working
**Solution**: Verify `redirect_to_checkout` flag is being checked in frontend

### Issue: Stock validation failing
**Solution**: Ensure Product.stock is updated correctly, check variant stock too

## References

- API Endpoints: [ai_agent/views.py](backend/ai_agent/views.py)
- Service Logic: [ai_agent/services.py](backend/ai_agent/services.py)
- URL Config: [ai_agent/urls.py](backend/ai_agent/urls.py)
- Frontend Component: [AIAgentChat.tsx](frontend/components/ai-agent/AIAgentChat.tsx)
- Cart Model: [orders/models.py](backend/orders/models.py)
