from django.contrib import admin
from .models import Order, OrderItem, Cart, CartItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    inlines = [CartItemInline]
    list_display = ['user', 'total_quantity', 'total_price']
    search_fields = ['user__username', 'user__email']


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product', 'quantity', 'unit']
    list_filter = ['cart__user']
    search_fields = ['product__name', 'cart__user__username']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    inlines = [OrderItemInline]
    list_display = ['order_code', 'full_name', 'status', 'payment_method', 'total_amount', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['order_code', 'full_name', 'phone', 'email']
    readonly_fields = ['order_code', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Thông tin đơn hàng', {
            'fields': ('order_code', 'user', 'status', 'created_at', 'updated_at')
        }),
        ('Thông tin khách hàng', {
            'fields': ('full_name', 'phone', 'email', 'address', 'city', 'district', 'note')
        }),
        ('Thanh toán', {
            'fields': ('payment_method', 'payment_status', 'subtotal', 'shipping_fee', 'total_amount')
        }),
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product_name', 'quantity', 'unit', 'product_price']
    list_filter = ['order__created_at']
    search_fields = ['product_name']
