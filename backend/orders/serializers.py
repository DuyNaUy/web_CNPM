from rest_framework import serializers
from .models import Order, OrderItem, Cart, CartItem


class CartItemDetailSerializer(serializers.ModelSerializer):
    """Serializer cho chi tiết sản phẩm trong giỏ hàng"""
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='price', max_digits=15, decimal_places=0, read_only=True)
    product_image = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'product_name', 'product_price', 'product_image', 'quantity', 'unit', 'total_price', 'available_stock', 'is_available']
        read_only_fields = ['id']
    
    def get_product_image(self, obj):
        """Lấy URL hình ảnh chính của sản phẩm"""
        if obj.product.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.main_image.url)
            return obj.product.main_image.url
        return None
    
    def get_total_price(self, obj):
        """Tính tổng giá cho mục này"""
        price = obj.price if obj.price else obj.product.price
        return price * obj.quantity
    
    def get_available_stock(self, obj):
        """Lấy số lượng tồn kho hiện tại"""
        if obj.unit and obj.product.variants.exists():
            variant = obj.product.variants.filter(size=obj.unit).first()
            if variant:
                return variant.stock
            return 0
        return obj.product.stock
    
    def get_is_available(self, obj):
        """Kiểm tra sản phẩm còn đủ hàng không"""
        available_stock = self.get_available_stock(obj)
        return available_stock >= obj.quantity


class CartSerializer(serializers.ModelSerializer):
    """Serializer cho giỏ hàng"""
    items = CartItemDetailSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    total_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'total_quantity']
        read_only_fields = ['id']
    
    def get_total_price(self, obj):
        """Tính tổng giá trị giỏ hàng"""
        return obj.total_price
    
    def get_total_quantity(self, obj):
        """Tính tổng số lượng sản phẩm"""
        return obj.total_quantity


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'product_price', 'quantity', 'unit']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True, source='items.all')
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_code', 'status', 'payment_method', 'payment_status',
            'full_name', 'phone', 'email', 'address', 'city', 'district', 'note',
            'subtotal', 'shipping_fee', 'total_amount', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_code', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField()
    address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    district = serializers.CharField(max_length=100)
    note = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.CharField(max_length=20)
    items = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
