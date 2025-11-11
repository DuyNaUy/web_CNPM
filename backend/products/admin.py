from django.contrib import admin
from .models import Product, ProductImage

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'is_main', 'order']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'category', 'price', 'stock', 'status', 'rating', 'created_at']
    list_filter = ['category', 'status', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    list_per_page = 20
    inlines = [ProductImageInline]
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('name', 'slug', 'category', 'description', 'detail_description')
        }),
        ('Giá và Kho', {
            'fields': ('price', 'old_price', 'stock', 'unit')
        }),
        ('Hình ảnh', {
            'fields': ('main_image', 'images')
        }),
        ('Thông số kỹ thuật', {
            'fields': ('specifications', 'origin', 'weight', 'preservation', 'expiry', 'certification')
        }),
        ('Trạng thái', {
            'fields': ('status',)
        }),
        ('Thống kê', {
            'fields': ('rating', 'reviews_count', 'sold_count'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['slug', 'rating', 'reviews_count', 'sold_count', 'created_at', 'updated_at']

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'is_main', 'order', 'created_at']
    list_filter = ['is_main', 'created_at']
    search_fields = ['product__name']
    ordering = ['product', 'order']
