from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from uuid import uuid4
from decimal import Decimal
from .models import Order, OrderItem, Cart, CartItem
from .serializers import OrderSerializer, OrderCreateSerializer, CartSerializer, CartItemDetailSerializer
from products.models import Product
import logging

logger = logging.getLogger(__name__)


class CartViewSet(viewsets.ViewSet):
    """ViewSet cho giỏ hàng"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_cart(self, request):
        """Lấy giỏ hàng của user hiện tại"""
        try:
            cart, created = Cart.objects.get_or_create(user=request.user)
            serializer = CartSerializer(cart, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error getting cart: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """Thêm sản phẩm vào giỏ hàng"""
        try:
            product_id = request.data.get('product_id')
            quantity = int(request.data.get('quantity', 1))
            unit = request.data.get('unit', '')
            
            if not product_id:
                return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if quantity <= 0:
                return Response({'error': 'quantity must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Lấy sản phẩm
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Kiểm tra số lượng tồn kho
            if product.stock < quantity:
                return Response(
                    {'error': f'Số lượng tồn kho không đủ. Tồn kho: {product.stock}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Lấy hoặc tạo giỏ hàng
            cart, created = Cart.objects.get_or_create(user=request.user)
            
            # Thêm hoặc cập nhật sản phẩm trong giỏ hàng
            cart_item, item_created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                unit=unit,
                defaults={'quantity': quantity}
            )
            
            if not item_created:
                # Nếu sản phẩm đã có trong giỏ, cập nhật số lượng
                new_quantity = cart_item.quantity + quantity
                if product.stock < new_quantity:
                    return Response(
                        {'error': f'Số lượng tồn kho không đủ. Tồn kho: {product.stock}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                cart_item.quantity = new_quantity
                cart_item.save()
            
            # Trả về giỏ hàng được cập nhật
            serializer = CartSerializer(cart, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except ValueError as e:
            return Response({'error': 'Invalid quantity'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error adding item to cart: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def update_item(self, request):
        """Cập nhật số lượng sản phẩm trong giỏ hàng"""
        try:
            item_id = request.data.get('item_id')
            quantity = int(request.data.get('quantity', 1))
            
            if not item_id:
                return Response({'error': 'item_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if quantity <= 0:
                return Response({'error': 'quantity must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Lấy giỏ hàng của user
            try:
                cart = Cart.objects.get(user=request.user)
            except Cart.DoesNotExist:
                return Response({'error': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Lấy mục trong giỏ hàng
            try:
                cart_item = CartItem.objects.get(id=item_id, cart=cart)
            except CartItem.DoesNotExist:
                return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Kiểm tra số lượng tồn kho
            if cart_item.product.stock < quantity:
                return Response(
                    {'error': f'Số lượng tồn kho không đủ. Tồn kho: {cart_item.product.stock}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Cập nhật số lượng
            cart_item.quantity = quantity
            cart_item.save()
            
            # Trả về giỏ hàng được cập nhật
            serializer = CartSerializer(cart, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except ValueError as e:
            return Response({'error': 'Invalid quantity'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating cart item: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """Xóa sản phẩm khỏi giỏ hàng"""
        try:
            item_id = request.data.get('item_id')
            
            if not item_id:
                return Response({'error': 'item_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Lấy giỏ hàng của user
            try:
                cart = Cart.objects.get(user=request.user)
            except Cart.DoesNotExist:
                return Response({'error': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Xóa mục trong giỏ hàng
            try:
                cart_item = CartItem.objects.get(id=item_id, cart=cart)
                cart_item.delete()
            except CartItem.DoesNotExist:
                return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Trả về giỏ hàng được cập nhật
            serializer = CartSerializer(cart, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error removing cart item: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def clear_cart(self, request):
        """Xóa tất cả sản phẩm khỏi giỏ hàng"""
        try:
            # Lấy giỏ hàng của user
            try:
                cart = Cart.objects.get(user=request.user)
                cart.items.all().delete()
            except Cart.DoesNotExist:
                pass
            
            # Tạo giỏ hàng mới rỗng
            cart, created = Cart.objects.get_or_create(user=request.user)
            serializer = CartSerializer(cart, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error clearing cart: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                order = Order.objects.create(
                    user=request.user,
                    order_code='',  # Sẽ được cập nhật sau khi có ID
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
                
                # Cập nhật order_code với format DH + 3 chữ số ID
                order.order_code = f"DH{order.id:03d}"
                order.save(update_fields=['order_code'])
                
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

    @action(detail=False, methods=['post'])
    def update_order_status(self, request):
        """Admin - Cập nhật trạng thái đơn hàng"""
        # Check if user is admin
        if not (request.user.is_staff or getattr(request.user, 'role', None) == 'admin'):
            return Response(
                {'error': 'Bạn không có quyền truy cập'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            order_id = request.data.get('order_id')
            new_status = request.data.get('status')
            
            if not order_id or not new_status:
                return Response(
                    {'error': 'order_id và status là bắt buộc'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Kiểm tra trạng thái hợp lệ
            valid_statuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled']
            if new_status not in valid_statuses:
                return Response(
                    {'error': f'Trạng thái không hợp lệ. Chọn từ: {", ".join(valid_statuses)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            order = Order.objects.get(id=order_id)
            order.status = new_status
            order.save()
            
            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Order.DoesNotExist:
            return Response(
                {'error': 'Đơn hàng không tồn tại'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating order status: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
