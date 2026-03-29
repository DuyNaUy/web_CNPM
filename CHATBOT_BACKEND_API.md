# Chatbot Backend API Documentation

## Overview
Hoàn thiện backend cho chatbot TeddyShop với 3 chức năng chính:
1. **Xem thêm** (View More) - Lấy chi tiết sản phẩm
2. **Thêm giỏ hàng** (Add to Cart) - Thêm sản phẩm vào giỏ
3. **Mua ngay** (Buy Now) - Tạo đơn hàng ngay từ chatbot

---

## Core Endpoints

### 1. Start Conversation
**Endpoint**: `POST /api/ai/conversations/start_conversation/`

**Description**: Bắt đầu phiên hội thoại mới với AI

**Request**:
```json
{}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "session_id": "session_abc123def456",
  "title": "Tư vấn bán hàng",
  "created_at": "2024-03-15T10:30:00Z",
  "updated_at": "2024-03-15T10:30:00Z",
  "is_active": true
}
```

---

### 2. Send Message
**Endpoint**: `POST /api/ai/conversations/{session_id}/send_message/`

**Description**: Gửi tin nhắn tới AI và nhận phản hồi với sản phẩm đề xuất

**Request**:
```json
{
  "message": "Tôi muốn mua gấu bông"
}
```

**Response** (200 OK):
```json
{
  "conversation_id": "session_abc123def456",
  "user_message": "Tôi muốn mua gấu bông",
  "ai_response": "Tôi có các sản phẩm phù hợp cho bạn...",
  "products": [
    {
      "id": 1,
      "name": "Gấu Teddy Xanh 30cm",
      "price": 150000,
      "image_url": "http://localhost:8000/media/products/2024/03/teddy_blue.jpg",
      "description": "Gấu bông mềm mại, dễ thương"
    }
  ]
}
```

---

### 3. Get Conversation History
**Endpoint**: `GET /api/ai/conversations/{session_id}/get_history/`

**Description**: Lấy lịch sử cuộc trò chuyện

**Response** (200 OK):
```json
{
  "conversation_id": "session_abc123def456",
  "messages": [
    {
      "role": "user",
      "content": "Tôi muốn mua gấu bông",
      "timestamp": "2024-03-15T10:31:00Z"
    },
    {
      "role": "assistant",
      "content": "Tôi có các sản phẩm phù hợp...",
      "timestamp": "2024-03-15T10:31:05Z",
      "products": [
        {
          "id": 1,
          "name": "Gấu Teddy Xanh 30cm",
          "price": 150000
        }
      ]
    }
  ]
}
```

---

## Product Action Endpoints

### 4. Get Product Details (Xem thêm)
**Endpoint**: `GET /api/ai/conversations/{session_id}/get_product_details/`

**Query Parameters**:
- `product_id` (required): ID của sản phẩm

**Description**: Lấy chi tiết đầy đủ của sản phẩm

**Request**:
```
GET /api/ai/conversations/session_abc123/get_product_details/?product_id=1
```

**Response** (200 OK):
```json
{
  "product": {
    "id": 1,
    "name": "Gấu Teddy Xanh 30cm",
    "slug": "gau-teddy-xanh-30cm",
    "category_name": "Gấu Bông",
    "price": 150000,
    "old_price": 200000,
    "discount_percentage": 25,
    "stock": 50,
    "unit": "cái",
    "rating": 4.8,
    "reviews_count": 125,
    "sold_count": 500,
    "description": "Gấu bông mềm mại, dễ thương",
    "detail_description": "Mô tả chi tiết sản phẩm...",
    "main_image_url": "http://localhost:8000/media/products/2024/03/teddy_blue.jpg",
    "images": [
      "http://localhost:8000/media/products/2024/03/teddy_blue_1.jpg",
      "http://localhost:8000/media/products/2024/03/teddy_blue_2.jpg"
    ],
    "specifications": {
      "material": "Vải cotton",
      "height": "30cm",
      "weight": "200g"
    },
    "origin": "Việt Nam",
    "guarantee": "12 tháng",
    "variants": [
      {
        "id": 1,
        "size": "30cm",
        "price": 150000,
        "stock": 25
      },
      {
        "id": 2,
        "size": "50cm",
        "price": 250000,
        "stock": 20
      }
    ],
    "in_stock": true
  }
}
```

**Error Response** (404):
```json
{
  "error": "Product not found or not active"
}
```

---

### 5. Add to Cart (Thêm giỏ hàng)
**Endpoint**: `POST /api/ai/conversations/{session_id}/add_to_cart/`

**Description**: Thêm sản phẩm vào giỏ hàng. Hỗ trợ cả authenticated users (lưu DB) và anonymous users (chỉ return product info)

**Request**:
```json
{
  "product_id": 1,
  "quantity": 1,
  "unit": "30cm"
}
```

**Response for Authenticated User** (200 OK):
```json
{
  "success": true,
  "message": "Đã thêm 1 Gấu Teddy Xanh 30cm vào giỏ hàng",
  "product_id": 1,
  "quantity": 1,
  "total_items": 5
}
```

**Response for Anonymous User** (200 OK):
```json
{
  "success": true,
  "message": "Sản phẩm đã được chọn. Vui lòng đăng nhập để hoàn tất thêm vào giỏ hàng",
  "product": {
    "id": 1,
    "name": "Gấu Teddy Xanh 30cm",
    "price": 150000,
    "quantity": 1,
    "unit": "30cm",
    "image_url": "http://localhost:8000/media/products/2024/03/teddy_blue.jpg"
  }
}
```

**Error Response** (400):
```json
{
  "error": "Số lượng tồn kho không đủ. Tồn kho: 5",
  "success": false
}
```

---

### 6. Buy Now (Mua ngay)
**Endpoint**: `POST /api/ai/conversations/{session_id}/buy_now/`

**Description**: Tạo đơn hàng ngay từ chatbot (chỉ cho authenticated users)

**Authentication**: Required (Bearer Token)

**Request**:
```json
{
  "product_id": 1,
  "quantity": 1,
  "unit": "30cm"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Đơn hàng đã được tạo",
  "order_id": 123,
  "product": "Gấu Teddy Xanh 30cm",
  "quantity": 1,
  "price": 150000,
  "total": 150000
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "Please login to use buy now feature",
  "success": false
}
```

**Error Response** (400):
```json
{
  "error": "Số lượng tồn kho không đủ",
  "success": false
}
```

---

### 7. Close Conversation
**Endpoint**: `POST /api/ai/conversations/{session_id}/close_conversation/`

**Description**: Đóng phiên hội thoại

**Response** (200 OK):
```json
{
  "message": "Conversation closed successfully"
}
```

---

## Implementation Details

### Backend Changes

#### 1. **AIAgentService** (services.py)
Added methods:
- `get_product_details(product_id)` - Lấy chi tiết sản phẩm đầy đủ
- `add_to_cart_from_chatbot(user, product_id, quantity, unit)` - Thêm vào giỏ
- `create_buy_now_order(user, product_id, quantity, unit)` - Tạo đơn hàng
- `_get_product_image_url(product)` - Helper để lấy URL hình ảnh

#### 2. **Serializers** (serializers.py)
Added:
- `ProductDetailsChatbotSerializer` - Chi tiết sản phẩm
- `ProductVariantChatbotSerializer` - Biến thể sản phẩm
- `CartItemChatbotSerializer` - Items trong giỏ hàng

#### 3. **ConversationViewSet** (views.py)
Added endpoints:
- `get_product_details()` - GET endpoint cho "Xem thêm"
- `add_to_cart()` - POST endpoint cho "Thêm giỏ hàng"
- `buy_now()` - POST endpoint cho "Mua ngay"

### Frontend Changes

#### **AIAgentChat.tsx**
Updated `ProductCard` component:
- `handleViewMore()` - Gọi `get_product_details` endpoint
- `handleAddToCart()` - Gọi `add_to_cart` endpoint
- `handleBuyNow()` - Gọi `buy_now` endpoint

---

## Error Handling

Tất cả endpoints trả về error response với status code thích hợp:

| Status Code | Meaning |
|-------------|---------|
| 200 | OK - Request thành công |
| 201 | Created - Resource tạo thành công |
| 400 | Bad Request - Tham số không hợp lệ |
| 401 | Unauthorized - Cần xác thực |
| 404 | Not Found - Resource không tồn tại |
| 500 | Internal Server Error - Lỗi server |

---

## Testing Instructions

### 1. Start Conversation
```bash
curl -X POST http://localhost:8000/api/ai/conversations/start_conversation/
```

### 2. Send Message and Get Products
```bash
curl -X POST http://localhost:8000/api/ai/conversations/{session_id}/send_message/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Tôi muốn mua gấu bông"}'
```

### 3. Get Product Details
```bash
curl http://localhost:8000/api/ai/conversations/{session_id}/get_product_details/?product_id=1
```

### 4. Add to Cart (Authenticated)
```bash
curl -X POST http://localhost:8000/api/ai/conversations/{session_id}/add_to_cart/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{"product_id": 1, "quantity": 1, "unit": "30cm"}'
```

### 5. Buy Now (Authenticated)
```bash
curl -X POST http://localhost:8000/api/ai/conversations/{session_id}/buy_now/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{"product_id": 1, "quantity": 1, "unit": "30cm"}'
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (AIAgentChat.tsx)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ProductCard Component                                       │
│  ├─ Xem thêm → get_product_details()                         │
│  ├─ Thêm giỏ hàng → add_to_cart()                            │
│  └─ Mua ngay → buy_now()                                     │
│                                                              │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP Requests
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend (Django REST)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ConversationViewSet (views.py)                              │
│  ├─ get_product_details() → AIAgentService.get_product_details() │
│  ├─ add_to_cart() → AIAgentService.add_to_cart_from_chatbot() │
│  └─ buy_now() → AIAgentService.create_buy_now_order()       │
│                                                              │
│  AIAgentService (services.py)                               │
│  ├─ get_product_details() → Product model + variants        │
│  ├─ add_to_cart_from_chatbot() → Cart/CartItem model        │
│  └─ create_buy_now_order() → Order/OrderItem model          │
│                                                              │
│  Serializers (serializers.py)                               │
│  ├─ ProductDetailsChatbotSerializer                         │
│  ├─ ProductVariantChatbotSerializer                         │
│  └─ CartItemChatbotSerializer                               │
│                                                              │
└──────────────────┬──────────────────────────────────────────┘
                   │ Database Operations
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Database (PostgreSQL/SQLite)                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ├─ products_product                                        │
│  ├─ products_productvariant                                 │
│  ├─ orders_cart                                             │
│  ├─ orders_cartitem                                         │
│  └─ orders_order                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Checklist

- [x] Add `get_product_details()` endpoint
- [x] Add `add_to_cart()` endpoint
- [x] Add `buy_now()` endpoint
- [x] Create `ProductDetailsChatbotSerializer`
- [x] Update `AIAgentService` with new methods
- [x] Update `ProductCard` component to call new endpoints
- [x] Add error handling and validation
- [x] Support for anonymous users in add_to_cart
- [x] Authentication required for buy_now
- [ ] API testing & documentation review
- [ ] Frontend testing with real chatbot
- [ ] Production deployment

---

## Notes

1. **Anonymous User Support**: `add_to_cart` endpoint hỗ trợ cả authenticated và anonymous users. Anonymous users sẽ nhận lại product info để frontend xử lý.

2. **Stock Validation**: Tất cả endpoints kiểm tra tồn kho trước khi thêm vào giỏ hoặc tạo đơn hàng.

3. **Product Status**: Chỉ sản phẩm có status='active' mới được hiển thị.

4. **Image Handling**: URL hình ảnh được xử lý tự động (thêm base URL nếu cần).

5. **Variant Support**: Hỗ trợ sản phẩm có biến thể (size/unit khác nhau).

---

## Future Enhancements

1. Thêm endpoint quản lý cart cho anonymous users
2. Thêm wishlist functionality
3. Thêm product comparison
4. Thêm recent views tracking
5. Tích hợp promotion/discount logic vào add_to_cart
