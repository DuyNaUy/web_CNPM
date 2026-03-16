from rest_framework import serializers
from .models import ConversationSession
from products.models import Product, ProductVariant
from orders.models import Cart, CartItem
import json


class ConversationSessionSerializer(serializers.ModelSerializer):
    """Serializer cho Conversation Sessions - SIMPLIFIED VERSION"""
    
    class Meta:
        model = ConversationSession
        fields = ['id', 'session_id', 'title', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['session_id', 'created_at', 'updated_at']


class ProductVariantChatbotSerializer(serializers.ModelSerializer):
    """Serializer cho biến thể sản phẩm trong chatbot"""
    
    class Meta:
        model = ProductVariant
        fields = ['id', 'size', 'price', 'stock']


class ProductDetailsChatbotSerializer(serializers.ModelSerializer):
    """Serializer để hiển thị chi tiết sản phẩm trong chatbot"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    main_image_url = serializers.SerializerMethodField()
    images_list = serializers.SerializerMethodField()
    specifications_dict = serializers.SerializerMethodField()
    variants = ProductVariantChatbotSerializer(many=True, read_only=True)
    discount_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category_name',
            'price', 'old_price', 'discount_percentage', 'stock', 'unit',
            'rating', 'reviews_count', 'sold_count',
            'main_image_url', 'images_list', 'description', 'detail_description',
            'specifications_dict', 'origin', 'guarantee', 'variants',
            'status', 'created_at', 'updated_at'
        ]
    
    def get_main_image_url(self, obj):
        """Lấy URL hình ảnh chính"""
        if obj.main_image and hasattr(obj.main_image, 'url'):
            image_url = obj.main_image.url
            if not image_url.startswith('http'):
                request = self.context.get('request')
                if request:
                    image_url = request.build_absolute_uri(image_url)
                else:
                    from django.conf import settings
                    base_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
                    image_url = base_url.rstrip('/') + image_url
            return image_url
        return None
    
    def get_images_list(self, obj):
        """Lấy danh sách hình ảnh"""
        try:
            if obj.images:
                images = json.loads(obj.images) if isinstance(obj.images, str) else obj.images
                return images if isinstance(images, list) else []
        except (json.JSONDecodeError, TypeError):
            pass
        return []
    
    def get_specifications_dict(self, obj):
        """Lấy thông số kỹ thuật"""
        try:
            if obj.specifications:
                specs = json.loads(obj.specifications) if isinstance(obj.specifications, str) else obj.specifications
                return specs if isinstance(specs, dict) else {}
        except (json.JSONDecodeError, TypeError):
            pass
        return {}
    
    def get_discount_percentage(self, obj):
        """Tính phần trăm giảm giá"""
        if obj.old_price and obj.price and obj.old_price > obj.price:
            discount = ((obj.old_price - obj.price) / obj.old_price) * 100
            return int(discount)
        return 0


class CartItemChatbotSerializer(serializers.ModelSerializer):
    """Serializer cho items trong giỏ hàng của chatbot"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    item_total = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'product_name', 'product_image', 'quantity', 'price', 'unit', 'item_total']
    
    def get_product_image(self, obj):
        """Lấy hình ảnh sản phẩm"""
        if obj.product.main_image and hasattr(obj.product.main_image, 'url'):
            return obj.product.main_image.url
        return None
    
    def get_item_total(self, obj):
        """Tính tổng giá cho item"""
        return int(obj.quantity * (obj.price or 0))
