from django.db import models

class Category(models.Model):
    STATUS_CHOICES = [
        ('active', 'Hoạt động'),
        ('inactive', 'Ngừng hoạt động'),
    ]
    
    name = models.CharField(max_length=100, unique=True, verbose_name='Tên danh mục')
    description = models.TextField(blank=True, verbose_name='Mô tả')
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='Trạng thái'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Ngày cập nhật')
    
    class Meta:
        db_table = 'categories'
        verbose_name = 'Danh mục'
        verbose_name_plural = 'Danh mục'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def product_count(self):
        """Trả về số lượng sản phẩm trong danh mục"""
        return self.products.count() if hasattr(self, 'products') else 0
