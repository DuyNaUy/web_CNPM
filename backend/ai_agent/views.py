from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q
from django.utils import timezone
from .models import ConversationSession
from .serializers import (
    ConversationSessionSerializer, 
    ProductDetailsChatbotSerializer,
    CartItemChatbotSerializer
)
from .services import AIAgentService


class ConversationViewSet(viewsets.ModelViewSet):
    """
    API endpoints cho AI Agent conversations - SIMPLIFIED VERSION
    
    Chỉ giữ lại:
    - start_conversation: Bắt đầu cuộc trò chuyện
    - send_message: Gửi tin nhắn tới AI
    - get_history: Lấy lịch sử trò chuyện
    - close_conversation: Đóng cuộc trò chuyện
    - get_product_details: Lấy chi tiết sản phẩm (Xem thêm)
    - add_to_cart: Thêm sản phẩm vào giỏ hàng
    - buy_now: Mua ngay
    """
    
    serializer_class = ConversationSessionSerializer
    permission_classes = [AllowAny]
    lookup_field = 'session_id'

    def get_queryset(self):
        """Lấy conversation của user hoặc anonymous"""
        if self.request.user.is_authenticated:
            if hasattr(self.request.user, 'role') and self.request.user.role == 'admin':
                queryset = ConversationSession.objects.all().order_by('-updated_at')

                search_id = (self.request.query_params.get('id') or '').strip()
                customer_name = (self.request.query_params.get('customer_name') or '').strip()
                created_date = (self.request.query_params.get('created_date') or '').strip()

                if search_id:
                    id_filter = Q(session_id__icontains=search_id)
                    if search_id.isdigit():
                        id_filter = id_filter | Q(id=int(search_id))
                    queryset = queryset.filter(id_filter)
                if customer_name:
                    queryset = queryset.filter(user__full_name__icontains=customer_name)
                if created_date:
                    queryset = queryset.filter(created_at__date=created_date)

                return queryset

            return ConversationSession.objects.filter(user=self.request.user).order_by('-updated_at')
        else:
            if self.action == 'list':
                return ConversationSession.objects.none()
            return ConversationSession.objects.filter(user__isnull=True)

    def destroy(self, request, *args, **kwargs):
        """Chỉ admin được quyền xóa cuộc hội thoại"""
        if not self._is_admin_user(request.user):
            return Response({'error': 'Bạn không có quyền xóa cuộc hội thoại'}, status=status.HTTP_403_FORBIDDEN)

        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'message': 'Đã xóa cuộc hội thoại thành công'}, status=status.HTTP_200_OK)

    def _is_admin_user(self, user):
        return user.is_authenticated and hasattr(user, 'role') and user.role == 'admin'

    def _get_human_support_state(self, conversation):
        ctx = conversation.get_context()
        return ctx.get('human_support') or {}

    def _save_human_support_state(self, conversation, support_state):
        ctx = conversation.get_context()
        ctx['human_support'] = support_state
        conversation.set_context(ctx)
        conversation.save(update_fields=['context', 'updated_at'])

    def _is_human_support_request(self, message):
        normalized = (message or '').lower().strip()
        keywords = [
            'liên hệ tư vấn viên',
            'lien he tu van vien',
            'tư vấn viên',
            'tu van vien',
            'nhân viên tư vấn',
            'nhan vien tu van',
            'gặp admin',
            'gap admin',
            'gặp người thật',
            'gap nguoi that',
        ]
        return any(keyword in normalized for keyword in keywords)

    def _is_resume_ai_request(self, message):
        normalized = (message or '').lower().strip()
        keywords = [
            'chat với ai',
            'chat voi ai',
            'bật lại ai',
            'bat lai ai',
            'tiếp tục với ai',
            'tiep tuc voi ai',
            'tiếp tục chat với ai',
            'tiep tuc chat voi ai',
        ]
        return any(keyword in normalized for keyword in keywords)

    def get_object(self):
        """Override để cho phép anonymous users truy cập"""
        queryset = self.filter_queryset(self.get_queryset())
        assert self.lookup_field in self.kwargs
        filter_kwargs = {self.lookup_field: self.kwargs[self.lookup_field]}
        obj = queryset.filter(**filter_kwargs).first()
        
        # Nếu anonymous user, tìm conversation bất kể user là ai
        if obj is None and not self.request.user.is_authenticated:
            obj = ConversationSession.objects.filter(**filter_kwargs).first()
        
        if obj is None:
            from rest_framework.exceptions import NotFound
            raise NotFound()
        
        return obj

    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        """Bắt đầu một phiên hội thoại mới"""
        service = AIAgentService()
        user = request.user if request.user.is_authenticated else None
        conversation = service.start_conversation(user)
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='send_message')
    def send_message(self, request, session_id=None):
        """Gửi message tới AI Agent"""
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

        support_state = self._get_human_support_state(conversation)

        if support_state.get('active') and self._is_resume_ai_request(message):
            conversation.add_message('user', message)

            support_state['active'] = False
            support_state['unread_for_admin'] = False
            support_state['ended_at'] = timezone.now().isoformat()
            support_state['ended_by'] = 'customer'
            self._save_human_support_state(conversation, support_state)

            conversation.add_message(
                'assistant',
                'Bạn đã chuyển lại chế độ Chat với AI. Tôi có thể tiếp tục hỗ trợ bạn ngay bây giờ.'
            )

            return Response({
                'conversation_id': conversation.session_id,
                'user_message': message,
                'ai_response': 'Bạn đã chuyển lại chế độ Chat với AI. Tôi có thể tiếp tục hỗ trợ bạn ngay bây giờ.',
                'products': [],
                'ai_paused': False,
                'message': 'Đã chuyển sang Chat với AI.'
            }, status=status.HTTP_200_OK)

        # Fallback cứng: nếu khách nhắn yêu cầu tư vấn viên, bật chế độ human support ngay
        # kể cả khi frontend không gọi được endpoint request_human_support.
        if self._is_human_support_request(message):
            conversation.add_message('user', message)

            if not support_state.get('active'):
                now_iso = timezone.now().isoformat()
                support_state = {
                    'active': True,
                    'requested_at': now_iso,
                    'requested_by': 'customer',
                    'unread_for_admin': True,
                    'last_customer_message_at': now_iso,
                }
                self._save_human_support_state(conversation, support_state)
                conversation.add_message(
                    'assistant',
                    'Bạn đã được chuyển sang tư vấn viên. AI sẽ tạm dừng và admin sẽ phản hồi trực tiếp trong ít phút.'
                )
            else:
                support_state['unread_for_admin'] = True
                support_state['last_customer_message_at'] = timezone.now().isoformat()
                self._save_human_support_state(conversation, support_state)

            return Response({
                'conversation_id': conversation.session_id,
                'user_message': message,
                'ai_response': None,
                'products': [],
                'ai_paused': True,
                'message': 'Đã gửi yêu cầu liên hệ tư vấn viên. Vui lòng chờ admin phản hồi.'
            }, status=status.HTTP_200_OK)

        if support_state.get('active'):
            conversation.add_message('user', message)

            support_state['unread_for_admin'] = True
            support_state['last_customer_message_at'] = timezone.now().isoformat()
            self._save_human_support_state(conversation, support_state)

            return Response({
                'conversation_id': conversation.session_id,
                'user_message': message,
                'ai_response': None,
                'products': [],
                'ai_paused': True,
                'message': 'AI đã tạm dừng. Tư vấn viên sẽ phản hồi trực tiếp cho bạn.'
            }, status=status.HTTP_200_OK)
        
        # Gửi tin nhắn tới AI
        service = AIAgentService()
        ai_response = service.chat(conversation, message)
        
        return Response({
            'conversation_id': conversation.session_id,
            'user_message': message,
            'ai_response': ai_response['ai_response'],
            'products': ai_response.get('products', []),
            'ai_paused': False
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='request_human_support')
    def request_human_support(self, request, session_id=None):
        """Khách hàng yêu cầu chuyển sang tư vấn viên, AI sẽ tạm dừng"""
        conversation = self.get_object()

        if self._is_admin_user(request.user):
            return Response(
                {'error': 'Admin không cần yêu cầu tư vấn viên'},
                status=status.HTTP_400_BAD_REQUEST
            )

        support_state = self._get_human_support_state(conversation)
        if support_state.get('active'):
            return Response({
                'conversation_id': conversation.session_id,
                'human_support_active': True,
                'message': 'Yêu cầu tư vấn viên đã được ghi nhận trước đó.'
            }, status=status.HTTP_200_OK)

        now_iso = timezone.now().isoformat()
        support_state = {
            'active': True,
            'requested_at': now_iso,
            'requested_by': 'customer',
            'unread_for_admin': True,
            'last_customer_message_at': now_iso,
        }

        conversation.add_message(
            'assistant',
            'Bạn đã được chuyển sang tư vấn viên. AI sẽ tạm dừng và admin sẽ phản hồi trực tiếp trong ít phút.'
        )
        self._save_human_support_state(conversation, support_state)

        return Response({
            'conversation_id': conversation.session_id,
            'human_support_active': True,
            'ai_paused': True,
            'message': 'Đã gửi yêu cầu liên hệ tư vấn viên thành công.'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='get_history')
    def get_history(self, request, session_id=None):
        """Lấy lịch sử hội thoại với products data"""
        try:
            conversation = self.get_object()
        except ConversationSession.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Lấy messages với products information
        messages = conversation.get_conversation_with_products()
        
        return Response({
            'conversation_id': conversation.session_id,
            'messages': messages,
            'human_support_active': bool(self._get_human_support_state(conversation).get('active'))
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

    @action(detail=True, methods=['post'], url_path='admin_reply')
    def admin_reply(self, request, session_id=None):
        """Admin gửi tin nhắn trực tiếp cho khách hàng trong phiên hội thoại"""
        if not self._is_admin_user(request.user):
            return Response(
                {'error': 'Bạn không có quyền gửi tin nhắn admin'},
                status=status.HTTP_403_FORBIDDEN
            )

        conversation = self.get_object()
        message = (request.data.get('message') or '').strip()

        if not message:
            return Response(
                {'error': 'Message cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        conversation.add_message('admin', message)

        support_state = self._get_human_support_state(conversation)
        if support_state.get('active'):
            support_state['unread_for_admin'] = False
            support_state['last_admin_reply_at'] = timezone.now().isoformat()
            self._save_human_support_state(conversation, support_state)

        return Response({
            'conversation_id': conversation.session_id,
            'admin_message': message,
            'timestamp': conversation.updated_at.isoformat()
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='resume_ai')
    def resume_ai(self, request, session_id=None):
        """Admin kết thúc tư vấn viên, bật lại AI cho phiên hội thoại"""
        if not self._is_admin_user(request.user):
            return Response(
                {'error': 'Bạn không có quyền bật lại AI'},
                status=status.HTTP_403_FORBIDDEN
            )

        conversation = self.get_object()
        support_state = self._get_human_support_state(conversation)

        if not support_state.get('active'):
            return Response({
                'conversation_id': conversation.session_id,
                'human_support_active': False,
                'message': 'AI đang ở trạng thái hoạt động.'
            }, status=status.HTTP_200_OK)

        support_state['active'] = False
        support_state['unread_for_admin'] = False
        support_state['ended_at'] = timezone.now().isoformat()
        support_state['ended_by'] = 'admin'
        self._save_human_support_state(conversation, support_state)

        conversation.add_message(
            'assistant',
            'Tư vấn viên đã kết thúc phiên hỗ trợ trực tiếp. AI đã hoạt động trở lại để tiếp tục hỗ trợ bạn.'
        )

        return Response({
            'conversation_id': conversation.session_id,
            'human_support_active': False,
            'message': 'Đã bật lại AI cho cuộc hội thoại này.'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='customer_resume_ai')
    def customer_resume_ai(self, request, session_id=None):
        """Khách hàng tự chuyển lại chế độ chat với AI"""
        if self._is_admin_user(request.user):
            return Response(
                {'error': 'Admin không sử dụng endpoint này'},
                status=status.HTTP_400_BAD_REQUEST
            )

        conversation = self.get_object()
        support_state = self._get_human_support_state(conversation)

        if not support_state.get('active'):
            return Response({
                'conversation_id': conversation.session_id,
                'human_support_active': False,
                'message': 'AI đang ở trạng thái hoạt động.'
            }, status=status.HTTP_200_OK)

        support_state['active'] = False
        support_state['unread_for_admin'] = False
        support_state['ended_at'] = timezone.now().isoformat()
        support_state['ended_by'] = 'customer'
        self._save_human_support_state(conversation, support_state)

        conversation.add_message(
            'assistant',
            'Bạn đã chuyển lại chế độ Chat với AI. Tôi có thể tiếp tục hỗ trợ bạn ngay bây giờ.'
        )

        return Response({
            'conversation_id': conversation.session_id,
            'human_support_active': False,
            'ai_paused': False,
            'message': 'Đã chuyển sang Chat với AI.'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='get_product_details')
    def get_product_details(self, request, session_id=None):
        """[Xem thêm] Lấy chi tiết sản phẩm để hiển thị"""
        try:
            conversation = self.get_object()
        except ConversationSession.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            service = AIAgentService()
            product_details = service.get_product_details(int(product_id))
            
            if not product_details:
                return Response(
                    {'error': 'Product not found or not active'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'product': product_details
            }, status=status.HTTP_200_OK)
        except ValueError:
            return Response(
                {'error': 'Invalid product_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error fetching product: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='add_to_cart')
    def add_to_cart(self, request, session_id=None):
        """[Thêm giỏ hàng] Thêm sản phẩm vào giỏ hàng từ chatbot"""
        try:
            conversation = self.get_object()
        except ConversationSession.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            product_id = request.data.get('product_id')
            quantity = request.data.get('quantity', 1)
            unit = request.data.get('unit', '')
            
            if not product_id:
                return Response(
                    {'error': 'product_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Xác định user (authenticated hoặc anonymous)
            user = request.user if request.user.is_authenticated else None
            
            service = AIAgentService()
            result = service.add_to_cart_from_chatbot(user, int(product_id), int(quantity), unit)
            
            if result.get('success'):
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error adding to cart: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='buy_now')
    def buy_now(self, request, session_id=None):
        """[Mua ngay] Tạo đơn hàng ngay từ chatbot"""
        try:
            conversation = self.get_object()
        except ConversationSession.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            product_id = request.data.get('product_id')
            quantity = request.data.get('quantity', 1)
            unit = request.data.get('unit', '')
            
            if not product_id:
                return Response(
                    {'error': 'product_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Chỉ authenticated users mới được mua ngay
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Please login to use buy now feature'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            service = AIAgentService()
            result = service.create_buy_now_order(
                request.user, 
                int(product_id), 
                int(quantity), 
                unit
            )
            
            if result.get('success'):
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error creating order: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], url_path='search_products_by_keyword')
    def search_products_by_keyword(self, request, session_id=None):
        """[MỚI] Tìm kiếm sản phẩm theo từ khóa"""
        try:
            conversation = self.get_object()
        except ConversationSession.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        keyword = request.query_params.get('keyword', '').strip()
        if not keyword:
            return Response(
                {'error': 'keyword parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        limit = int(request.query_params.get('limit', 10))
        
        service = AIAgentService()
        products = service.search_products_by_keyword(keyword, limit)
        
        return Response({
            'keyword': keyword,
            'count': len(products),
            'products': products
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='search_products_by_category')
    def search_products_by_category(self, request, session_id=None):
        """[MỚI] Tìm kiếm sản phẩm theo danh mục"""
        try:
            conversation = self.get_object()
        except ConversationSession.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        category_name = request.query_params.get('category', '').strip()
        if not category_name:
            return Response(
                {'error': 'category parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        limit = int(request.query_params.get('limit', 10))
        
        service = AIAgentService()
        products = service.search_products_by_category(category_name, limit)
        
        return Response({
            'category': category_name,
            'count': len(products),
            'products': products
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='get_recommendations')
    def get_recommendations(self, request, session_id=None):
        """[MỚI] Lấy danh sách sản phẩm được gợi ý"""
        try:
            conversation = self.get_object()
        except ConversationSession.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        product_id = request.query_params.get('product_id', None)
        limit = int(request.query_params.get('limit', 5))
        
        service = AIAgentService()
        if product_id:
            products = service.get_product_recommendations(int(product_id), limit)
        else:
            products = service.get_product_recommendations(limit=limit)
        
        return Response({
            'recommendations': products,
            'count': len(products)
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='get_all_products')
    def get_all_products(self, request, session_id=None):
        """[MỚI] Lấy tất cả sản phẩm được organize theo danh mục"""
        try:
            conversation = self.get_object()
        except ConversationSession.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        service = AIAgentService()
        products_by_category = service.get_all_products_dict()
        
        # Tính tổng số sản phẩm
        total_products = sum(len(products) for products in products_by_category.values())
        
        return Response({
            'total_products': total_products,
            'categories': products_by_category
        }, status=status.HTTP_200_OK)
