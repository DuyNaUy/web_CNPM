# 🚀 Deploy TeddyShop - Checklist Nhanh

## ✅ Checklist Trước Khi Deploy

### 1. Chuẩn Bị Code
- [ ] Đã commit tất cả thay đổi
- [ ] Code chạy tốt ở local
- [ ] Đã tạo file `.env.example` cho backend
- [ ] Đã tạo file `.env.local.example` cho frontend

### 2. Tạo Tài Khoản (Miễn Phí)
- [ ] GitHub account (nếu chưa có)
- [ ] Railway account: https://railway.app/
- [ ] Vercel account: https://vercel.com/

### 3. Push Code Lên GitHub
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/web_CNPM.git
git branch -M main
git push -u origin main
```

---

## 🐍 Deploy Backend (15 phút)

### Railway (Khuyên dùng)

1. **Truy cập** https://railway.app/
2. **Login** với GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Chọn repository**: `web_CNPM`
5. **Settings** → **Root Directory**: `backend`
6. **Add MySQL**:
   - New → Database → Add MySQL
   - Railway tự động tạo DB và inject variables

7. **Add Environment Variables**:
```
SECRET_KEY=your-super-secret-key-change-this
DEBUG=False
ALLOWED_HOSTS=*.railway.app
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

8. **Deploy** → Đợi ~5 phút

9. **Lấy URL**: Dạng `https://backend-production-xxxx.up.railway.app`

### Kiểm tra Backend
- Truy cập: `https://your-backend.railway.app/api/`
- Nếu thấy JSON response → Thành công! ✅

---

## ⚡ Deploy Frontend (10 phút)

### Vercel

1. **Truy cập** https://vercel.com/
2. **Login** với GitHub
3. **Import Project** → Chọn repository `web_CNPM`
4. **Configure**:
   - **Framework**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (mặc định)
   - **Output Directory**: `.next` (mặc định)

5. **Environment Variables**:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

6. **Deploy** → Đợi ~3 phút

7. **Lấy URL**: Dạng `https://your-app.vercel.app`

---

## 🔧 Cập Nhật CORS (Quan Trọng!)

Quay lại Railway → Backend project → Variables:

```
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app
```

**Redeploy** backend sau khi cập nhật.

---

## ✅ Kiểm Tra Hoạt Động

1. **Frontend**: `https://your-app.vercel.app`
   - [ ] Trang chủ hiển thị
   - [ ] Danh sách sản phẩm hiển thị
   
2. **Đăng ký/Đăng nhập**:
   - [ ] Đăng ký tài khoản mới
   - [ ] Đăng nhập thành công
   
3. **Chức năng**:
   - [ ] Xem chi tiết sản phẩm
   - [ ] Thêm vào giỏ hàng
   - [ ] Đặt hàng
   - [ ] Xem đơn hàng

4. **Admin** (nếu có):
   - URL: `https://your-backend.railway.app/admin/`
   - [ ] Đăng nhập admin
   - [ ] Quản lý sản phẩm

---

## 🐛 Troubleshooting

### Lỗi CORS
```
❌ Access to fetch ... has been blocked by CORS policy
```
**Giải pháp**: Kiểm tra `CORS_ALLOWED_ORIGINS` trong Railway variables

### Lỗi API Connection
```
❌ Failed to fetch / Network error
```
**Giải pháp**: 
- Kiểm tra `NEXT_PUBLIC_API_URL` trong Vercel
- Chắc chắn backend đang chạy

### Lỗi Database
```
❌ Database connection error
```
**Giải pháp**:
- Railway: Kiểm tra MySQL service đang chạy
- Check logs: Railway → Deployments → Logs

### Lỗi Build Frontend
```
❌ Build failed
```
**Giải pháp**:
- Vercel → Logs → xem lỗi chi tiết
- Thường do thiếu env variables

---

## 📊 Xem Logs

### Railway
Project → Deployments → View Logs

### Vercel  
Project → Deployments → View Function Logs

---

## 🔄 Cập Nhật Sau Khi Deploy

### Cập nhật code:
```bash
git add .
git commit -m "Update features"
git push
```

→ Railway và Vercel tự động deploy lại!

---

## 💰 Chi Phí (Miễn Phí)

- ✅ Railway: $5 credit/tháng (đủ cho project nhỏ)
- ✅ Vercel: Unlimited deployments
- ✅ Tổng: **$0** cho dự án học tập

---

## 🎉 Hoàn Thành!

Website của bạn đã online tại:
- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-backend.railway.app/api/
- **Admin**: https://your-backend.railway.app/admin/

**Chia sẻ link với bạn bè và giáo viên! 🚀**

---

## 📞 Cần Hỗ Trợ?

1. Check logs trên Railway/Vercel
2. Google error message
3. Xem file DEPLOYMENT.md chi tiết hơn
