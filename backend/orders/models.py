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
    
    # MoMo payment info
    momo_transaction_id = models.CharField(max_length=100, blank=True, null=True)
    momo_request_id = models.CharField(max_length=100, blank=True, null=True)
    momo_order_id = models.CharField(max_length=100, blank=True, null=True)
    
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


class Cart(models.Model):
    """Giỏ hàng của khách hàng"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Giỏ hàng'
        verbose_name_plural = 'Giỏ hàng'
    
    def __str__(self):
        return f"Cart of {self.user.username}"
    
    @property
    def total_price(self):
        """Tính tổng giá trị giỏ hàng"""
        return sum(item.total_price for item in self.items.all())
    
    @property
    def total_quantity(self):
        """Tính tổng số lượng sản phẩm"""
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    """Mục trong giỏ hàng"""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit = models.CharField(max_length=50, blank=True)  # Size/unit sản phẩm (30cm, 60cm, 90cm, v.v.)
    price = models.DecimalField(max_digits=15, decimal_places=0, default=0)  # Giá tại thời điểm thêm vào giỏ
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('cart', 'product', 'unit')
        verbose_name = 'Mục giỏ hàng'
        verbose_name_plural = 'Mục giỏ hàng'
    
    def __str__(self):
        return f"{self.product.name} ({self.unit}) x {self.quantity}"
    
    @property
    def total_price(self):
        """Tính tổng giá cho mục này"""
        return self.price * self.quantity if self.price else self.product.price * self.quantity


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)  # Lưu tên sản phẩm tại thời điểm đặt hàng
    product_price = models.DecimalField(max_digits=15, decimal_places=0)  # Giá tại thời điểm đặt
    quantity = models.PositiveIntegerField()
    unit = models.CharField(max_length=50)  # Size/unit sản phẩm
    
    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
