from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from categories.models import Category
import json

class Product(models.Model):
    STATUS_CHOICES = [
        ('active', 'Đang bán'),
        ('inactive', 'Ngừng bán'),
    ]
    
    # Thông tin cơ bản
    name = models.CharField(max_length=255, verbose_name='Tên sản phẩm')
    slug = models.SlugField(max_length=255, unique=True, blank=True, verbose_name='Slug')
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products',
        verbose_name='Danh mục'
    )
    
    # Giá và kho
    price = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(0)],
        verbose_name='Giá hiện tại'
    )
    old_price = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        verbose_name='Giá cũ'
    )
    stock = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Số lượng tồn kho'
    )
    unit = models.CharField(
        max_length=50,
        default='kg',
        verbose_name='Đơn vị tính'
    )
    
    # Đánh giá
    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        verbose_name='Đánh giá trung bình'
    )
    reviews_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Số lượt đánh giá'
    )
    sold_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Số lượng đã bán'
    )
    
    # Mô tả
    description = models.TextField(
        blank=True,
        verbose_name='Mô tả ngắn'
    )
    detail_description = models.TextField(
        blank=True,
        verbose_name='Mô tả chi tiết'
    )
    
    # Hình ảnh (lưu dưới dạng JSON array)
    main_image = models.ImageField(
        upload_to='products/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Hình ảnh chính'
    )
    images = models.TextField(
        blank=True,
        help_text='JSON array of image URLs',
        verbose_name='Hình ảnh phụ'
    )
    
    # Thông số kỹ thuật (lưu dưới dạng JSON)
    specifications = models.TextField(
        blank=True,
        help_text='JSON object with specifications',
        verbose_name='Thông số kỹ thuật'
    )
    
    # Các thông tin chi tiết
    origin = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Xuất xứ'
    )
    weight = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Trọng lượng'
    )
    preservation = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Cách bảo quản'
    )
    expiry = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Hạn sử dụng'
    )
    certification = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Chứng nhận'
    )
    
    # Trạng thái
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='Trạng thái'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Ngày cập nhật')
    
    class Meta:
        db_table = 'products'
        verbose_name = 'Sản phẩm'
        verbose_name_plural = 'Sản phẩm'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Auto-generate slug from name if not provided
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.name, allow_unicode=True)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        
        super().save(*args, **kwargs)
    
    @property
    def images_list(self):
        """Convert JSON string to list"""
        if self.images:
            try:
                return json.loads(self.images)
            except json.JSONDecodeError:
                return []
        return []
    
    @property
    def specifications_dict(self):
        """Convert JSON string to dict"""
        if self.specifications:
            try:
                return json.loads(self.specifications)
            except json.JSONDecodeError:
                return {}
        return {}
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage"""
        if self.old_price and self.old_price > self.price:
            return int(((self.old_price - self.price) / self.old_price) * 100)
        return 0
    
    @property
    def in_stock(self):
        """Check if product is in stock"""
        return self.stock > 0


class ProductImage(models.Model):
    """Model riêng để lưu nhiều ảnh cho sản phẩm"""
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='product_images',
        verbose_name='Sản phẩm'
    )
    image = models.ImageField(
        upload_to='products/%Y/%m/',
        verbose_name='Hình ảnh'
    )
    is_main = models.BooleanField(
        default=False,
        verbose_name='Ảnh chính'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Thứ tự'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'product_images'
        verbose_name = 'Hình ảnh sản phẩm'
        verbose_name_plural = 'Hình ảnh sản phẩm'
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"Image for {self.product.name}"
