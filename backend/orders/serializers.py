from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'product_price', 'quantity', 'unit']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    
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
