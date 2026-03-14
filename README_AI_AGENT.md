# 🎉 AI Agent Tư vấn bán hàng - TeddyShop

## 📋 Tổng quan

Hệ thống AI Agent tư vấn bán hàng và tự động tạo đơn hàng cho TeddyShop.

**Tính năng chính:**
- 🤖 Chat với AI để tư vấn sản phẩm
- 💡 AI đề xuất sản phẩm thông minh
- 📦 Tự động tạo đơn hàng từ đề xuất
- 💾 Lưu lịch sử hội thoại
- 📊 Admin dashboard để quản lý

## 🚀 Quick Start

### Option 1: Automatic Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
bash setup.sh
```

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate ai_agent
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📖 Documentation

| Document | Mô tả |
|----------|-------|
| [AI_AGENT_SUMMARY.md](AI_AGENT_SUMMARY.md) | **Tóm tắt toàn bộ** - Đọc đây trước |
| [SETUP_AI_AGENT.md](SETUP_AI_AGENT.md) | Hướng dẫn cài đặt chi tiết + Troubleshooting |
| [AI_AGENT_GUIDE.md](AI_AGENT_GUIDE.md) | Tài liệu API + Kiến trúc + Mở rộng |
| [API_TESTING.md](API_TESTING.md) | Postman/cURL examples + Testing |
| [README.md](README.md) | Project setup gốc |

## 🎯 Sử dụng

### Cho Khách hàng
1. Đi tới: `http://localhost:3000/customer/ai-agent`
2. Nhấn "Bắt đầu tư vấn"
3. Chat với AI
4. Nhấn "Tạo đơn hàng từ đề xuất"
5. Xác nhận thông tin
6. Done! ✓

### Cho Admin
1. Vào Django Admin: `http://localhost:8000/admin`
2. Tìm "AI Agent Tư vấn"
3. Quản lý conversations, recommendations, orders

## 🔧 Setup Environment

### Backend (.env)
```env
OPENAI_API_KEY=sk-your-key-here  # Optional
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=web_teddy_db
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📁 File Structure

**Backend (New):**
```
backend/
├── ai_agent/
│   ├── migrations/0001_initial.py
│   ├── models.py           # ConversationSession, AIRecommendation, AutomatedOrder
│   ├── services.py         # AIAgentService
│   ├── views.py            # API endpoints
│   ├── serializers.py
│   ├── admin.py
│   └── urls.py
├── settings.py             # ✏️ Updated
└── urls.py                 # ✏️ Updated
```

**Frontend (New):**
```
frontend/
├── components/ai-agent/
│   ├── AIAgentChat.tsx
│   ├── AIAgentConsole.tsx
│   ├── OrderPreview.tsx
│   └── *.module.css
└── app/(main)/customer/ai-agent/
    └── page.tsx
```

## 🔐 API Endpoints

```
POST   /api/ai/conversations/start_conversation/
POST   /api/ai/conversations/{id}/send_message/
GET    /api/ai/conversations/{id}/get_history/
POST   /api/ai/conversations/{id}/close_conversation/
POST   /api/ai/orders/{id}/confirm_and_create/
POST   /api/ai/orders/{id}/cancel/
```

[Xem tất cả examples →](API_TESTING.md)

## 🤖 AI Features

### Với OpenAI API:
- Model: `gpt-3.5-turbo`
- Context: Lịch sử chat + danh sách sản phẩm
- Language: Tiếng Việt

### Fallback (Không cần API):
- Keyword matching
- Top-selling products
- Confidence scoring

## ✨ Highlight

| Tính năng | Chi tiết |
|----------|---------|
| **Authentication** | JWT tokens, user-specific access |
| **Database** | Conversation context saved as JSON |
| **UI/UX** | Responsive, animated, professional |
| **Performance** | Optimized queries, async-ready |
| **Error Handling** | Proper error messages, fallback logic |
| **Testing** | Unit tests included |
| **Documentation** | Comprehensive guides |

## 📦 Dependencies

**Backend:**
- Django 5.0+
- Django REST Framework
- OpenAI (optional)
- requests

**Frontend:**
- React 18+
- Next.js
- CSS Modules

## ⚙️ Configuration

### OpenAI Setup (Optional)

1. Get API key: https://platform.openai.com/api-keys
2. Add to .env: `OPENAI_API_KEY=sk-xxxx`
3. System automatically uses it if available

### Custom AI Prompt

Edit `backend/ai_agent/services.py`:
```python
self.system_prompt = """Your custom prompt here..."""
```

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
python manage.py test ai_agent
```

### Test API with cURL
```bash
# Get token
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'

# Start conversation
curl -X POST http://localhost:8000/api/ai/conversations/start_conversation/ \
  -H "Authorization: Bearer TOKEN"
```

[Xem tất cả test examples →](API_TESTING.md)

## 🔄 Workflow

```
User Message
    ↓
AI Processing (OpenAI or fallback)
    ↓
Parse Recommendations
    ↓
Return Response + Products
    ↓
User Review Products
    ↓
User Click "Create Order"
    ↓
Confirm Order Details
    ↓
Create Draft Order
    ↓
User Confirm + Choose Payment
    ↓
Create Real Order
    ↓
Order Complete ✓
```

## 🚨 Common Issues

| Issue | Fix |
|-------|-----|
| `Module not found: ai_agent` | Run `python manage.py migrate ai_agent` |
| API returns 401 | Check JWT token validity |
| Empty AI response | Check OPENAI_API_KEY or use fallback |
| CORS errors | Check CORS_ALLOWED_ORIGINS |

[Troubleshooting Guide →](SETUP_AI_AGENT.md)

## 🎓 Learning Path

1. **Read First:** [AI_AGENT_SUMMARY.md](AI_AGENT_SUMMARY.md) (5 min)
2. **Setup:** [SETUP_AI_AGENT.md](SETUP_AI_AGENT.md) (10 min)
3. **Understand API:** [API_TESTING.md](API_TESTING.md) (5 min)
4. **Deep Dive:** [AI_AGENT_GUIDE.md](AI_AGENT_GUIDE.md) (15 min)
5. **Code Explore:** Check `backend/ai_agent/` folder

## 🔮 Future Enhancements

- [ ] Real-time WebSocket chat
- [ ] Advanced ML recommendations
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Custom AI prompt builder (Admin UI)
- [ ] Webhook integrations
- [ ] Voice chat support

## 🤝 Contributing

1. Code adalah clean, well-documented
2. Follow existing patterns
3. Add tests cho features mới
4. Update documentation

## 📝 Notes

- ✅ Không thay đổi code hiện tại
- ✅ Backward compatible
- ✅ Easy to disable (just remove from INSTALLED_APPS)
- ✅ Database agnostic (works with MySQL, PostgreSQL, etc.)

## 📞 Support

**Need Help?**
1. Check relevant documentation
2. Review error logs
3. Test with cURL/Postman
4. Check environment variables

## 🎉 You're All Set!

```bash
# Start servers
cd backend && python manage.py runserver
cd frontend && npm run dev

# Go to
http://localhost:3000/customer/ai-agent

# Enjoy! 🚀
```

---

**Made with ❤️ for TeddyShop**

Last Updated: 2024-01-20
Version: 1.0.0
