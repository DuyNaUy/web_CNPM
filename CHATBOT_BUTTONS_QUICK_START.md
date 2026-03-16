# Chatbot Product Buttons - Quick Start Guide

## ✅ What's Fixed

1. **Auto-start conversation** - No need to click "Bắt đầu", it starts automatically
2. **Fallback mode** - Works without Gemini/OpenAI API keys using keyword search
3. **Product rendering** - All 3 buttons now show on product cards
4. **Debugging** - Console logs added to track what's happening

---

## 🚀 Quick Testing Steps

### Step 1: Make sure backend is running
```bash
cd d:\TeddyShop\backend
python manage.py runserver
```
Should see:
```
Starting development server at http://127.0.0.1:8000/
```

### Step 2: Make sure frontend is running
```bash
cd d:\TeddyShop\frontend
npm run dev
```
Should see:
```
> next dev
  ▲ Next.js 14.x
  ○ Ready in ...
```

### Step 3: Open browser console
```
Press F12 → Console tab
```

### Step 4: Navigate to chatbot page
```
http://localhost:3000/[your-path-to-chatbot]
```

### Step 5: Send first message
Type a question like:
- "Tôi muốn mua gấu bông"
- "Gấu bông dễ thương"
- "Sản phẩm hot"

### Step 6: Check console logs
Should see:
```
[AIAgentConsole] Loaded conversation from localStorage: abc123
[AIAgentChat] Received response: { ai_response: "...", products: [...] }
[AIAgentChat] Products in response: [{ id: 1, name: "...", ... }]
[ProductCard] Rendering product: { id: 1, name: "..." }
```

### Step 7: Click buttons
- **Xem thêm** → Should go to product detail page
- **Thêm vào giỏ** → Should show "✅ Đã thêm vào giỏ"
- **Mua ngay** → Should show message and redirect to checkout (if logged in)

---

## 🔍 Debugging: What to Look For

### Console Should Show:

✅ **Good signs:**
```javascript
[AIAgentChat] Received response: {
  ai_response: "Cảm ơn bạn! Tôi tìm thấy một số sản phẩm...",
  products: [
    { id: 1, name: "Gấu bông nhỏ", price: 150000, ... },
    { id: 2, name: "Gấu bông hồng", price: 200000, ... }
  ]
}
```

❌ **Bad signs:**
```javascript
[AIAgentChat] Received response: { ai_response: "...", products: [] }  // Empty products
```

### Network Tab Should Show:

1. **POST request** to `/api/ai/conversations/{id}/send_message/`
2. **Response** includes `"products": [...]`

---

## 🧪 Manual Test Cases

### Test Case 1: Product Cards Render
1. Send message: "có sản phẩm gì"
2. **Expected**: Product cards appear below AI response
3. **Check**: Looking for HTML elements:
   ```html
   <div class="productCard">
     <img src="..." />
     <button>Xem thêm</button>
     <button>Thêm vào giỏ</button>
     <button>Mua ngay</button>
   </div>
   ```

### Test Case 2: Xem Thêm Button Works
1. Click "Xem thêm" on any product card
2. **Expected**: Navigates to product detail page
3. **Check Console**: `[ProductCard] handleViewMore clicked for product: {id}`

### Test Case 3: Thêm vào Giỏ Button Works
1. Click "Thêm vào giỏ" on product card
2. **Expected**: See alert "✅ Đã thêm ... vào giỏ"
3. **Check Console**: 
   ```
   [ProductCard] handleAddToCart clicked for product: {id}
   [ProductCard] Add to cart response: { success: true, ... }
   ```
4. **Verify**: Check cart page to see product added

### Test Case 4: Mua Ngay Button Works (Authenticated)
1. **Prerequisite**: Must be logged in
2. Click "Mua ngay" on product card
3. **Expected**: 
   - See alert "✅ Sản phẩm được thêm vào giỏ..."
   - Redirected to `/customer/checkout`
4. **Check Console**:
   ```
   [ProductCard] handleBuyNow clicked for product: {id}
   [ProductCard] Buy now response: { success: true, redirect_to_checkout: true }
   ```

### Test Case 5: Mua Ngay Button Works (Anonymous)
1. **Prerequisite**: Not logged in / no token
2. Click "Mua ngay" on product card
3. **Expected**: See alert "⚠️ Vui lòng đăng nhập để mua hàng"
4. **Check Console**: Button clicked but doesn't proceed

### Test Case 6: Fallback Mode (No API Keys)
1. **Prerequisite**: Remove API keys from backend settings
2. Send message: "Gấu bông"
3. **Expected**:
   - See in console: `"No API keys available - using fallback mode"`
   - Products still returned (searched by keywords)
   - All 3 buttons still work
4. **Check Console**:
   ```
   [DEBUG] Fallback mode - searching keywords: ['gấu', 'bông']
   [AIAgentChat] Products in response: [...]
   ```

---

## 📊 Expected Behavior Summary

| Scenario | User Action | Expected Result |
|----------|-------------|-----------------|
| **First Time** | Enter chatbot | Auto-start conversation (no click needed) |
| **Normal Message** | Send message | AI responds + products show if found |
| **Fallback Mode** | No API keys | Still works, keyword search |
| **Xem Thêm** | Click button | Go to `/customer/products/{slug}` |
| **Add to Cart** | Click button | Add to cart, show ✅ message |
| **Buy Now (Auth)** | Click button | Add to cart + redirect to checkout |
| **Buy Now (Anon)** | Click button | Show login prompt |

---

## 🔧 Common Issues & Fixes

### Issue: No Products Show But No Errors
**Cause**: Probably database has no active products
**Fix**:
```bash
# Check database
python manage.py shell
from products.models import Product
Product.objects.filter(status='active').count()

# If 0, add test products or set status='active' for existing ones
Product.objects.all().update(status='active')
```

### Issue: Buttons Don't Click
**Cause**: CSS not loaded or click handler not attached
**Fix**:
```bash
# Rebuild frontend
cd frontend
npm run build
npm run dev
```

### Issue: "Conversation not found" Error
**Cause**: Conversation ID doesn't exist in database
**Fix**: 
- Clear localStorage: `localStorage.clear()`
- Refresh page (auto-starts new conversation)
- Check backend has created conversation record

### Issue: Products Show But Buttons Disabled
**Cause**: Likely stock is 0
**Fix**: Check backend logs or add more stock to products

---

## 📝 Important Files

- Backend service: [backend/ai_agent/services.py](backend/ai_agent/services.py)
- Frontend chat: [frontend/components/ai-agent/AIAgentChat.tsx](frontend/components/ai-agent/AIAgentChat.tsx)
- Console wrapper: [frontend/components/ai-agent/AIAgentConsole.tsx](frontend/components/ai-agent/AIAgentConsole.tsx)
- API endpoints: [backend/ai_agent/views.py](backend/ai_agent/views.py)

---

## 🎯 Success Criteria Checklist

- [ ] Chatbot page loads without errors
- [ ] Conversation auto-starts (no click needed)
- [ ] Can send messages
- [ ] Products appear with images and names
- [ ] All 3 buttons render (Xem thêm, Thêm vào giỏ, Mua ngay)
- [ ] Buttons respond to clicks (console logs show handlers firing)
- [ ] "Xem thêm" navigates to product page
- [ ] "Thêm vào giỏ" adds product to cart
- [ ] "Mua ngay" redirects to checkout (if authenticated)
- [ ] No JavaScript console errors
- [ ] Works even without API keys (fallback mode)

---

## 📞 Still Not Working?

1. **Check browser console** (F12) for any error messages
2. **Check backend logs** for API errors
3. **Check network tab** (F12 → Network) for failed requests
4. **Read** [CHATBOT_BUTTONS_TROUBLESHOOTING.md](CHATBOT_BUTTONS_TROUBLESHOOTING.md) for detailed debugging

---

## 💡 How It Works

### Without API Keys (Fallback Mode)
```
User Message: "Tôi muốn mua gấu bông"
         ↓
Extract Keywords: ['muốn', 'mua', 'gấu', 'bông']
         ↓
Search Database: Product.objects.filter(
  Q(name__icontains='gấu') | Q(name__icontains='bông')
)
         ↓
Return Products + AI Response
         ↓
Frontend Renders ProductCard with 3 Buttons
```

### With API Keys
```
User Message
         ↓
Call Gemini/OpenAI API
         ↓
Extract Products from AI Response
         ↓
Return to Frontend
         ↓
Render ProductCard
```

---

## 🚀 Next Steps After Success

1. **Deploy to production** when everything works
2. **Monitor backend logs** for errors in production
3. **A/B test** button placement and styling
4. **Collect user feedback** on button usability
5. **Optimize** fallback mode keyword matching based on usage data
