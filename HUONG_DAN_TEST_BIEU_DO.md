# Hướng Dẫn Test Biểu Đồ Thống Kê

## Đã Cập Nhật

✅ Backend endpoint `/api/orders/stats/` đã được cập nhật để trả về:
- `revenue_by_month`: Doanh thu theo 6 tháng gần nhất
- `orders_by_week`: Số đơn hàng theo 4 tuần gần nhất  
- `revenue_by_size`: Doanh thu theo kích thước sản phẩm (từ OrderItem.unit)
- `top_products`: Top 10 sản phẩm bán chạy nhất

## Cách Test

### 1. Đảm bảo Backend đang chạy
```bash
cd backend
python manage.py runserver
```

### 2. Đảm bảo Frontend đang chạy
```bash
cd frontend
npm run dev
```

### 3. Đăng nhập với tài khoản Admin
- Truy cập: http://localhost:3000/auth/login
- Đăng nhập với tài khoản admin

### 4. Xem trang báo cáo
- Truy cập: http://localhost:3000/admin/reports
- Kiểm tra các biểu đồ:
  - **Doanh Thu Theo Tháng**: Hiển thị line chart với dữ liệu 6 tháng
  - **Số Đơn Hàng Theo Tuần**: Hiển thị bar chart với dữ liệu 4 tuần
  - **Doanh Thu Theo Kích Thước**: Hiển thị pie chart theo unit (30cm, 60cm, 90cm, v.v.)
  - **Top Sản Phẩm Bán Chạy**: Hiển thị bảng với top 10 sản phẩm

## Chi Tiết Cập Nhật Backend

### Revenue by Month (Doanh thu theo tháng)
- Tính doanh thu của 6 tháng gần nhất
- Format: `[{month: "Tháng 1", revenue: 5000000}, ...]`
- Sử dụng `Order.created_at` để group theo tháng

### Orders by Week (Số đơn hàng theo tuần)
- Đếm số đơn hàng của 4 tuần gần nhất
- Format: `[{week: "Tuần 1", orders: 15}, ...]`
- Mỗi tuần = 7 ngày tính từ hiện tại

### Revenue by Size (Doanh thu theo kích thước)
- Tính doanh thu theo `OrderItem.unit` (30cm, 60cm, 90cm, v.v.)
- Format: `[{size: "30cm", revenue: 3000000, count: 50}, ...]`
- Sử dụng aggregate Sum và Count

### Top Products (Sản phẩm bán chạy)
- Top 10 sản phẩm có tổng quantity cao nhất
- Format: `[{id: 1, name: "Gấu Teddy", category: "Gấu bông", sold: 100, revenue: 10000000}, ...]`
- Sử dụng OrderItem aggregate

## Lưu Ý

1. Nếu chưa có dữ liệu, biểu đồ sẽ hiển thị giá trị mặc định (0)
2. Cần có đơn hàng trong database để thấy dữ liệu thực tế
3. Backend tự động tính toán dựa trên dữ liệu hiện có
4. Dữ liệu được cache, có thể cần refresh trang để thấy thay đổi mới nhất

## Troubleshooting

### Biểu đồ không hiển thị dữ liệu
1. Kiểm tra console browser (F12) xem có lỗi API không
2. Kiểm tra backend log xem có lỗi không
3. Đảm bảo đã đăng nhập với tài khoản admin
4. Kiểm tra có đơn hàng trong database không

### Lỗi "Bạn không có quyền truy cập"
- Đảm bảo user.is_staff = True trong database
- Kiểm tra token authentication đang hoạt động

### Backend trả về lỗi
- Kiểm tra database có tables Order và OrderItem không
- Chạy migrations nếu cần: `python manage.py migrate`
