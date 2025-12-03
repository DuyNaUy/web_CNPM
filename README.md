# TeddyShop - Website Bán Gấu Bông

Dự án website thương mại điện tử bán gấu bông được xây dựng bằng Django (Backend) và Next.js (Frontend).

## 🛠️ Tech Stack

### Backend
- Django 5.0
- Django REST Framework
- MySQL
- JWT Authentication
- Django CORS Headers

### Frontend  
- Next.js 13
- React 18
- PrimeReact
- TypeScript
- Sass

## 📦 Cài Đặt Local

### Backend Setup

```bash
cd backend

# Tạo virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env
cp .env.example .env
# Cập nhật thông tin database trong .env

# Chạy migrations
python manage.py migrate

# Tạo superuser
python manage.py createsuperuser

# Chạy server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Cài đặt dependencies
npm install

# Tạo file .env.local
cp .env.local.example .env.local
# Cập nhật API URL trong .env.local

# Chạy dev server
npm run dev
```

## 🚀 Deploy Lên Internet

Xem hướng dẫn chi tiết trong file [DEPLOYMENT.md](DEPLOYMENT.md)

### Tóm tắt:
1. **Backend**: Deploy lên Railway/Render
2. **Frontend**: Deploy lên Vercel
3. **Database**: MySQL trên Railway hoặc PostgreSQL trên Render

## 📝 Tính Năng

### Khách Hàng
- ✅ Xem danh sách sản phẩm
- ✅ Tìm kiếm & lọc sản phẩm
- ✅ Xem chi tiết sản phẩm
- ✅ Thêm vào giỏ hàng
- ✅ Đặt hàng
- ✅ Quản lý đơn hàng
- ✅ Hủy đơn hàng (Chờ xác nhận, Đã xác nhận)

### Admin
- ✅ Quản lý người dùng
- ✅ Quản lý danh mục
- ✅ Quản lý sản phẩm
- ✅ Quản lý đơn hàng (theo thứ tự trạng thái)
- ✅ Thống kê & báo cáo
- ✅ Xuất Excel/PDF

## 🔐 Quy Tắc Trạng Thái Đơn Hàng

**Admin** chỉ được cập nhật theo thứ tự:
- Chờ xác nhận → Đã xác nhận → Đang giao → Đã giao

**Khách hàng** có thể hủy đơn khi:
- ✅ Chờ xác nhận
- ✅ Đã xác nhận
- ❌ Không thể hủy khi: Đang giao, Đã giao

## 📂 Cấu Trúc Dự Án

```
TeddyShop/
├── backend/              # Django Backend
│   ├── backend/         # Settings & URLs
│   ├── users/           # User management
│   ├── categories/      # Category management
│   ├── products/        # Product management
│   ├── orders/          # Order & Cart management
│   ├── media/           # Uploaded images
│   └── manage.py
├── frontend/            # Next.js Frontend
│   ├── app/            # Pages & Layouts
│   ├── services/       # API services
│   ├── public/         # Static assets
│   └── package.json
└── DEPLOYMENT.md       # Deployment guide
```

## 🌐 URLs

### Development
- Backend API: http://localhost:8000/api/
- Frontend: http://localhost:3000
- Admin Panel: http://localhost:8000/admin/

### Production
- Backend: https://your-app.railway.app/api/
- Frontend: https://your-app.vercel.app

## 👨‍💻 Tác Giả

Dự án được phát triển bởi nhóm sinh viên CNPM

## 📄 License

MIT License
