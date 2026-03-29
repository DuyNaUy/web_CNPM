# AI Agent Tư vấn bán hàng - Hướng dẫn sử dụng

## Tổng quan

Hệ thống AI Agent tư vấn bán hàng cho phép:
- **Tư vấn thông minh**: Khách hàng chat với AI để tìm sản phẩm phù hợp
- **Đề xuất sản phẩm**: AI tự động đề xuất sản phẩm dựa trên nhu cầu
- **Tạo đơn hàng tự động**: Chuyển đổi sản phẩm được đề xuất thành đơn hàng

## Kiến trúc

### Backend (Django)

#### App: `ai_agent`

**Models:**
- `ConversationSession`: Lưu trữ các phiên hội thoại
- `AIRecommendation`: Lưu trữ các sản phẩm được đề xuất
- `AutomatedOrder`: Lưu trữ các đơn hàng nháp được tạo từ AI

**Services:**
- `AIAgentService`: Service chính cho AI Agent
  - `start_conversation()`: Bắt đầu phiên hội thoại
  - `chat()`: Tương tác với AI
  - `create_order_from_recommendations()`: Tạo draft order

**API Endpoints:**

```
POST   /api/ai/conversations/start_conversation/
  → Bắt đầu phiên hội thoại mới
  Response: { id, session_id, title, created_at, ... }

POST   /api/ai/conversations/{id}/send_message/
  → Gửi message tới AI
  Body: { message: str }
  Response: { response, recommendations, should_create_order }

GET    /api/ai/conversations/{id}/get_history/
  → Lấy lịch sử hội thoại
  Response: { messages[], recommendations[] }

POST   /api/ai/conversations/{id}/close_conversation/
  → Đóng phiên hội thoại

POST   /api/ai/orders/create_from_recommendations/
  → Tạo automated order từ recommendations
  Body: { conversation_id, product_ids[], quantities{}, full_name, phone, email, address, city, district }

POST   /api/ai/orders/{id}/confirm_and_create/
  → Xác nhận draft order và tạo đơn hàng thực tế
  Body: { payment_method }
  Response: { order_code, order_id }

POST   /api/ai/orders/{id}/cancel/
  → Hủy automated order
```

### Frontend (React/Next.js)

#### Components:

1. **AIAgentChat** (`AIAgentChat.tsx`)
   - Component chính cho chat interface
   - Props: `conversationId`, `onRecommendationsReceived`
   - Hiển thị: Messages (các đề xuất giờ được chèn trực tiếp vào nội dung trả lời của AI; hình ảnh sẽ được hiển thị ngay trong bubble, URL tự động đổi thành đường dẫn đầy đủ)

2. **OrderPreview** (`OrderPreview.tsx`)
   - Xem trước đơn hàng trước khi xác nhận
   - Props: `items[]`, `estimatedTotal`, `onConfirm`, `onCancel`

3. **AIAgentConsole** (`AIAgentConsole.tsx`)
   - Component bao quanh, quản lý flow toàn bộ

## Cài đặt

### 1. Backend Setup

```bash
# 1. Cấu hình Environment
# Thêm vào .env hoặc settings:
OPENAI_API_KEY=sk-xxxx... (optional)

# 2. Chạy migrations
cd backend
python manage.py makemigrations ai_agent
python manage.py migrate ai_agent

# 3. Khởi động server
python manage.py runserver
```

### 2. Frontend Setup

```bash
# Components đã được tạo sẵn
# Dùng trong trang admin hoặc customer:

import { AIAgentConsole } from '@/components/ai-agent'

export default function AIAgentPage() {
  const userId = 1; // Get from auth
  return <AIAgentConsole userId={userId} />
}
```

## Cách sử dụng

### Cho khách hàng (End-user):

1. Mở trang AI Agent Tư vấn
2. Nhấn "Bắt đầu tư vấn"
3. Chat với AI về nhu cầu sản phẩm
4. AI sẽ đề xuất sản phẩm ngay trong tin nhắn (không còn khối riêng)
5. Nhấn "Tạo đơn hàng từ đề xuất"
6. Xem trước và xác nhận
7. Chọn phương thức thanh toán
8. Đơn hàng được tạo thành công

### Cho admin:

1. Vào Django Admin
2. Xem "AI Agent Tư vấn" -> "Phiên hội thoại AI"
3. Xem lịch sử hội thoại của khách hàng
4. Xem "Đề xuất sản phẩm AI"
5. Xem "Đơn hàng tự động AI"

## Tích hợp OpenAI (Tùy chọn)

### Nếu muốn dùng OpenAI API:

1. **Cài đặt**:
```bash
pip install openai
```

2. **Thêm API Key**:
```
# .env hoặc settings
OPENAI_API_KEY=sk-your-key-here
```

3. **Service sẽ tự động**:
   - Gọi OpenAI API khi có key
   - Fallback về logic đơn giản nếu không có key (trả về các khuyến nghị có kèm giá, hình ảnh, tên)

### Model được dùng:
- `gpt-3.5-turbo` (mặc định)
- `gpt-4` (có thể thay đổi trong `AIAgentService.__init__`)

## Fallback Logic (Không cần OpenAI)

Nếu không có OpenAI API Key, system sẽ:
1. Parse keywords từ user message
2. Match với tên sản phẩm trong DB
3. Đề xuất sản phẩm matching + top-selling products
4. Tính confidence score tự động

## Mở rộng

### Thêm LLM khác (Gemini, Claude, etc.):

```python
# Trong ai_agent/services.py
class AIAgentService:
    def _call_custom_llm(self, messages):
        # Implement logic cho LLM khác
        pass
```

### Cải thiện recommendations:

```python
# Trong ai_agent/services.py
def _match_keywords_to_products(self, user_message):
    # Thêm logic ML/NLP phức tạp hơn
    # Ví dụ: TF-IDF, similarity matching, etc.
    pass
```

### Webhook cho order confirmation:

```python
# Trong ai_agent/views.py
@action(detail='order_id', methods=['post'])
def confirm_and_create(self, request, pk=None):
    # Thêm webhook call tới payment gateway
    # Hoặc notification service
    pass
```

## Troubleshooting

### 1. API endpoint không tìm thấy
- Chắc chắn `ai_agent` được thêm vào `INSTALLED_APPS`
- Check `backend/urls.py` có import `ai_agent.urls`

### 2. Database errors
```bash
python manage.py makemigrations ai_agent
python manage.py migrate ai_agent
```

### 3. CORS errors
- Check `django-cors-headers` config

### 4. OpenAI API errors
- Kiểm tra `OPENAI_API_KEY` trong environment
- System sẽ tự fallback nếu lỗi

## API Examples

### Start conversation
```bash
curl -X POST http://localhost:8000/api/ai/conversations/start_conversation/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send message
```bash
curl -X POST http://localhost:8000/api/ai/conversations/session_xxxxx/send_message/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Tôi muốn mua gấu bông cho con gái"}'
```

### Create order
```bash
curl -X POST http://localhost:8000/api/ai/orders/session_xxxxx/confirm_and_create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method": "cod"}'
```

## Notes

- Tất cả endpoints đều yêu cầu authentication (JWT token)
- Phiên hội thoại được lưu trữ lâu dài trong DB
- Recommendation confidence score: 0-1 (1 = highest confidence)
- Auto-created orders có status 'draft' - cần confirm mới tạo Order thực
- Order items được thêm vào Cart của user

## Future Enhancements

- [ ] Thêm sentiment analysis
- [ ] Integration với recommendation engine (collaborative filtering)
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] A/B testing AI responses
- [ ] Webhook integration
- [ ] Real-time notification
- [ ] Order history analysis
