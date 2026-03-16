from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import ConversationSession
from .serializers import (
    ConversationSessionSerializer, 
    ProductDetailsChatbotSerializer,
    CartItemChatbotSerializer
)
from .services import AIAgentService
import uuid


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
    authentication_classes = []
    lookup_field = 'session_id'

    def get_queryset(self):
        """Lấy conversation của user hoặc anonymous"""
        if self.request.user.is_authenticated:
            return ConversationSession.objects.filter(user=self.request.user)
        else:
            return ConversationSession.objects.filter(user__isnull=True)

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
        
        # Gửi tin nhắn tới AI
        service = AIAgentService()
        ai_response = service.chat(conversation, message)
        
        return Response({
            'conversation_id': conversation.session_id,
            'user_message': message,
            'ai_response': ai_response['ai_response'],
            'products': ai_response.get('products', [])
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
            'messages': messages
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
