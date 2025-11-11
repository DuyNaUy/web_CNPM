from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """Custom User model"""
    ROLE_CHOICES = [
        ('customer', 'Khách hàng'),
        ('seller', 'Người bán'),
        ('admin', 'Quản trị viên'),
    ]
    
    full_name = models.CharField(max_length=255, verbose_name='Họ và tên')
    phone = models.CharField(max_length=15, unique=True, verbose_name='Số điện thoại')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer', verbose_name='Vai trò')
    address = models.TextField(blank=True, null=True, verbose_name='Địa chỉ')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='Ảnh đại diện')
    is_active = models.BooleanField(default=True, verbose_name='Kích hoạt')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Ngày cập nhật')

    class Meta:
        db_table = 'users'
        verbose_name = 'Người dùng'
        verbose_name_plural = 'Người dùng'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.email})"
