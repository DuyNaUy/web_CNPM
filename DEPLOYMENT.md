# Hướng Dẫn Deploy TeddyShop Lên Internet

## 📋 Yêu Cầu Trước Khi Deploy

- Tài khoản GitHub (miễn phí)
- Tài khoản Railway/Render (miễn phí)
- Tài khoản Vercel (miễn phí)

---

## 🚀 Phần 1: Chuẩn Bị Dự Án

### 1.1 Tạo Git Repository

```bash
# Tại thư mục gốc TeddyShop
git init
git add .
git commit -m "Initial commit"

# Tạo repository trên GitHub và push
git remote add origin https://github.com/YOUR_USERNAME/web_CNPM.git
git branch -M main
git push -u origin main
```

---

## 🐍 Phần 2: Deploy Backend (Django) Lên Railway

### 2.1 Cập Nhật Settings cho Production

File `backend/backend/settings.py` đã được cấu hình tự động.

### 2.2 Deploy trên Railway

1. **Truy cập** https://railway.app/
2. **Đăng nhập** bằng GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Chọn repository** `web_CNPM`
5. **Chọn thư mục** `backend` làm root directory
6. **Thêm MySQL Database**:
   - Click **New** → **Database** → **Add MySQL**
   - Railway sẽ tự động tạo database và connection string

### 2.3 Cấu Hình Environment Variables

Trong Railway, vào **Variables** và thêm:

```
SECRET_KEY=django-insecure-CHANGE-THIS-IN-PRODUCTION-xyz123
DEBUG=False
ALLOWED_HOSTS=*.railway.app
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app

# Database variables sẽ tự động có từ MySQL service
# MYSQL_URL được Railway tự động inject
```

### 2.4 Xem URL Backend

Sau khi deploy, Railway sẽ cung cấp URL dạng:
```
https://your-app-name.railway.app
```

---

## ⚡ Phần 3: Deploy Frontend (Next.js) Lên Vercel

### 3.1 Chuẩn Bị Frontend

1. **Cập nhật API URL** trong `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend-app.railway.app/api
```

2. **Thêm file `.env.production`**:

```env
NEXT_PUBLIC_API_URL=https://your-backend-app.railway.app/api
```

### 3.2 Deploy trên Vercel

1. **Truy cập** https://vercel.com/
2. **Đăng nhập** bằng GitHub
3. **Import Project** → chọn repository `web_CNPM`
4. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. **Environment Variables**: Thêm
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-app.railway.app/api
   ```

6. **Deploy**

### 3.3 Xem URL Frontend

Vercel sẽ cung cấp URL dạng:
```
https://your-app.vercel.app
```

---

## 🔧 Phần 4: Cấu Hình CORS

Quay lại Railway, cập nhật environment variable:

```
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app
```

---

## 📦 Phần 5: Thay Thế - Deploy Trên Render

### 5.1 Backend trên Render

1. **Truy cập** https://render.com/
2. **New** → **Web Service**
3. **Connect GitHub** → chọn repository
4. **Settings**:
   - **Name**: `teddyshop-backend`
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT`

5. **Thêm PostgreSQL Database** (miễn phí):
   - **New** → **PostgreSQL**
   - Render sẽ tạo database và connection string

6. **Environment Variables**:
   ```
   SECRET_KEY=your-secret-key
   DEBUG=False
   DATABASE_URL=postgresql://... (tự động)
   ALLOWED_HOSTS=.render.com
   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
   ```

---

## 🛠️ Phần 6: Xử Lý Static Files & Media

### 6.1 Sử dụng Cloudinary (miễn phí)

1. **Đăng ký** tại https://cloudinary.com/
2. **Cài đặt package**:
   ```bash
   pip install django-cloudinary-storage
   ```

3. **Cập nhật `settings.py`**:
   ```python
   INSTALLED_APPS = [
       ...
       'cloudinary_storage',
       'cloudinary',
       ...
   ]

   CLOUDINARY_STORAGE = {
       'CLOUD_NAME': 'your_cloud_name',
       'API_KEY': 'your_api_key',
       'API_SECRET': 'your_api_secret'
   }

   DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
   ```

---

## ✅ Checklist Sau Khi Deploy

- [ ] Backend API hoạt động: `https://your-backend.railway.app/api/`
- [ ] Frontend hiển thị: `https://your-app.vercel.app`
- [ ] Đăng nhập/Đăng ký hoạt động
- [ ] Upload hình ảnh hoạt động
- [ ] Giỏ hàng và đặt hàng hoạt động
- [ ] Admin panel truy cập được

---

## 🔍 Debug & Troubleshooting

### Xem Logs

**Railway/Render**:
- Vào project → Logs → xem lỗi

**Vercel**:
- Vào deployment → View Function Logs

### Lỗi Thường Gặp

1. **CORS Error**: Kiểm tra `CORS_ALLOWED_ORIGINS` trong backend
2. **Database Error**: Kiểm tra connection string
3. **Static Files 404**: Chạy `python manage.py collectstatic`
4. **Module Not Found**: Kiểm tra `requirements.txt`

---

## 💰 Chi Phí

- **Railway**: 500 giờ/tháng miễn phí (đủ cho 1 project nhỏ)
- **Vercel**: Unlimited deployments (miễn phí)
- **Render**: 750 giờ/tháng miễn phí
- **Cloudinary**: 25GB storage miễn phí

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Logs trên Railway/Render
2. Browser Console (F12)
3. Network tab để xem API calls

---

**Chúc bạn deploy thành công! 🎉**
