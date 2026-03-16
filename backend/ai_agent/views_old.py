from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import ConversationSession, AutomatedOrder
from .serializers import (
    ConversationSessionSerializer, 
    ConversationSessionAdminSerializer,
    AutomatedOrderSerializer, 
    AutomatedOrderCreateSerializer
)
from .services import AIAgentService
from orders.models import Order
import uuid


class ConversationViewSet(viewsets.ModelViewSet):
    """API endpoints cho AI Agent conversations"""
    serializer_class = ConversationSessionSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable JWT authentication for this viewset
    lookup_field = 'session_id'

    def get_serializer_class(self):
        """Use admin serializer for admin users"""
        if self.request.user.is_authenticated and hasattr(self.request.user, 'role') and self.request.user.role == 'admin':
            return ConversationSessionAdminSerializer
        return ConversationSessionSerializer

    def get_queryset(self):
        """Lấy conversation của user hiện tại hoặc anonymous conversations"""
        if self.request.user.is_authenticated:
            # Admin users có thể xem tất cả conversations
            if hasattr(self.request.user, 'role') and self.request.user.role == 'admin':
                return ConversationSession.objects.all().order_by('-updated_at')
            # Regular users chỉ xem conversations của họ
            return ConversationSession.objects.filter(user=self.request.user)
        else:
            # Cho phép anonymous users - sẽ kiểm tra session_id trong get_object
            return ConversationSession.objects.filter(user__isnull=True)

    def get_object(self):
        """Override để cho phép anonymous users truy cập conversation qua session_id"""
        queryset = self.filter_queryset(self.get_queryset())
        assert self.lookup_field in self.kwargs
        filter_kwargs = {self.lookup_field: self.kwargs[self.lookup_field]}
        obj = queryset.filter(**filter_kwargs).first()
        
        if obj is None and not self.request.user.is_authenticated:
            # Nếu anonymous user, cố gắng tìm conversation bất kể user là ai
            obj = ConversationSession.objects.filter(**filter_kwargs).first()
        
        if obj is None:
            from rest_framework.exceptions import NotFound
            raise NotFound()
        
        return obj

    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        """Bắt đầu một phiên hội thoại mới"""
        service = AIAgentService()
        # Nếu user chưa đăng nhập, gửi None - backend sẽ handle
        user = request.user if request.user.is_authenticated else None
        conversation = service.start_conversation(user)
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='send_message')
    def send_message(self, request, session_id=None):
        """Gửi message tới AI Agent hoặc lưu trực tiếp nếu từ Admin"""
        try:
            conversation = self.get_object()
        except ConversationSession.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        message = request.data.get('message', '').strip()
        if not message:
            return Response(
                {'error': 'Message cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if request is from an admin user
        is_admin_message = request.data.get('is_admin', False)
        is_admin_user = (request.user.is_authenticated and 
                        hasattr(request.user, 'role') and 
                        request.user.role == 'admin')
        
        if is_admin_message and is_admin_user:
            # Admin is replying - save message directly without calling AI
            conversation.add_message('admin', message)
            return Response({
                'conversation_id': conversation.session_id,
                'message': message,
                'role': 'admin',
                'success': True
            }, status=status.HTTP_200_OK)
        else:
            # Regular user - process with AI
            service = AIAgentService()
            ai_response = service.chat(conversation, message)
            
            return Response({
                'conversation_id': conversation.session_id,
                'user_message': message,
                'ai_response': ai_response['response'],
                'recommendations': ai_response.get('recommendations', []),
                'cart': ai_response.get('cart', []),
                'should_create_order': ai_response.get('should_create_order', False)
            }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='get_history')
    def get_history(self, request, session_id=None):
        """Lấy lịch sử hội thoại"""
        try:
            conversation = self.get_object()
        except ConversationSession.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        ctx = conversation.get_context()
        messages = ctx.get('messages', [])
        
        # Use serializer to get full product info (includes main_image_url, price, etc.)
        serializer = self.get_serializer(conversation, context={'request': request})
        recs = serializer.data.get('recommendations', [])
        
        return Response({
            'conversation_id': conversation.session_id,
            'messages': messages,
            'recommendations': recs
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='close_conversation')
    def close_conversation(self, request, session_id=None):
        """Đóng phiên hội thoại"""
        try:
            conversation = self.get_object()
        except ConversationSession.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        conversation.is_active = False
        conversation.save()
        
        return Response({
            'message': 'Conversation closed successfully'
        }, status=status.HTTP_200_OK)


class AutomatedOrderViewSet(viewsets.ModelViewSet):
    """API endpoints cho automated orders"""
    serializer_class = AutomatedOrderSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'

    def get_queryset(self):
        """Lấy orders của user hiện tại hoặc anonymous orders"""
        if self.request.user.is_authenticated:
            return AutomatedOrder.objects.filter(user=self.request.user)
        else:
            # Cho phép anonymous users - sẽ kiểm tra id trong get_object
            return AutomatedOrder.objects.filter(user__isnull=True)

    def get_object(self):
        """Override để cho phép anonymous users truy cập order qua id"""
        queryset = self.filter_queryset(self.get_queryset())
        assert self.lookup_field in self.kwargs
        filter_kwargs = {self.lookup_field: self.kwargs[self.lookup_field]}
        obj = queryset.filter(**filter_kwargs).first()
        
        if obj is None and not self.request.user.is_authenticated:
            # Nếu anonymous user, cố gắng tìm order bất kể user là ai
            obj = AutomatedOrder.objects.filter(**filter_kwargs).first()
        
        if obj is None:
            from rest_framework.exceptions import NotFound
            raise NotFound()
        
        return obj

    @action(detail=True, methods=['post'], url_path='collect_address')
    def collect_address(self, request, id=None):
        """Collect địa chỉ trước khi tạo đơn hàng"""
        try:
            automated_order = self.get_object()
        except AutomatedOrder.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Cập nhật thông tin địa chỉ
        automated_order.full_name = request.data.get('full_name', automated_order.full_name or request.user.full_name)
        automated_order.phone = request.data.get('phone', automated_order.phone or request.user.phone)
        automated_order.email = request.data.get('email', automated_order.email or request.user.email)
        automated_order.address = request.data.get('address', automated_order.address or '')
        automated_order.city = request.data.get('city', automated_order.city or '')
        automated_order.district = request.data.get('district', automated_order.district or '')
        automated_order.status = 'confirmed'
        automated_order.save()
        
        return Response({
            'message': 'Address collected successfully',
            'order_id': automated_order.id,
            'status': automated_order.status
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='confirm_and_create')
    def confirm_and_create(self, request, id=None):
        """Xác nhận draft order và tạo đơn hàng thực tế"""
        try:
            automated_order = self.get_object()
        except AutomatedOrder.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if automated_order.status not in ['draft', 'confirmed']:
            return Response(
                {'error': 'Only draft or confirmed orders can be created'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra có thông tin địa chỉ không
        if not automated_order.address or not automated_order.phone:
            return Response(
                {'error': 'Please provide address and phone number first',
                 'message': 'Vui lòng cung cấp thông tin địa chỉ trước'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Tạo Order thực tế
            from decimal import Decimal
            
            order_code = f"ORD-{uuid.uuid4().hex[:8].upper()}"
            
            # Calculate subtotal from items
            products_data = automated_order.get_suggested_products()
            subtotal = sum(Decimal(str(item.get('subtotal', 0))) for item in products_data)
            shipping_fee = automated_order.shipping_fee or Decimal('30000')
            total_amount = subtotal + shipping_fee

            order = Order.objects.create(
                user=automated_order.user,
                order_code=order_code,
                full_name=automated_order.full_name or (request.user.full_name if request.user.is_authenticated else ''),
                phone=automated_order.phone,
                email=automated_order.email or (request.user.email if request.user.is_authenticated else ''),
                address=automated_order.address,
                city=automated_order.city,
                district=automated_order.district,
                subtotal=subtotal,
                shipping_fee=shipping_fee,
                total_amount=total_amount,
                payment_method=request.data.get('payment_method', 'cod'),
                note=f"Tạo từ AI Agent tư vấn. {automated_order.ai_notes or ''}"
            )
            
            # Thêm items vào order (Sử dụng OrderItem thay vì CartItem)
            from orders.models import OrderItem
            
            for item_data in products_data:
                OrderItem.objects.create(
                    order=order,
                    product_id=item_data['product_id'],
                    product_name=item_data['name'],
                    product_price=Decimal(str(item_data['price'])),
                    quantity=item_data['quantity'],
                    unit=item_data.get('size', '') or item_data.get('unit', '')
                )
            
            # Xử lý thanh toán MoMo (Đồng bộ từ OrderViewSet)
            pay_url = None
            if order.payment_method == 'momo':
                from orders.payment_utils import MoMoPayment
                try:
                    momo_response = MoMoPayment.create_payment(
                        order_id=order.id,
                        amount=int(total_amount),
                        order_info=f"Thanh toan don hang {order.order_code}"
                    )
                    
                    if momo_response.get('resultCode') == 0:
                        order.momo_request_id = momo_response.get('requestId')
                        order.momo_order_id = momo_response.get('orderId')
                        order.save(update_fields=['momo_request_id', 'momo_order_id'])
                        pay_url = momo_response.get('payUrl')
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error creating MoMo payment for AI order: {str(e)}")

            # Update status
            automated_order.status = 'created'
            automated_order.created_order_id = order.order_code
            automated_order.save()

            # Add internal system message to signal AI success
            automated_order.conversation.add_message('assistant', f"✅ Đặt hàng thành công! Mã đơn hàng của bạn là {order.order_code}. Bạn có thể xem lại trong phần Đơn hàng của tôi.")
            
            return Response({
                'message': 'Order created successfully',
                'order_code': order.order_code,
                'order_id': order.id,
                'payUrl': pay_url
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to create order: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, id=None):
        """Hủy automated order"""
        try:
            automated_order = self.get_object()
        except AutomatedOrder.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if automated_order.status == 'created':
            return Response(
                {'error': 'Cannot cancel orders that have been created'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        automated_order.status = 'cancelled'
        automated_order.save()
        
        return Response({
            'message': 'Order cancelled successfully'
        }, status=status.HTTP_200_OK)
