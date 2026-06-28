# Báo Cáo Thay Đổi: Loại Bỏ Đơn Hàng Bị Hủy Khỏi Thống Kê Doanh Thu

## Ngày: 28/06/2026

## Vấn Đề
Hệ thống đang tính tổng doanh thu bao gồm cả các đơn hàng có trạng thái **'cancelled'** (Đã hủy), dẫn đến số liệu thống kê không chính xác.

## Giải Pháp Đã Áp Dụng

### 1. API Thống Kê (`/api/orders/stats/`)
**File:** `backend/orders/views.py` - Hàm `stats()`

#### Các thay đổi:
- ✅ **Tổng doanh thu (total_revenue)**: Sử dụng `.exclude(status='cancelled')` để loại bỏ đơn hàng bị hủy
- ✅ **Tổng doanh thu theo danh mục**: Sử dụng `.exclude(order__status='cancelled')` cho OrderItem
- ✅ **Doanh thu theo tháng**: Chỉ tính các đơn hàng không bị hủy
- ✅ **Số đơn hàng theo tuần**: Chỉ đếm các đơn hàng không bị hủy
- ✅ **Doanh thu theo kích thước**: Loại bỏ items từ đơn hàng bị hủy
- ✅ **Top sản phẩm bán chạy**: Chỉ tính items từ đơn hàng thành công

### 2. Xuất Báo Cáo Excel (`/api/orders/export_excel/`)
**File:** `backend/orders/views.py` - Hàm `export_excel()`

#### Các thay đổi:
- ✅ **Báo cáo Doanh thu**: Thêm điều kiện `if order.status != 'cancelled'` trước khi cộng vào tổng
- ✅ **Báo cáo Khách hàng**: Sử dụng `.exclude(status='cancelled')` trong aggregation

### 3. Xuất Báo Cáo PDF (`/api/orders/export_pdf/`)
**File:** `backend/orders/views.py` - Hàm `export_pdf()`

#### Các thay đổi:
- ✅ **Báo cáo Doanh thu**: Thêm điều kiện `if order.status != 'cancelled'` trước khi cộng vào tổng
- ✅ **Báo cáo Khách hàng**: Sử dụng `.exclude(status='cancelled')` trong aggregation

## Kết Quả

### Trước khi sửa:
```python
# Tính tất cả đơn hàng bao gồm cả đơn bị hủy
total_revenue = orders_query.aggregate(total=Sum('total_amount'))['total']
```

### Sau khi sửa:
```python
# Chỉ tính đơn hàng không bị hủy
total_revenue = orders_query.exclude(status='cancelled').aggregate(total=Sum('total_amount'))['total']
```

## Ảnh Hưởng

### Các metric đã được cập nhật:
1. ✅ Tổng doanh thu (total_revenue)
2. ✅ Doanh thu theo tháng (revenue_by_month)
3. ✅ Số đơn hàng theo tuần (orders_by_week)
4. ✅ Doanh thu theo kích thước sản phẩm (revenue_by_size)
5. ✅ Top sản phẩm bán chạy (top_products)
6. ✅ Thống kê khách hàng (customer_stats)
7. ✅ Xuất file Excel - tất cả báo cáo
8. ✅ Xuất file PDF - tất cả báo cáo

### Các metric KHÔNG bị ảnh hưởng:
- ❌ Tổng số đơn hàng (total_orders) - vẫn đếm tất cả đơn
- ❌ Đơn hàng chờ xử lý (pending_orders)
- ❌ Đơn hàng hoàn thành (completed_orders)
- ❌ Tổng số khách hàng (total_customers)

## Lưu Ý Quan Trọng

### 1. Hiển thị vs Tính toán
- Các đơn hàng bị hủy **VẪN HIỂN THỊ** trong danh sách báo cáo
- Các đơn hàng bị hủy **KHÔNG ĐƯỢC TÍNH** vào tổng doanh thu
- Điều này giúp admin theo dõi đầy đủ nhưng có số liệu chính xác

### 2. Trạng thái đơn hàng
```python
ORDER_STATUS_CHOICES = [
    ('pending', 'Chờ xử lý'),
    ('confirmed', 'Đã xác nhận'),
    ('shipping', 'Đang giao'),
    ('delivered', 'Đã giao'),
    ('cancelled', 'Đã hủy'),  # ← Trạng thái này bị loại khỏi tính tổng
]
```

### 3. Bộ lọc
Tất cả các bộ lọc vẫn hoạt động bình thường:
- Lọc theo ngày (start_date, end_date)
- Lọc theo danh mục (category_id)
- Kết hợp các bộ lọc

## Kiểm Tra

### Các bước test:
1. ✅ Tạo một đơn hàng mới với giá 100,000 VND
2. ✅ Kiểm tra tổng doanh thu tăng 100,000 VND
3. ✅ Hủy đơn hàng đó (chuyển status = 'cancelled')
4. ✅ Kiểm tra tổng doanh thu giảm 100,000 VND
5. ✅ Xuất báo cáo Excel/PDF và xác nhận tổng không bao gồm đơn bị hủy

### API Test:
```bash
# Test API thống kê
GET /api/orders/stats/
GET /api/orders/stats/?start_date=2026-01-01&end_date=2026-06-28
GET /api/orders/stats/?category_id=1

# Test xuất báo cáo
GET /api/orders/export_excel/?report_type=revenue
GET /api/orders/export_pdf/?report_type=revenue
```

## Code Review Points

### Đã áp dụng best practices:
- ✅ Sử dụng Django ORM `.exclude()` method
- ✅ Nhất quán trong toàn bộ codebase
- ✅ Không breaking changes (backward compatible)
- ✅ Comments rõ ràng trong code

### Pattern sử dụng:
```python
# Cho Order queryset
orders_query.exclude(status='cancelled')

# Cho OrderItem queryset (khi join với Order)
order_items_query.exclude(order__status='cancelled')
```

## Deployment Notes

### Không cần migration
- Không có thay đổi database schema
- Chỉ thay đổi business logic

### Rollback
Nếu cần rollback, xóa các `.exclude(status='cancelled')` đã thêm.

---

**Người thực hiện:** AI Assistant (Kiro)  
**Người review:** [Tên của bạn]  
**Trạng thái:** ✅ Hoàn thành
