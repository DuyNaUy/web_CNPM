# 🔍 Chatbot Implementation - Quick Reference

## 📁 File Organization & Quick Links

### Backend Files (Python/Django)

```
AI AGENT APP - backend/ai_agent/
│
├── models.py ✅
│   ├── ConversationSession        - Chat session storage
│   ├── AIRecommendation           - Product recommendations
│   └── AutomatedOrder             - Draft orders
│
├── services.py ✅ (Core Logic)
│   └── AIAgentService
│       ├── start_conversation()   - Create new chat
│       ├── chat()                 - Main AI interaction
│       ├── _call_gemini_api()     - Google Gemini integration
│       ├── _call_openai_api()     - OpenAI integration  
│       └── get_products_context() - Build product info
│
├── views.py ✅ (API Endpoints)
│   ├── ConversationViewSet
│   │   ├── start_conversation     - POST /api/ai/conversations/start_conversation/
│   │   ├── send_message           - POST /api/ai/conversations/{id}/send_message/
│   │   ├── get_history            - GET  /api/ai/conversations/{id}/get_history/
│   │   └── close_conversation     - POST /api/ai/conversations/{id}/close_conversation/
│   │
│   └── AutomatedOrderViewSet
│       ├── collect_address        - POST /api/ai/orders/{id}/collect_address/
│       └── confirm_and_create     - POST /api/ai/orders/{id}/confirm_and_create/
│
├── serializers.py ✅
│   ├── ConversationSessionSerializer
│   ├── ConversationSessionAdminSerializer
│   ├── AIRecommendationSerializer
│   ├── AutomatedOrderSerializer
│   └── AutomatedOrderCreateSerializer
│
├── urls.py ✅
│   └── Router setup for /api/ai/
│
├── admin.py ✅
│   ├── ConversationSessionAdmin
│   ├── AIRecommendationAdmin
│   └── AutomatedOrderAdmin
│
├── apps.py
├── tests.py
└── migrations/
    └── (auto-generated)


MAIN PROJECT CONFIG - backend/backend/
│
└── settings.py ✅ (Lines 248-249)
    ├── GEMINI_API_KEY = config('GEMINI_API_KEY', default='')
    └── OPENAI_API_KEY = config('OPENAI_API_KEY', default='')
```

### Frontend Files (TypeScript/React)

```
AI AGENT COMPONENTS - frontend/components/ai-agent/
│
├── AIAgentChat.tsx ✅ (Main chat interface)
│   ├── Message history display
│   ├── Product recommendations
│   ├── Quick action buttons
│   └── Auto-scrolling to latest message
│
├── AIAgentConsole.tsx ✅ (Wrapper & flow control)
│   ├── Session management
│   ├── Order creation flow
│   └── API call orchestration
│
├── OrderPreview.tsx ✅ (Order summary screen)
│   ├── Item list
│   ├── Price calculation
│   └── Confirm/Cancel buttons
│
├── AddressFormChat.tsx ✅ (Delivery info collection)
│   ├── Form fields (name, phone, email, address)
│   ├── City/District selectors
│   └── Payment method selection
│
├── ProductRecommendationCard.tsx ✅ (Single product card)
│   ├── Image display
│   ├── Name & price
│   ├── Recommendation reason
│   ├── Confidence score
│   └── Quantity selector
│
├── ProductRecommendationsGrid.tsx ✅ (Product grid)
│   └── Responsive grid layout for cards
│
├── index.ts ✅ (Barrel exports)
│   └── Exports all components
│
└── *.module.css 
    └── Component-scoped styles
```

---

## 🔗 API Endpoints Map

### Conversation Endpoints
```
START NEW CHAT
POST /api/ai/conversations/start_conversation/
└─ Returns: {session_id, title, created_at, ...}

SEND MESSAGE & GET AI RESPONSE
POST /api/ai/conversations/{session_id}/send_message/
Body: {"message": "User message here"}
└─ Returns: {ai_response, recommendations[], cart[], should_create_order}

GET CHAT HISTORY
GET /api/ai/conversations/{session_id}/get_history/
└─ Returns: {messages[], recommendations[]}

CLOSE CONVERSATION
POST /api/ai/conversations/{session_id}/close_conversation/
└─ Returns: {message: "Conversation closed successfully"}
```

### Order Endpoints
```
CREATE DRAFT ORDER
POST /api/ai/orders/
Body: {conversation_id, suggested_products[], estimated_total, ...}
└─ Returns: {id, status: "draft", ...}

COLLECT ADDRESS INFO
POST /api/ai/orders/{id}/collect_address/
Body: {full_name, phone, email, address, city, district}
└─ Returns: {message, order_id, status: "confirmed"}

CONFIRM & CREATE REAL ORDER
POST /api/ai/orders/{id}/confirm_and_create/
Body: {payment_method: "cod" | "momo"}
└─ Returns: {order_code, order_id, status: "created"}

CANCEL DRAFT ORDER
POST /api/ai/orders/{id}/cancel/
└─ Returns: {message: "Order cancelled"}
```

---

## 🤖 AI Integration

### API Priority Order
```
1️⃣ Gemini API (google.genai)
   ├─ Model: gemini-2.5-flash
   ├─ Supports: Multi-item checkout JSON blocks
   └─ Env: GEMINI_API_KEY

2️⃣ OpenAI API (fallback)
   ├─ Model: gpt-3.5-turbo
   ├─ Endpoint: https://api.openai.com/v1/chat/completions
   └─ Env: OPENAI_API_KEY

3️⃣ No API (fallback)
   ├─ Method: Keyword matching
   ├─ Source: Product database search
   └─ Status: Return "API not configured" error
```

### Multi-Item Checkout (Gemini)
```
When user selects multiple items to checkout, AI generates:

```json
{
  "action": "checkout",
  "items": [
    {"product_id": 1, "quantity": 2, "size": "M"},
    {"product_id": 3, "quantity": 1, "size": "S"}
  ]
}
```

System automatically:
- Parses the JSON block
- Extracts product IDs and quantities
- Creates cart items
- Sets should_create_order = true
- Triggers order flow
```

### System Prompt
```
Language: Vietnamese
Role: Professional sales consultant for TeddyShop
Task: Recommend teddy bears and toys based on customer needs
Output: Friendly responses + product recommendations
Special: Uses checkout JSON blocks only when customer decides to buy multiple items
```

---

## 💾 Data Models Reference

### ConversationSession
```
Schema:
- id (PK)
- user (FK) → User, nullable
- session_id (unique) → "session_abc123xyz"
- title → "Tư vấn bán hàng"
- context (TextField, JSON) → {
    "messages": [
      {"role": "user", "content": "...", "timestamp": "2024-01-01T10:00:00"},
      {"role": "assistant", "content": "...", "timestamp": "..."},
      {...}
    ],
    "cart": [
      {"product_id": 1, "name": "...", "price": 500000, "quantity": 2},
      {...}
    ],
    "last_selected": {...}
  }
- is_active (default: True)
- created_at (auto)
- updated_at (auto)

Methods:
- get_context() → returns parsed JSON dict
- set_context(data) → saves data as JSON
- add_message(role, content) → appends to messages[]
```

### AIRecommendation
```
Schema:
- id (PK)
- conversation (FK) → ConversationSession
- product (FK) → Product
- reason (TextField) → Why AI recommended this
- confidence_score (FloatField, 0-1) → Trust level
- quantity (default: 1) → Suggested quantity
- is_accepted (default: False) → Did user accept?
- created_at (auto)
```

### AutomatedOrder
```
Schema:
- id (PK)
- conversation (FK) → ConversationSession
- user (FK) → User, nullable
- status → 'draft' | 'confirmed' | 'created' | 'cancelled'
- suggested_products (JSON) → [{product_id, name, price, quantity}, ...]
- ai_notes (TextField)
- full_name, phone, email, address, city, district
- estimated_total (DecimalField)
- shipping_fee (default: 30000)
- created_order_id → Reference to actual Order if created
- created_at, updated_at (auto)
```

---

## 🧪 Testing Flow

### Test One Message
```bash
# 1. Start conversation
POST /api/ai/conversations/start_conversation/

# Get session_id from response
# Example response: {"session_id": "session_abc123def456", ...}

# 2. Send message
POST /api/ai/conversations/session_abc123def456/send_message/
{
  "message": "Tôi muốn mua gấu bông"
}

# Expected response:
{
  "ai_response": "Xin chào! Bạn muốn mua gấu bông...",
  "recommendations": [
    {
      "product_id": 1,
      "product_name": "Gấu Bông Mật Ong",
      "reason": "Phù hợp với nhu cầu",
      "confidence_score": 0.95,
      "price": 500000,
      "image_url": "...",
      "quantity": 1
    }
  ],
  "cart": [],
  "should_create_order": false
}
```

### Full Order Flow Test
```bash
# 1. Start chat + send messages
# (as above)

# 2. When user selects items, create order
POST /api/ai/orders/
{
  "conversation_id": "session_abc123def456",
  "suggested_products": "[{\"product_id\": 1, \"name\": \"...\", \"price\": 500000, \"quantity\": 2}]",
  "estimated_total": 1000000
}
# Response: {"id": 5, "status": "draft", ...}

# 3. Collect address
POST /api/ai/orders/5/collect_address/
{
  "full_name": "Nguyễn Văn A",
  "phone": "0123456789",
  "email": "user@example.com",
  "address": "123 Đường ABC",
  "city": "TP.HCM",
  "district": "Quận 1"
}
# Response: {"message": "Address collected", "status": "confirmed"}

# 4. Confirm & create
POST /api/ai/orders/5/confirm_and_create/
{
  "payment_method": "cod"
}
# Response: {"order_code": "ORD-ABC123XYZ", "order_id": 123, ...}
```

---

## 🔧 Environment Setup

### Backend .env
```env
# Gemini (Primary AI)
GEMINI_API_KEY=AIza... (from https://ai.google.dev/)

# OpenAI (Fallback AI)
OPENAI_API_KEY=sk-... (from https://platform.openai.com/api-keys)

# Django
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=web_teddy_db
```

### Frontend .env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🚀 Key Component Functions

### AIAgentService.chat() 
**Core AI interaction logic**

```python
def chat(conversation, user_message) -> {
    'response': str           # AI's reply
    'recommendations': []     # Suggested products
    'should_create_order': bool
    'cart': []               # Current cart items
}

Flow:
1. Save user message to conversation context
2. Try Gemini API (if configured)
   └─ Detect checkout blocks → update cart
3. Fallback to OpenAI API (if configured)
   └─ Extract recommendations via regex
4. Return response + recommendations
```

### AIAgentChat Component
**Main React chat component**

```typescript
State:
- messages[] - chat history
- inputValue - input field text
- recommendations[] - products to show
- showAddressForm - toggle address input
- estimatedTotal - order total
- cart[] - selected items

Main Functions:
- loadConversationHistory() - fetch previous messages
- sendMessage() - POST to send_message endpoint
- handleProductSelect() - add product to cart
- handleCheckout() - show address form
```

### AIAgentConsole Component  
**Orchestrator component**

```typescript
State:
- conversationId - current session
- showOrderPreview - toggle order screen
- selectedRecommendations[] - products to order
- isCreatingOrder - loading state

Main Functions:
- handleStartConversation() - POST start_conversation
- handleNewConversation() - reset chat with confirm
- handleConfirmOrder() - create order via API
```

---

## 📊 State Flow Diagram

```
User Interface
    ↓
    ├→ Start Conversation
    │     ↓
    │     POST /api/ai/conversations/start_conversation/
    │     ← session_id (stored in localStorage)
    │
    ├→ AIAgentChat Component
    │     ├→ Send Message
    │     │    ↓
    │     │    POST /api/ai/conversations/{id}/send_message/
    │     │    ↓
    │     │    AIAgentService.chat()
    │     │    ├→ Gemini API OR OpenAI API
    │     │    └→ Parse recommendations
    │     │    ↓
    │     │    Return {response, recommendations, cart}
    │     │    ↓
    │     │    Display message + product cards
    │     │
    │     └→ User clicks "Select Product"
    │          ↓
    │          Add to recommendations[]
    │
    └→ User clicks "Create Order"
         ↓
         Show OrderPreview
         ↓
         User clicks "Confirm"
         ↓
         Show AddressForm
         ↓
         POST /api/ai/orders/
         POST /api/ai/orders/{id}/collect_address/
         POST /api/ai/orders/{id}/confirm_and_create/
         ↓
         Order Created ✅
         Redirect to order details
```

---

## ⚡ Performance Optimization

**Frontend**:
- localStorage for session persistence (no backend calls for session resumption)
- State management with React hooks (minimal re-renders)
- Component-scoped CSS (no global style conflicts)

**Backend**:
- Database queries only when needed (lazy loading)
- JSON context storage (no separate message table)
- API key priority system (faster with Gemini)

**API Calls**:
- Batch operations (address collection + order creation in one flow)
- Minimal payload transfer
- Authentication optional (supports anonymous users)

---

## 🐛 Debugging Tips

**Check AI API Configuration**:
```bash
cd backend
python manage.py shell
>>> from ai_agent.services import AIAgentService
>>> service = AIAgentService()
>>> print(service.gemini_api_key)  # Should print key if set
>>> print(service.api_key)          # Should print OpenAI key if set
```

**Test AI Response**:
```bash
curl -X POST http://localhost:8000/api/ai/conversations/start_conversation/
# Get session_id from response

curl -X POST http://localhost:8000/api/ai/conversations/{SESSION_ID}/send_message/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Tôi muốn mua gấu bông"}'
# Check response for recommendations
```

**Check Database**:
```bash
python manage.py shell
>>> from ai_agent.models import ConversationSession
>>> ConversationSession.objects.all().count()
>>> c = ConversationSession.objects.first()
>>> c.get_context()  # View stored messages and cart
```

**Browser DevTools**:
- Network tab: Check API response status and payload
- Console: Look for JS errors
- LocalStorage: Verify `teddy_ai_session_id` is saved

---

**Created**: 2024-03-15
**Last Updated**: 2024-03-15
**Status**: ✅ Complete Implementation
