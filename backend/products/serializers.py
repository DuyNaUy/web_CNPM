from rest_framework import serializers
from .models import Product, ProductImage
from categories.serializers import CategorySerializer
import json

class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'is_main', 'order']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách sản phẩm (không cần tất cả thông tin)"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    main_image_url = serializers.SerializerMethodField()
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'category_name',
            'price', 'old_price', 'discount_percentage', 'stock', 'unit',
            'rating', 'reviews_count', 'sold_count',
            'main_image', 'main_image_url', 'description',
            'status', 'in_stock',
            'created_at', 'updated_at'
        ]
    
    def get_main_image_url(self, obj):
        if obj.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return obj.main_image.url
        return None


class ProductSerializer(serializers.ModelSerializer):
    """Serializer đầy đủ cho chi tiết sản phẩm"""
    category_detail = CategorySerializer(source='category', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    main_image_url = serializers.SerializerMethodField()
    product_images = ProductImageSerializer(many=True, read_only=True)
    images_list = serializers.ReadOnlyField()
    specifications_dict = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    
    # Fields cho việc upload images và specifications
    images_data = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text="List of image URLs or base64 strings"
    )
    specifications_data = serializers.JSONField(
        write_only=True,
        required=False,
        help_text="Specifications as JSON object"
    )
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'category_name', 'category_detail',
            'price', 'old_price', 'discount_percentage', 'stock', 'unit',
            'rating', 'reviews_count', 'sold_count',
            'description', 'detail_description',
            'main_image', 'main_image_url', 'images', 'images_list', 'images_data',
            'product_images', 'specifications', 'specifications_dict', 'specifications_data',
            'origin', 'weight', 'preservation', 'expiry', 'certification',
            'status', 'in_stock',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['slug', 'rating', 'reviews_count', 'sold_count', 'created_at', 'updated_at']
    
    def get_main_image_url(self, obj):
        if obj.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return obj.main_image.url
        return None
    
    def validate_price(self, value):
        """Kiểm tra giá phải lớn hơn 0"""
        if value <= 0:
            raise serializers.ValidationError("Giá sản phẩm phải lớn hơn 0")
        return value
    
    def validate_stock(self, value):
        """Kiểm tra số lượng phải >= 0"""
        if value < 0:
            raise serializers.ValidationError("Số lượng tồn kho không được âm")
        return value
    
    def validate(self, data):
        """Kiểm tra old_price phải lớn hơn price nếu có"""
        old_price = data.get('old_price')
        price = data.get('price')
        
        if old_price and price and old_price <= price:
            raise serializers.ValidationError({
                "old_price": "Giá cũ phải lớn hơn giá hiện tại"
            })
        
        return data
    
    def create(self, validated_data):
        # Extract custom fields
        images_data = validated_data.pop('images_data', [])
        specifications_data = validated_data.pop('specifications_data', {})
        
        # Convert to JSON strings
        if images_data:
            validated_data['images'] = json.dumps(images_data)
        if specifications_data:
            validated_data['specifications'] = json.dumps(specifications_data)
        
        product = Product.objects.create(**validated_data)
        return product
    
    def update(self, instance, validated_data):
        # Extract custom fields
        images_data = validated_data.pop('images_data', None)
        specifications_data = validated_data.pop('specifications_data', None)
        
        # Convert to JSON strings if provided
        if images_data is not None:
            validated_data['images'] = json.dumps(images_data)
        if specifications_data is not None:
            validated_data['specifications'] = json.dumps(specifications_data)
        
        # Update instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer đơn giản hơn cho create/update từ admin"""
    
    class Meta:
        model = Product
        fields = [
            'name', 'category', 'price', 'old_price', 'stock', 'unit',
            'description', 'detail_description',
            'main_image', 'images', 'specifications',
            'origin', 'weight', 'preservation', 'expiry', 'certification',
            'status'
        ]
    
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Giá sản phẩm phải lớn hơn 0")
        return value
    
    def validate(self, data):
        old_price = data.get('old_price')
        price = data.get('price')
        
        if old_price and price and old_price <= price:
            raise serializers.ValidationError({
                "old_price": "Giá cũ phải lớn hơn giá hiện tại"
            })
        
        return data
