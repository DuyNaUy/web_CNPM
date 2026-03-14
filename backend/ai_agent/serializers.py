from rest_framework import serializers
from .models import ConversationSession, AIRecommendation, AutomatedOrder
from products.serializers import ProductSerializer


class AIRecommendationSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = AIRecommendation
        fields = ['id', 'product', 'reason', 'confidence_score', 'quantity', 'is_accepted', 'created_at']


class ConversationSessionSerializer(serializers.ModelSerializer):
    recommendations = AIRecommendationSerializer(many=True, read_only=True)
    
    class Meta:
        model = ConversationSession
        fields = ['id', 'session_id', 'title', 'created_at', 'updated_at', 'is_active', 'recommendations']


class ConversationSessionAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin view with user info and messages"""
    user_full_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    
    def get_user_full_name(self, obj):
        return obj.user.full_name if obj.user else None
    
    def get_user_email(self, obj):
        return obj.user.email if obj.user else None
    
    def get_user_id(self, obj):
        return obj.user.id if obj.user else None
    
    def get_message_count(self, obj):
        context = obj.get_context()
        return len(context.get('messages', []))
    
    class Meta:
        model = ConversationSession
        fields = [
            'id', 'session_id', 'title', 'user_id', 'user_full_name', 'user_email', 
            'created_at', 'updated_at', 'is_active', 'message_count'
        ]


class AutomatedOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomatedOrder
        fields = [
            'id', 'status', 'conversation', 'suggested_products', 'ai_notes',
            'full_name', 'phone', 'email', 'address', 'city', 'district',
            'estimated_total', 'shipping_fee', 'created_order_id', 'created_at', 'updated_at'
        ]


class AutomatedOrderCreateSerializer(serializers.ModelSerializer):
    conversation_id = serializers.SlugRelatedField(
        slug_field='session_id',
        queryset=ConversationSession.objects.all(),
        source='conversation'
    )

    class Meta:
        model = AutomatedOrder
        fields = [
            'conversation_id', 'full_name', 'phone', 'email', 'address', 'city', 'district',
            'suggested_products', 'estimated_total'
        ]
