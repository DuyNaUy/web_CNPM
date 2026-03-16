# Chatbot Modal + Backend Integration - Verification Guide

## Current Implementation Status

### ✅ Frontend Modal Implementation (AIAgentChat.tsx)
1. **ProductCard component** - Local component inside AIAgentChat
   - Modal Dialog from PrimeReact ✅
   - Size selection dropdown ✅
   - Quantity input (InputNumber) ✅
   - Toast notifications ✅
   - Button handlers: openAddToCartModal, openBuyNowModal ✅

2. **Modal Actions**
   - "Thêm vào giỏ" (Add to Cart)
     - Calls confirmAddToCart()
     - Calls cartAPI.addItem() endpoint
     - Shows success/error toast
     - Closes modal on success
   
   - "Mua ngay" (Buy Now)
     - Calls confirmBuyNow()
     - Stores item in sessionStorage
     - Redirects to /customer/checkout

### ✅ Backend API Implementation (orders/views.py)
1. **CartViewSet.add_item()** endpoint
   - URL: POST /api/orders/cart/add_item/
   - Validates product exists
   - Checks stock availability
   - Supports variants (sizes)
   - Returns updated cart data (JSON)

2. **Response Format** (200 OK)
```json
{
  "id": 1,
  "user": 1,
  "items": [
    {
      "id": 1,
      "product": 123,
      "product_name": "Gấu bông",
      "quantity": 2,
      "unit": "Large",
      "price": 150000,
      "total_price": 300000
    }
  ],
  "total_price": 300000,
  "total_quantity": 2
}
```

## Testing Checklist

### 1. Visual Test - Modal Appearance
```
When clicking "Thêm vào giỏ" or "Mua ngay":
☐ Modal window appears (floating dialog box)
☐ Shows product image
☐ Shows product name & price
☐ Shows size selection dropdown (if variants exist)
☐ Shows quantity selector (1-10)
☐ Shows action buttons
```

### 2. Size Selection Test (if product has variants)
```
☐ Click size dropdown
☐ Select different sizes
☐ Price updates based on selected size
☐ Stock availability updates
```

### 3. Add to Cart Flow
```
User Login Required: ✅ / ❌
□ Click "Thêm vào giỏ" button
□ Select size (if needed)
□ Set quantity
□ Click "Thêm vào giỏ" button in modal
□ Check browser console (F12 → Console tab):
  - Should see: "[ProductCard] Add to cart response: {data}"
  - Should NOT see errors
□ Toast message appears: "Đã thêm vào giỏ" ✅ / ❌
□ Modal closes automatically ✅ / ❌
□ Go to /customer/cart
□ Verify item appeared in cart ✅ / ❌
```

### 4. Buy Now Flow
```
User Login Required: ✅ Required
□ Click "Mua ngay" button
□ Select size (if needed)
□ Set quantity
□ Click "Mua ngay" button in modal
□ Check console - should see: "[ProductCard] Buy Now - Item: {...}"
□ Modal closes ✅ / ❌
□ Redirects to /customer/checkout ✅ / ❌
□ Item already selected on checkout page ✅ / ❌
```

### 5. Stock Validation Test
```
For product with 2 available stock:
□ Try to add 3 quantity → Warning appears ✅ / ❌
□ Message: "Số lượng tồn kho không đủ. Tồn kho: 2" ✅ / ❌
□ Cannot confirm action ✅ / ❌
```

### 6. Backend API Test
```
Browser DevTools → Network tab:
□ Click "Thêm vào giỏ" and look for POST request
□ Should see: POST /api/orders/cart/add_item/
□ Status should be: 200 ✅ / ❌ (not 400, 401, 500)
□ Response contains "items" array ✅ / ❌
```

## Console Debugging

Open browser console (F12):
```javascript
// Should see these logs when interacting:
[ProductCard] Rendering product: {id: 123, name: "..."}
[ProductCard] openAddToCartModal for product: 123
[ProductCard] confirmAddToCart clicked for product: 123
[ProductCard] Add to cart response: {id: 1, items: [...], ...}
```

## If Issues Found

### Issue 1: Modal doesn't appear
```
Check:
□ PrimeReact Dialog component loaded
□ CSS module imported correctly
□ isModalOpen state is set to true
□ Browser console has no errors
```

### Issue 2: API returns 401
```
Solution: User not logged in
□ Log in first at /auth/login
□ Token saved in localStorage
□ Try again
```

### Issue 3: API returns 400/500
```
Check console error details - might be:
- Product ID invalid
- Stock not enough
- Database connection error
- Server error - check server logs: python manage.py runserver
```

### Issue 4: Modal closes but item not in cart
```
Check:
□ User is logged in (check localStorage → user key)
□ Check /customer/cart page
□ Check browser Network tab - success response (200)?
□ Check server logs for errors
```

## Files to Reference

- Frontend: `frontend/components/ai-agent/AIAgentChat.tsx`
  - ProductCard component (lines 74-530)
  - Modal Dialog (lines 357-477)
  - confirmAddToCart (lines 137-254)
  - confirmBuyNow (lines 260-345)

- Backend: `backend/orders/views.py`
  - CartViewSet.add_item() (lines 50-122)
  - Stock validation logic

## Quick Debug Commands

```bash
# Backend - check database
cd backend
python manage.py shell
>>> from orders.models import Cart, CartItem
>>> Cart.objects.all().count()  # Number of carts
>>> CartItem.objects.all().count()  # Number of items

# Frontend - watch console logs
# Open http://localhost:3000/
# Open DevTools (F12)
# Click product buttons and watch console
```

## Success Criteria

✅ Modal appears when clicking buttons  
✅ Can select size and quantity  
✅ "Thêm vào giỏ" adds to cart (visible in /customer/cart)  
✅ "Mua ngay" redirects to checkout with item selected  
✅ Stock validation works  
✅ Toast notifications appear  
✅ No errors in console  
