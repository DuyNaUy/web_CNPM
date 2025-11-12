from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from uuid import uuid4
from decimal import Decimal
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer
from products.models import Product


class OrderViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Lấy đơn hàng của user hiện tại"""
        orders = Order.objects.filter(user=request.user)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_order(self, request):
        """Tạo đơn hàng mới"""
        serializer = OrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Lấy dữ liệu
                items_data = serializer.validated_data.get('items', [])
                
                if not items_data:
                    return Response(
                        {'error': 'Đơn hàng phải có ít nhất 1 sản phẩm'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Tính tổng tiền
                subtotal = Decimal(0)
                order_items = []
                
                for item_data in items_data:
                    try:
                        product_id = int(item_data.get('id'))
                        quantity = int(item_data.get('quantity', 1))
                        product = Product.objects.get(id=product_id)
                        
                        subtotal += Decimal(str(product.price)) * quantity
                        order_items.append({
                            'product': product,
                            'product_name': product.name,
                            'product_price': product.price,
                            'quantity': quantity,
                            'unit': item_data.get('unit', product.unit or ''),
                        })
                    except (ValueError, Product.DoesNotExist):
                        return Response(
                            {'error': f'Sản phẩm không tồn tại'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # Tính phí vận chuyển
                shipping_fee = Decimal(0) if subtotal >= Decimal(500000) else Decimal(30000)
                total_amount = subtotal + shipping_fee
                
                # Tạo order
                order_code = f"ORD-{timezone.now().strftime('%Y%m%d%H%M%S')}-{str(uuid4())[:8].upper()}"
                
                order = Order.objects.create(
                    user=request.user,
                    order_code=order_code,
                    status='pending',
                    full_name=serializer.validated_data['full_name'],
                    phone=serializer.validated_data['phone'],
                    email=serializer.validated_data['email'],
                    address=serializer.validated_data['address'],
                    city=serializer.validated_data['city'],
                    district=serializer.validated_data['district'],
                    note=serializer.validated_data.get('note', ''),
                    payment_method=serializer.validated_data['payment_method'],
                    payment_status='completed',  # Tạm để completed vì chưa tích hợp payment gateway
                    subtotal=subtotal,
                    shipping_fee=shipping_fee,
                    total_amount=total_amount,
                )
                
                # Tạo order items
                for item in order_items:
                    OrderItem.objects.create(
                        order=order,
                        product=item['product'],
                        product_name=item['product_name'],
                        product_price=item['product_price'],
                        quantity=item['quantity'],
                        unit=item['unit'],
                    )
                
                response_serializer = OrderSerializer(order)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def all_orders(self, request):
        """Admin - Lấy tất cả đơn hàng"""
        # Check if user is admin (has is_staff or role='admin')
        if not (request.user.is_staff or getattr(request.user, 'role', None) == 'admin'):
            return Response(
                {'error': 'Bạn không có quyền truy cập'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        orders = Order.objects.all().order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Admin - Thống kê đơn hàng"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Bạn không có quyền truy cập'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status='pending').count()
        completed_orders = Order.objects.filter(status='delivered').count()
        total_revenue = sum(order.total_amount for order in Order.objects.all())
        
        return Response({
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'completed_orders': completed_orders,
            'total_revenue': float(total_revenue),
        })
