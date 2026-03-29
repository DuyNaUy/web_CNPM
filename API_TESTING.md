# API Testing Examples - AI Agent

## Postman Collection

### 1. Authentication
**Endpoint:** `POST /api/auth/token/`

```json
{
  "username": "testuser",
  "password": "testpass123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## AI Agent Endpoints

### 2. Start Conversation
**Endpoint:** `POST /api/ai/conversations/start_conversation/`

**Headers:**
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

**Response:**
```json
{
  "id": 1,
  "session_id": "session_a1b2c3d4e5f6",
  "title": "Tư vấn bán hàng",
  "created_at": "2024-01-20T10:30:00Z",
  "updated_at": "2024-01-20T10:30:00Z",
  "is_active": true,
  "recommendations": []
}
```

---

### 3. Send Message to AI
**Endpoint:** `POST /api/ai/conversations/{id}/send_message/`

**URL:** `/api/ai/conversations/1/send_message/`

**Headers:**
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "message": "Tôi muốn mua gấu bông cho con gái 5 tuổi, ngân sách 500k"
}
```

**Response:**
```json
{
  "conversation_id": "session_a1b2c3d4e5f6",
  "user_message": "Tôi muốn mua gấu bông cho con gái 5 tuổi, ngân sách 500k",
  "ai_response": "Tuyệt vời! Dựa trên tuổi của con gái bạn và ngân sách, tôi có vài sản phẩm gợi ý:\n\n1. Gấu bông Teddy 30cm - rất phù hợp cho trẻ em\n2. Gấu bông Panda 25cm - an toàn và dễ thương\n\nBạn có quan tâm không?",
  "recommendations": [
    {
      "product_id": 1,
      "product_name": "Gấu bông Teddy 30cm",
      "reason": "Phù hợp với tuổi của con gái bạn, giá hợp lý",
      "confidence_score": 0.85,
      "quantity": 1,
      "price": 450000
    },
    {
      "product_id": 2,
      "product_name": "Gấu bông Panda 25cm",
      "reason": "Sản phẩm bán chạy, bé gái rất thích",
      "confidence_score": 0.75,
      "quantity": 1,
      "price": 350000
    }
  ],
  "should_create_order": false
}
```

---

### 4. Get Conversation History
**Endpoint:** `GET /api/ai/conversations/{id}/get_history/`

**URL:** `/api/ai/conversations/1/get_history/`

**Headers:**
```
Authorization: Bearer {ACCESS_TOKEN}
```

**Response:**
```json
{
  "conversation_id": "session_a1b2c3d4e5f6",
  "messages": [
    {
      "role": "user",
      "content": "Tôi muốn mua gấu bông cho con gái 5 tuổi",
      "timestamp": "2024-01-20T10:30:15Z"
    },
    {
      "role": "assistant",
      "content": "Tuyệt vời!...",
      "timestamp": "2024-01-20T10:30:20Z"
    }
  ],
  "recommendations": [
    {
      "id": 1,
      "product_id": 1,
      "product__name": "Gấu bông Teddy 30cm",
      "reason": "Phù hợp với tuổi của con gái bạn...",
      "confidence_score": 0.85
    }
  ]
}
```

---

### 5. Close Conversation
**Endpoint:** `POST /api/ai/conversations/{id}/close_conversation/`

**URL:** `/api/ai/conversations/1/close_conversation/`

**Headers:**
```
Authorization: Bearer {ACCESS_TOKEN}
```

**Response:**
```json
{
  "message": "Conversation closed successfully"
}
```

---

### 6. Create Automated Order
**Endpoint:** `POST /api/ai/orders/{id}/confirm_and_create/`

**URL:** `/api/ai/orders/1/confirm_and_create/`

**Headers:**
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "payment_method": "cod"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order_code": "ORD-A1B2C3D4",
  "order_id": 42
}
```

---

### 7. Cancel Automated Order
**Endpoint:** `POST /api/ai/orders/{id}/cancel/`

**URL:** `/api/ai/orders/1/cancel/`

**Headers:**
```
Authorization: Bearer {ACCESS_TOKEN}
```

**Response:**
```json
{
  "message": "Order cancelled successfully"
}
```

---

## cURL Examples

### Get Token
```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'
```

### Start Conversation
```bash
curl -X POST http://localhost:8000/api/ai/conversations/start_conversation/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Send Message
```bash
curl -X POST http://localhost:8000/api/ai/conversations/1/send_message/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tôi muốn mua gấu bông cho con gái"
  }'
```

### Get History
```bash
curl -X GET http://localhost:8000/api/ai/conversations/1/get_history/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Order
```bash
curl -X POST http://localhost:8000/api/ai/orders/1/confirm_and_create/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method": "cod"}'
```

---

## JavaScript/Fetch Examples

### Start Conversation
```javascript
const token = localStorage.getItem('access_token');

fetch('http://localhost:8000/api/ai/conversations/start_conversation/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

### Send Message
```javascript
const conversationId = 1;
const token = localStorage.getItem('access_token');

fetch(`http://localhost:8000/api/ai/conversations/${conversationId}/send_message/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Tôi muốn mua gấu bông'
  })
})
.then(res => res.json())
.then(data => {
  console.log('AI Response:', data.ai_response);
  console.log('Recommendations:', data.recommendations);
});
```

### Create Order
```javascript
const orderId = 1;
const token = localStorage.getItem('access_token');

fetch(`http://localhost:8000/api/ai/orders/${orderId}/confirm_and_create/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    payment_method: 'cod'
  })
})
.then(res => res.json())
.then(data => {
  alert(`Order created: ${data.order_code}`);
});
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 404 Not Found
```json
{
  "error": "Conversation not found"
}
```

### 400 Bad Request
```json
{
  "error": "Message cannot be empty"
}
```

---

## Testing Checklist

- [ ] Get JWT token
- [ ] Start conversation
- [ ] Send message to AI
- [ ] Verify AI response
- [ ] Get conversation history
- [ ] Create automated order
- [ ] Verify order created
- [ ] Test with different products
- [ ] Test payment methods
- [ ] Close conversation

---

## Performance Notes

- **Message Response Time:** ~500ms - 2s (depends on AI API)
- **Order Creation Time:** ~200ms
- **Database Query Time:** <50ms

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Check if token is valid and not expired |
| 404 Not Found | Verify ID parameter |
| 400 Bad Request | Check request body JSON format |
| Empty AI Response | Check if OPENAI_API_KEY is set |
| CORS Error | Check CORS_ALLOWED_ORIGINS in settings |

