# Troubleshooting Chatbot Product Buttons

## 🔍 Debugging Steps

### Step 1: Check Browser Console
Press `F12` to open Developer Tools → Go to **Console** tab

**Look for these logs:**
```
[ProductCard] Rendering product: { id: 123, name: "...", ... }
[AIAgentChat] Received response: { ai_response: "...", products: [...] }
[AIAgentChat] Products in response: [...]
[AIAgentChat] Rendering products: [...]
```

---

## 🔴 Issue 1: No Products Showing in Chat

### Symptoms:
- AI responds with text but no product cards appear
- No console logs about products

### Causes & Solutions:

#### A. API Keys Not Configured
**Check if backend has API keys:**
```bash
# Check .env file or settings.py
GEMINI_API_KEY=xxx      # Should NOT be empty
OPENAI_API_KEY=xxx      # Should NOT be empty
```

**Solution:**
- If no API keys, system uses **FALLBACK MODE** (keyword search)
- Check console for: `"No API keys available - using fallback mode"`
- Fallback mode should still return products

#### B. Database Has No Products
**Check if products exist:**
```bash
# SSH into backend and run:
python manage.py shell
from products.models import Product
Product.objects.filter(status='active').count()  # Should return > 0
```

**Solution:**
- Add products to database with `status='active'`
- Products need: name, price, category, main_image, etc.

#### C. Frontend-Backend Connection Issue
**Check if API responses return products:**
1. Open DevTools → **Network** tab
2. Send a message in chatbot
3. Look for request: `send_message/`
4. Check **Response** tab to see if `"products": [...]`

**Expected Response:**
```json
{
  "ai_response": "Here are some products...",
  "products": [
    {
      "id": 1,
      "name": "Product Name",
      "price": 150000,
      "image_url": "...",
      "stock": 50,
      "quantity": 1
    }
  ]
}
```

**If Response shows `"products": []`:**
- Issue is in backend (see Step 2)
- Check [backend logs](#step-2-backend-logs)

---

## Step 2: Backend Logs

### Check if service.chat() is returning products
Add temporary log to [ai_agent/services.py](backend/ai_agent/services.py):

```python
# In send_message endpoint (views.py line ~68)
response = service.chat(conversation, message)
print(f"[DEBUG] Chat response: {response}")  # Add this line
```

**Or better - check backend server output:**
```bash
# In backend terminal where runserver is running
# Look for: "[DEBUG]" messages or error tracebacks
```

### Check if keyword search is working
Browser Console → send message like: `"Tôi muốn mua gấu bông dễ thương"`

**Should see in backend logs:**
```
[DEBUG] Fallback mode - searching keywords: ['muốn', 'mua', 'gấu', 'bông', 'dễ', 'thương']
```

---

## 🟡 Issue 2: Buttons Not Responding

### Symptoms:
- Product cards show but buttons don't work
- Buttons appear disabled/grayed out
- Clicking "Xem thêm" does nothing

### Causes & Solutions:

#### A. Button CSS Not Loaded
```bash
# Check if styles file exists:
ls -la frontend/components/ai-agent/AIAgentChat.module.css
```

**If missing, create it with basic styles:**
```css
.productCard {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
}

.productButtons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btnViewMore,
.btnAddCart,
.btnBuyNow {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btnViewMore {
  background-color: #007bff;
  color: white;
}

.btnAddCart {
  background-color: #28a745;
  color: white;
}

.btnBuyNow {
  background-color: #dc3545;
  color: white;
}

.btnViewMore:hover { opacity: 0.9; }
.btnAddCart:hover { opacity: 0.9; }
.btnBuyNow:hover { opacity: 0.9; }

.btnViewMore:disabled,
.btnAddCart:disabled,
.btnBuyNow:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### B. Event Handlers Not Firing
Check browser console for click events:
1. Click any button on product card
2. Look for console message like: `[ProductCard] handleViewMore clicked for product: 123`
3. If no message appears = event not attached

**Solution:** Rebuild frontend
```bash
cd frontend
npm run dev  # or yarn dev
```

#### C. API Endpoint Issues
If button clicked but nothing happens:
1. Check console for errors
2. Look at **Network** tab for API calls
3. Should see POST/GET request to `/api/ai/conversations/...`

**Common Issues:**
- `404 Not Found` → Wrong endpoint URL
- `403 Forbidden` → Auth token missing
- `500 Server Error` → Backend error (check server logs)

---

## 🟢 Issue 3: "Mua ngay" Not Working for Anonymous Users

### Symptoms:
- Cart works fine
- "Mua ngay" button says "❌ Vui lòng đăng nhập"

### Why:
Standard behavior - "Buy Now" requires login

### Solution:
Users must:
1. Login first
2. Then use "Mua ngay"

---

## 🔧 Manual Testing Checklist

### Backend Testing
```bash
# Test endpoint manually
curl -X POST http://localhost:8000/api/ai/conversations/{session_id}/add_to_cart/ \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 1, "unit": ""}'
```

### Frontend Testing
```bash
# In browser console:
const resp = await fetch('http://localhost:8000/api/ai/conversations/{session_id}/add_to_cart/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ product_id: 1, quantity: 1, unit: '' })
});
const data = await resp.json();
console.log(data);
```

---

## 📋 Fallback Mode Details

**When activated:**
- No Gemini API key OR Gemini unavailable
- AND No OpenAI API key OR OpenAI unavailable

**What it does:**
1. Extracts keywords from user message
2. Searches products by keywords
3. If no keywords found, shows top products
4. Returns response with product list

**Example:**
```
User: "Tôi muốn mua gấu bông"
↓
Keywords: ['muốn', 'mua', 'gấu', 'bông']
↓
Search: Product.objects.filter(name__icontains='gấu' or name__icontains='bông' ...)
↓
Returns: [Product1, Product2, Product3]
```

**Fallback Response Template:**
```
"Cảm ơn bạn! Tôi tìm thấy một số sản phẩm phù hợp với yêu cầu của bạn:

Gấu bông nhỏ cute, Gấu bông hồng, Gấu bông khổng lồ

Bạn có muốn xem chi tiết hoặc thêm vào giỏ hàng không?"
```

---

## 🚀 Quick Fix Commands

### Restart Backend
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

### Rebuild Frontend
```bash
cd frontend
npm run dev
```

### Clear Browser Cache
```
Ctrl+Shift+Delete (Windows)
Cmd+Shift+Delete (Mac)
```

Then refresh the page.

### Check if Services Running
```bash
# Check if Django backend is running
lsof -i :8000

# Check if Next.js frontend is running
lsof -i :3000
```

---

## 📞 Advanced Debugging

### Enable SQL Query Logging
In `backend/settings.py`:
```python
# Add to LOGGING section
'level': 'DEBUG',
```

### Frontend Debug Mode
In `frontend/components/ai-agent/AIAgentChat.tsx`:
```typescript
// Search for: console.log statements
// They are already added for debugging
```

### Database Query Check
```bash
python manage.py shell
from products.models import Product
Product.objects.filter(status='active').values('id', 'name', 'price')[:5]
```

---

## ✅ Verification Checklist

- [ ] Backend running: `python manage.py runserver`
- [ ] Frontend running: `npm run dev`
- [ ] Products exist in database: `Product.objects.filter(status='active').count() > 0`
- [ ] Browser console shows debug logs without errors
- [ ] Network tab shows 200 responses from `/api/ai/`
- [ ] ProductCard renders with image and buttons
- [ ] Buttons are clickable (not disabled/grayed out)
- [ ] Clicking button triggers console log message
- [ ] API response includes products array

---

## 📞 Need Help?

Check these files for issues:
1. **Backend**: [ai_agent/services.py](backend/ai_agent/services.py) - Look for `_get_fallback_response()`
2. **Frontend**: [AIAgentChat.tsx](frontend/components/ai-agent/AIAgentChat.tsx) - ProductCard component
3. **Styles**: [AIAgentChat.module.css](frontend/components/ai-agent/AIAgentChat.module.css)
4. **Database**: [orders/models.py](backend/orders/models.py) - Cart model
