from django.db import models
from products.models import Product
from users.models import User


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Chờ xử lý'),
        ('confirmed', 'Đã xác nhận'),
        ('shipping', 'Đang giao'),
        ('delivered', 'Đã giao'),
        ('cancelled', 'Đã hủy'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('cod', 'Thanh toán khi nhận hàng (COD)'),
        ('vnpay', 'VNPay'),
        ('momo', 'Momo'),
        ('banking', 'Chuyển khoản ngân hàng'),
    ]

    # Order info
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    order_code = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Customer info
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    note = models.TextField(blank=True, null=True)
    
    # Payment info
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_status = models.CharField(max_length=20, default='pending')  # pending, completed, failed
    
    # Amounts
    subtotal = models.DecimalField(max_digits=15, decimal_places=0)  # VND
    shipping_fee = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.order_code} - {self.full_name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)  # Lưu tên sản phẩm tại thời điểm đặt hàng
    product_price = models.DecimalField(max_digits=15, decimal_places=0)  # Giá tại thời điểm đặt
    quantity = models.PositiveIntegerField()
    unit = models.CharField(max_length=50)  # Size/unit sản phẩm
    
    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
