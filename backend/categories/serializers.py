from rest_framework import serializers
from .models import Category

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'status', 'product_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_name(self, value):
        """Kiểm tra tên danh mục không được trống và không trùng lặp"""
        if not value or not value.strip():
            raise serializers.ValidationError("Tên danh mục không được để trống.")
        
        # Kiểm tra trùng lặp khi tạo mới hoặc cập nhật
        instance = self.instance
        if instance:
            # Cập nhật: kiểm tra trùng với danh mục khác
            if Category.objects.exclude(pk=instance.pk).filter(name__iexact=value).exists():
                raise serializers.ValidationError("Tên danh mục đã tồn tại.")
        else:
            # Tạo mới: kiểm tra trùng
            if Category.objects.filter(name__iexact=value).exists():
                raise serializers.ValidationError("Tên danh mục đã tồn tại.")
        
        return value.strip()
