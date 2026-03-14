# Setup Guide - AI Agent Integration

## Bước 1: Cài đặt Dependencies (Backend)

```bash
cd backend
pip install -r requirements.txt
```

Requirements đã được cập nhật bao gồm:
- `openai>=0.27.0` (tùy chọn, nếu muốn dùng OpenAI)
- `requests>=2.31.0` (đã có)

## Bước 2: Database Migration

```bash
cd backend
python manage.py makemigrations ai_agent
python manage.py migrate
```

## Bước 3: Khởi động Django Server

```bash
cd backend
python manage.py runserver 8000
```

Server sẽ chạy tại: `http://localhost:8000`

## Bước 4: (Tùy chọn) OpenAI Setup

Nếu muốn sử dụng OpenAI API:

### A. Tạo API Key
1. Đến https://platform.openai.com/api-keys
2. Tạo mới API key
3. Copy key

### B. Cấu hình Environment
Tạo/cập nhật `.env` trong thư mục `backend/`:

```
OPENAI_API_KEY=sk-your-actual-key-here
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=web_teddy_db
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
```

Hoặc thêm vào `backend/backend/settings.py`:

```python
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
```

### C. Test API
```bash
# Test imports
python manage.py shell
>>> from ai_agent.services import AIAgentService
>>> service = AIAgentService()
>>> print(service.api_key)  # Should print your key
```

## Bước 5: Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## Bước 6: Tạo SuperUser (Để vào Admin)

```bash
cd backend
python manage.py createsuperuser
# Nhập username, email, password
```

Vào admin tại: `http://localhost:8000/admin`

## Testing

### Postman/cURL Test

#### 1. Get JWT Token
```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### 2. Start Conversation
```bash
curl -X POST http://localhost:8000/api/ai/conversations/start_conversation/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "id": 1,
  "session_id": "session_abc123xyz",
  "title": "Tư vấn bán hàng",
  "created_at": "2024-01-20T10:00:00Z",
  "is_active": true,
  "recommendations": []
}
```

#### 3. Send Message
```bash
curl -X POST http://localhost:8000/api/ai/conversations/1/send_message/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tôi muốn mua gấu bông cho con gái 5 tuổi"
  }'
```

Response:
```json
{
  "conversation_id": "session_abc123xyz",
  "user_message": "Tôi muốn mua gấu bông cho con gái 5 tuổi",
  "ai_response": "Tuyệt vời! Dựa trên tuổi của con gái bạn...",
  "recommendations": [
    {
      "product_id": 1,
      "reason": "Phù hợp với lứa tuổi...",
      "quantity": 1,
      "confidence": 0.85
    }
  ],
  "should_create_order": false
}
```

#### 4. Get Conversation History
```bash
curl -X GET http://localhost:8000/api/ai/conversations/1/get_history/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 5. Create Order
```bash
curl -X POST http://localhost:8000/api/ai/orders/1/confirm_and_create/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "cod"
  }'
```

Response:
```json
{
  "message": "Order created successfully",
  "order_code": "ORD-ABC12345",
  "order_id": 5
}
```

## Frontend Integration

### Example Usage
```tsx
// pages/ai-agent.tsx
import { AIAgentConsole } from '@/components/ai-agent'

export default function AIAgentPage() {
  return <AIAgentConsole userId={1} />
}
```

### Routes to Add (Next.js)
```
/app/(main)/ai-agent/page.tsx
/app/(main)/ai-agent/layout.tsx
```

### Environment Variables (Frontend)
Create/update `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Troubleshooting

### 1. CORS Error
**Problem**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
```python
# backend/backend/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### 2. Database Error
**Problem**: `table ai_agent_conversationsession doesn't exist`

**Solution**:
```bash
python manage.py migrate ai_agent
```

### 3. Import Error
**Problem**: `ModuleNotFoundError: No module named 'openai'`

**Solution**:
```bash
pip install openai
```

Or run without OpenAI (system will fallback automatically).

### 4. Authentication Error
**Problem**: `Authorization header missing`

**Solution**: Make sure to include token in headers:
```
Authorization: Bearer YOUR_TOKEN
```

### 5. Chat Returns Empty
**Problem**: AI response is empty or `""`

**Solution**: 
- Check OPENAI_API_KEY is set correctly
- System should fallback to simple keyword matching
- Check console logs for errors

## Project Structure

```
TeddyShop/
├── backend/
│   ├── ai_agent/                    # NEW App
│   │   ├── migrations/
│   │   │   └── 0001_initial.py
│   │   ├── models.py                # ConversationSession, AIRecommendation, AutomatedOrder
│   │   ├── serializers.py           # API Serializers
│   │   ├── views.py                 # API Views
│   │   ├── services.py              # AI Agent Logic
│   │   ├── urls.py                  # Routes
│   │   ├── admin.py                 # Admin Interface
│   │   ├── apps.py                  # App Config
│   │   └── tests.py
│   ├── backend/
│   │   ├── settings.py              # UPDATED: Added ai_agent
│   │   └── urls.py                  # UPDATED: Added ai_agent routes
│   ├── requirements.txt              # UPDATED: Added openai
│   └── manage.py
└── frontend/
    └── components/
        └── ai-agent/               # NEW Components
            ├── AIAgentChat.tsx
            ├── AIAgentChat.module.css
            ├── AIAgentConsole.tsx
            ├── AIAgentConsole.module.css
            ├── OrderPreview.tsx
            ├── OrderPreview.module.css
            └── index.ts
```

## Next Steps

1. ✅ Backend setup complete
2. ✅ Frontend components ready
3. ⬜ Add AI Agent page to your routing
4. ⬜ Test with sample products
5. ⬜ (Optional) Setup OpenAI API
6. ⬜ (Optional) Customize AI prompts
7. ⬜ (Optional) Add analytics/logging

## Useful Commands

```bash
# Backend
cd backend
python manage.py runserver               # Start server
python manage.py makemigrations          # Create migrations
python manage.py migrate                 # Apply migrations
python manage.py shell                   # Python shell
python manage.py test ai_agent           # Run tests

# Frontend
cd frontend
npm run dev                               # Start dev server
npm run build                             # Build for production
npm test                                  # Run tests
```

## Support

For issues or questions:
1. Check [AI_AGENT_GUIDE.md](AI_AGENT_GUIDE.md)
2. Review error logs
3. Check Postman/cURL test results
4. Verify environment variables

---

**Chúc mừng! Bạn đã cài đặt thành công AI Agent tư vấn bán hàng.**
