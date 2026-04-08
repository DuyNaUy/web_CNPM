from django.contrib import admin
from .models import ConversationSession, ConversationMessage, AIRecommendation


@admin.register(ConversationSession)
class ConversationSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'title', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['session_id', 'user__username', 'title']
    readonly_fields = ['session_id', 'created_at', 'updated_at']


@admin.register(AIRecommendation)
class AIRecommendationAdmin(admin.ModelAdmin):
    list_display = [
        'conversation', 'product', 'confidence_score', 'quantity',
        'is_accepted', 'is_selected_for_order', 'created_order_code', 'created_at'
    ]
    list_filter = ['is_accepted', 'is_selected_for_order', 'created_at', 'confidence_score']
    search_fields = ['conversation__session_id', 'product__name']
    readonly_fields = ['created_at']


@admin.register(ConversationMessage)
class ConversationMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'role', 'short_content', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['conversation__session_id', 'content']
    readonly_fields = ['created_at']

    def short_content(self, obj):
        return (obj.content[:60] + '...') if len(obj.content) > 60 else obj.content

    short_content.short_description = 'Nội dung'
