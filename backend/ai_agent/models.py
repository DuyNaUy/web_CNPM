from django.db import models
from django.utils import timezone
from users.models import User
from products.models import Product
import json


class ConversationSession(models.Model):
    """Phiên hội thoại với AI Agent"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_conversations', null=True, blank=True)
    session_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=255, blank=True, default="Tư vấn bán hàng")
    customer_id = models.CharField(max_length=10, blank=True, null=True, help_text='ID khách hàng vãng lai (auto-generated)')
    customer_phone = models.CharField(max_length=20, blank=True, null=True, help_text='SĐT khách hàng (nếu là vãng lai)')
    customer_email = models.EmailField(blank=True, null=True, help_text='Email khách hàng (nếu là vãng lai)')
    context = models.TextField(blank=True, help_text="JSON context for conversation history")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Phiên hội thoại AI'
        verbose_name_plural = 'Phiên hội thoại AI'

    def __str__(self):
        user_part = self.user.username if self.user else 'anonymous'
        return f"{user_part} - {self.session_id}"

    def _load_context_dict(self):
        """Parse raw context JSON safely."""
        try:
            return json.loads(self.context) if self.context else {}
        except json.JSONDecodeError:
            return {}

    def _save_context_dict(self, data):
        """Serialize context dict to JSON text."""
        self.context = json.dumps(data, ensure_ascii=False)

    def get_context(self):
        """Lấy context dưới dạng dict, ưu tiên message từ bảng riêng nếu có."""
        ctx = self._load_context_dict()

        # Backward compatible read path:
        # - Nếu có dữ liệu trong bảng ConversationMessage -> dùng dữ liệu này
        # - Nếu chưa có -> fallback về messages cũ trong context JSON
        db_messages = [
            message.to_context_message()
            for message in self.messages.order_by('created_at').all()
        ]
        if db_messages:
            ctx['messages'] = db_messages
        else:
            ctx.setdefault('messages', [])

        return ctx

    def set_context(self, data):
        """Lưu context dưới dạng JSON (không ghi đè messages trong bảng riêng)."""
        payload = dict(data or {})
        payload.pop('messages', None)
        self._save_context_dict(payload)

    def add_message(self, role, content, products=None):
        """Thêm message theo cơ chế dual-write để chuyển đổi an toàn."""
        ctx = self._load_context_dict()
        legacy_messages = list(ctx.get('messages', []))

        message_obj = {
            'role': role,
            'content': content,
            'timestamp': timezone.now().isoformat()
        }
        # Thêm products nếu có (cho assistant messages)
        if products:
            message_obj['products'] = products

        # Write path mới: lưu vào bảng tin nhắn riêng
        ConversationMessage.objects.create(
            conversation=self,
            role=role,
            content=content,
            products=json.dumps(products or [], ensure_ascii=False),
        )

        # Legacy write path: tiếp tục append vào context JSON để tránh vỡ logic cũ
        legacy_messages.append(message_obj)
        ctx['messages'] = legacy_messages
        self._save_context_dict(ctx)
        self.save(update_fields=['context', 'updated_at'])

    def get_conversation_with_products(self):
        """Lấy messages với products data."""
        return self.get_context().get('messages', [])


class ConversationMessage(models.Model):
    """Tin nhắn chat được chuẩn hóa theo từng dòng trong DB."""
    ROLE_CHOICES = [
        ('user', 'Khách hàng'),
        ('assistant', 'AI'),
        ('admin', 'Quản trị viên'),
    ]

    conversation = models.ForeignKey(
        ConversationSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    products = models.TextField(blank=True, help_text='JSON array of products')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Tin nhắn hội thoại'
        verbose_name_plural = 'Tin nhắn hội thoại'
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['role', 'created_at']),
        ]

    def __str__(self):
        return f"{self.conversation.session_id} [{self.role}]"

    def get_products(self):
        try:
            return json.loads(self.products) if self.products else []
        except json.JSONDecodeError:
            return []

    def to_context_message(self):
        data = {
            'role': self.role,
            'content': self.content,
            'timestamp': self.created_at.isoformat(),
        }
        products = self.get_products()
        if products:
            data['products'] = products
        return data


class AIRecommendation(models.Model):
    """Lưu trữ sản phẩm được AI đề xuất"""
    conversation = models.ForeignKey(ConversationSession, on_delete=models.CASCADE, related_name='recommendations')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    reason = models.TextField(help_text="Lý do AI đề xuất sản phẩm này")
    confidence_score = models.FloatField(default=0.5, help_text="Độ tin cậy của đề xuất (0-1)")
    quantity = models.PositiveIntegerField(default=1, help_text="Số lượng được đề xuất")
    is_accepted = models.BooleanField(default=False)
    is_selected_for_order = models.BooleanField(default=False, help_text='Đánh dấu đề xuất được dùng để tạo đơn hàng')
    created_order_code = models.CharField(max_length=50, blank=True, null=True, help_text='Mã đơn hàng thật được tạo từ đề xuất')
    converted_at = models.DateTimeField(blank=True, null=True, help_text='Thời điểm đề xuất được chuyển thành đơn hàng thật')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Đề xuất sản phẩm AI'
        verbose_name_plural = 'Đề xuất sản phẩm AI'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.conversation.session_id} - {self.product.name}"

    def mark_as_order_created(self, order_code: str):
        """Đánh dấu đề xuất đã được chuyển thành đơn hàng thật."""
        self.is_selected_for_order = True
        self.created_order_code = order_code
        self.converted_at = timezone.now()
        self.save(update_fields=['is_selected_for_order', 'created_order_code', 'converted_at'])
