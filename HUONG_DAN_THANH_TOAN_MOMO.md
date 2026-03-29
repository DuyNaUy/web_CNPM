# 💳 HƯỚNG DẪN THANH TOÁN MOMO - TEDDYSHOP

## 📋 TỔNG QUAN

Dự án đã tích hợp đầy đủ thanh toán MoMo với các tính năng:
- ✅ Tạo đơn hàng và redirect đến trang thanh toán MoMo
- ✅ Xử lý callback từ MoMo sau khi thanh toán
- ✅ Hiển thị kết quả thanh toán
- ✅ Tự động cập nhật trạng thái đơn hàng và giỏ hàng
- ✅ Xác thực signature để bảo mật

---

## 🚀 HƯỚNG DẪN KHỞI ĐỘNG

### 1. Cài đặt thư viện Python
```powershell
cd d:\TeddyShop\backend
pip install requests
```

### 2. Chạy migration database
```powershell
cd d:\TeddyShop\backend
python manage.py migrate
```

### 3. Khởi động Backend và Frontend

**Terminal 1 - Backend:**
```powershell
cd d:\TeddyShop\backend
python manage.py runserver
```

**Terminal 2 - Frontend:**
```powershell
cd d:\TeddyShop\frontend
npm run dev
```

---

## 🧪 HƯỚNG DẪN TEST THANH TOÁN

### Bước 1: Đăng nhập
- Truy cập: `http://localhost:3000`
- Đăng nhập với tài khoản customer

### Bước 2: Thêm sản phẩm vào giỏ hàng
- Vào trang sản phẩm: `http://localhost:3000/customer/products`
- Chọn sản phẩm và thêm vào giỏ hàng
- Vào giỏ hàng: `http://localhost:3000/customer/cart`

### Bước 3: Thanh toán
1. Tại trang giỏ hàng, chọn sản phẩm muốn thanh toán
2. Click **"Thanh toán"**
3. Điền thông tin giao hàng:
   - Họ và tên: `Nguyễn Văn A`
   - Số điện thoại: `0123456789`
   - Email: `test@example.com`
   - Địa chỉ: `123 Đường ABC`
   - Quận/Huyện: `Quận 1`
   - Tỉnh/Thành phố: `TP.HCM`

4. Chọn **"Thanh toán qua Momo"**
5. Click **"Đặt hàng"**

### Bước 4: Thanh toán trên trang MoMo Test
Bạn sẽ được redirect đến: `https://test-payment.momo.vn/...`

**Thông tin test MoMo:**
```
Số thẻ: 9704 0000 0000 0018
Tên chủ thẻ: NGUYEN VAN A
Ngày hết hạn: 03/07
OTP: OTP
```

Hoặc đơn giản: Click nút **"Thanh toán thành công"** để test

### Bước 5: Xem kết quả
- Sau khi thanh toán, bạn sẽ được redirect về: `http://localhost:3000/customer/payment/result`
- Hiển thị: ✅ **"Thanh toán thành công!"** + Mã đơn hàng
- Giỏ hàng sẽ **tự động cập nhật** (xóa các sản phẩm đã mua)
- Click **"Xem đơn hàng"** để kiểm tra

---

## 📂 CẤU TRÚC CODE

### Backend Files:
1. **`backend/orders/payment_utils.py`**
   - Class `MoMoPayment` xử lý tất cả logic MoMo
   - `create_payment()` - Tạo payment URL
   - `verify_signature()` - Xác thực callback
   - `check_transaction_status()` - Kiểm tra trạng thái giao dịch

2. **`backend/orders/models.py`**
   - Model `Order` có 3 fields MoMo:
     - `momo_transaction_id` - ID giao dịch MoMo
     - `momo_request_id` - Request ID
     - `momo_order_id` - Order ID từ MoMo

3. **`backend/orders/views.py`**
   - `create_order()` - Tạo đơn hàng và nhận payUrl
   - `momo_callback()` - Nhận callback từ MoMo (IPN)
   - `check_momo_payment_status()` - Kiểm tra trạng thái thanh toán

4. **`backend/orders/urls.py`**
   ```python
   path('momo-callback/', momo_callback),
   path('momo-status/<int:order_id>/', check_momo_payment_status),
   ```

5. **`backend/backend/settings.py`**
   - Cấu hình MoMo test credentials
   - Callback URLs

### Frontend Files:
1. **`frontend/app/(main)/customer/checkout/page.tsx`**
   - Form thanh toán với option MoMo
   - Redirect đến MoMo khi chọn thanh toán
   - Lưu cart item IDs để xóa sau khi thanh toán

2. **`frontend/app/(main)/customer/payment/result/page.tsx`**
   - Nhận kết quả từ MoMo (URL params)
   - Hiển thị thành công/thất bại
   - Tự động xóa sản phẩm khỏi giỏ hàng
   - Cập nhật cart count

3. **`frontend/services/api.ts`**
   - `orderAPI.createOrder()` - Tạo đơn hàng
   - `orderAPI.checkMoMoStatus()` - Kiểm tra trạng thái MoMo
   - `cartAPI.removeItem()` - Xóa item khỏi cart

---

## 🔧 API ENDPOINTS

### 1. Tạo đơn hàng và thanh toán MoMo
```
POST /api/orders/create_order/
```

**Request Body:**
```json
{
  "full_name": "Nguyễn Văn A",
  "phone": "0123456789",
  "email": "test@example.com",
  "address": "123 Đường ABC",
  "city": "TP.HCM",
  "district": "Quận 1",
  "note": "Ghi chú",
  "payment_method": "momo",
  "items": [
    {
      "id": 1,
      "quantity": 2,
      "unit": "M",
      "price": "500000"
    }
  ]
}
```

**Response (MoMo):**
```json
{
  "id": 1,
  "order_code": "DH001",
  "payUrl": "https://test-payment.momo.vn/...",
  "deeplink": "momo://...",
  "qrCodeUrl": "https://...",
  ...
}
```

### 2. Callback từ MoMo (IPN)
```
POST /api/orders/momo-callback/
```

**MoMo gửi callback khi thanh toán xong:**
```json
{
  "partnerCode": "MOMO",
  "orderId": "1",
  "requestId": "...",
  "amount": 530000,
  "orderInfo": "Thanh toan don hang DH001",
  "orderType": "momo_wallet",
  "transId": 123456789,
  "resultCode": 0,
  "message": "Successful",
  "payType": "qr",
  "responseTime": 1234567890,
  "extraData": "",
  "signature": "..."
}
```

### 3. Kiểm tra trạng thái thanh toán
```
GET /api/orders/momo-status/{order_id}/
```

**Response:**
```json
{
  "order": {
    "id": 1,
    "order_code": "DH001",
    "payment_status": "completed",
    "momo_transaction_id": "123456789",
    ...
  },
  "momo_status": {
    "resultCode": 0,
    "message": "Successful",
    ...
  }
}
```

---

## ⚙️ CẤU HÌNH MOMO

### Test Environment (Sandbox) - ĐÃ CẤU HÌNH
```python
# backend/backend/settings.py
MOMO_PARTNER_CODE = 'MOMO'
MOMO_ACCESS_KEY = 'F8BBA842ECF85'
MOMO_SECRET_KEY = 'K951B6PE1waDMi640xX08PD3vg6EkVlz'
MOMO_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/create'
MOMO_REDIRECT_URL = 'http://localhost:3000/customer/payment/result'
MOMO_IPN_URL = 'http://localhost:8000/api/orders/momo-callback/'
```

### Production Environment (Khi deploy thật)
1. Đăng ký tài khoản MoMo Business: https://business.momo.vn/
2. Lấy credentials chính thức
3. Cập nhật settings.py:
```python
MOMO_PARTNER_CODE = 'YOUR_PARTNER_CODE'
MOMO_ACCESS_KEY = 'YOUR_ACCESS_KEY'
MOMO_SECRET_KEY = 'YOUR_SECRET_KEY'
MOMO_ENDPOINT = 'https://payment.momo.vn/v2/gateway/api/create'
MOMO_REDIRECT_URL = 'https://yourdomain.com/customer/payment/result'
MOMO_IPN_URL = 'https://yourdomain.com/api/orders/momo-callback/'
```

---

## 🔒 BẢO MẬT

### Signature Verification
Tất cả callback từ MoMo đều được verify signature:
```python
# payment_utils.py
def verify_signature(data):
    raw_signature = (
        f"accessKey={ACCESS_KEY}"
        f"&amount={data.get('amount')}"
        f"&extraData={data.get('extraData')}"
        # ... các field khác
    )
    expected_signature = hmac.new(
        SECRET_KEY.encode('utf-8'),
        raw_signature.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return received_signature == expected_signature
```

### CSRF Exempt cho Callback
```python
@csrf_exempt
def momo_callback(request):
    # MoMo callback không có CSRF token
    ...
```

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### 1. "Module not found: Can't resolve 'axios'"
**Nguyên nhân:** File đã được sửa, không cần axios nữa
**Giải pháp:** Code đã sử dụng `orderAPI` từ `services/api.ts`

### 2. "Lỗi kết nối MoMo"
**Nguyên nhân:** Không kết nối được API MoMo
**Giải pháp:**
- Kiểm tra internet
- Thử lại sau vài phút
- Kiểm tra settings.py có đúng `MOMO_ENDPOINT`

### 3. Giỏ hàng không tự động cập nhật sau thanh toán
**Nguyên nhân:** Đã fix
**Giải pháp:** 
- Code đã lưu `momoCartItemIds` vào sessionStorage
- Tự động xóa items sau khi thanh toán thành công

### 4. Callback không hoạt động với localhost
**Lưu ý:** 
- MoMo không thể gọi callback đến localhost
- Để test callback thật, cần deploy hoặc dùng ngrok:
```powershell
ngrok http 8000
# Cập nhật MOMO_IPN_URL với URL từ ngrok
```

---

## 📊 FLOW THANH TOÁN

```
1. Customer chọn sản phẩm → Giỏ hàng
                ↓
2. Click "Thanh toán" → Checkout page
                ↓
3. Chọn "Momo" + Điền thông tin → Click "Đặt hàng"
                ↓
4. Backend tạo Order → Gọi MoMo API → Nhận payUrl
                ↓
5. Lưu cart item IDs vào sessionStorage
                ↓
6. Redirect khách đến trang MoMo → window.location.href = payUrl
                ↓
7. Khách thanh toán trên trang MoMo
                ↓
8. MoMo callback đến /api/orders/momo-callback/ (IPN)
                ↓
9. Backend verify signature → Cập nhật payment_status
                ↓
10. MoMo redirect khách về /customer/payment/result
                ↓
11. Frontend hiển thị kết quả → Xóa items khỏi cart
                ↓
12. Cập nhật cart count → Hoàn thành ✅
```

---

## ✅ CHECKLIST HOÀN THÀNH

- [x] Backend: payment_utils.py với class MoMoPayment
- [x] Backend: Models có fields momo_transaction_id, momo_request_id, momo_order_id
- [x] Backend: Views xử lý create_order, callback, check status
- [x] Backend: URLs cho momo-callback và momo-status
- [x] Backend: Settings với MoMo test credentials
- [x] Frontend: Checkout page với option MoMo
- [x] Frontend: Payment result page
- [x] Frontend: API service với checkMoMoStatus
- [x] Tự động xóa cart items sau thanh toán thành công
- [x] Tự động cập nhật cart count
- [x] Signature verification
- [x] Error handling
- [x] Test thành công với MoMo sandbox

---

## 📞 HỖ TRỢ

- **MoMo Docs:** https://developers.momo.vn/
- **MoMo Business:** https://business.momo.vn/
- **Test Environment:** https://test-payment.momo.vn/

---

**Tích hợp hoàn thành! Sẵn sàng cho production! 🎉**
