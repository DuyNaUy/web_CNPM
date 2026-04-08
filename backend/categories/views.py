from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from django.db.models import Q
from django.db import IntegrityError
from .models import Category
from .serializers import CategorySerializer
import logging

logger = logging.getLogger(__name__)


class IsAdminUser(BasePermission):
    """Custom permission to check if user is admin"""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or getattr(request.user, 'role', None) == 'admin')
        )

class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet cho quản lý danh mục sản phẩm.
    Hỗ trợ CRUD operations: list, create, retrieve, update, delete
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'status']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """
        Cho phép mọi người xem danh sách và chi tiết danh mục
        Chỉ admin mới được tạo, sửa, xóa
        """
        if self.action in ['list', 'retrieve', 'active']:
            permission_classes = [AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy', 'toggle_status', 'delete_category']:
            permission_classes = [IsAuthenticated, IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def list(self, request, *args, **kwargs):
        """Lấy danh sách danh mục với tìm kiếm và lọc"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Lọc theo status nếu có
        status_param = request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Tìm kiếm theo tên
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Tạo danh mục mới"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'message': 'Tạo danh mục thành công',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """Cập nhật thông tin danh mục"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'message': 'Cập nhật danh mục thành công',
            'data': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Xóa danh mục

        Hỗ trợ tuỳ chọn trong body: reassign_to (id) hoặc force (true).
        """
        # Kiểm tra quyền admin
        if not (request.user.is_staff or getattr(request.user, 'role', None) == 'admin'):
            return Response(
                {'error': 'Bạn không có quyền xóa danh mục'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            instance = self.get_object()

            reassign_to = request.data.get('reassign_to')
            force = request.data.get('force', False)

            # Nếu có sản phẩm trong danh mục
            if hasattr(instance, 'products') and instance.products.exists():
                product_count = instance.products.count()

                # Nếu danh mục đã ngừng hoạt động, cho phép xóa luôn cả sản phẩm
                if instance.status == 'inactive':
                    try:
                        from products.models import Product
                        Product.objects.filter(category_id=instance.id).delete()
                        category_name = instance.name
                        category_id = instance.id
                        instance.delete()
                        return Response({'message': f'Đã xóa danh mục "{category_name}" và {product_count} sản phẩm thành công', 'data': {'id': category_id, 'name': category_name}}, status=status.HTTP_200_OK)
                    except IntegrityError:
                        return Response({'error': 'Không thể xóa danh mục hoặc sản phẩm liên quan.'}, status=status.HTTP_400_BAD_REQUEST)

                # Reassign to another category
                if reassign_to:
                    try:
                        new_cat = Category.objects.get(pk=int(reassign_to))
                    except Category.DoesNotExist:
                        return Response({'error': 'Danh mục để chuyển không tồn tại.'}, status=status.HTTP_400_BAD_REQUEST)

                    if new_cat.id == instance.id:
                        return Response({'error': 'Không thể chuyển sản phẩm sang cùng một danh mục.'}, status=status.HTTP_400_BAD_REQUEST)

                    try:
                        from products.models import Product
                    except Exception:
                        logger.exception('Products app import failed')
                        return Response({'error': 'Products app không khả dụng.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                    Product.objects.filter(category_id=instance.id).update(category=new_cat)
                    try:
                        category_name = instance.name
                        category_id = instance.id
                        instance.delete()
                        return Response({'message': f'Chuyển {product_count} sản phẩm sang danh mục "{new_cat.name}" và xóa danh mục "{category_name}" thành công', 'data': {'id': category_id, 'name': category_name}}, status=status.HTTP_200_OK)
                    except IntegrityError:
                        return Response({'error': 'Không thể xóa danh mục. Danh mục này có liên kết với dữ liệu khác.'}, status=status.HTTP_400_BAD_REQUEST)

                # Force delete products then category
                if force:
                    try:
                        from products.models import Product
                        Product.objects.filter(category_id=instance.id).delete()
                        category_name = instance.name
                        category_id = instance.id
                        instance.delete()
                        return Response({'message': f'Đã xóa {product_count} sản phẩm và danh mục "{category_name}" thành công', 'data': {'id': category_id, 'name': category_name}}, status=status.HTTP_200_OK)
                    except IntegrityError:
                        return Response({'error': 'Không thể xóa danh mục hoặc sản phẩm liên quan.'}, status=status.HTTP_400_BAD_REQUEST)

                return Response({'error': f'Không thể xóa danh mục "{instance.name}" vì hiện đang có {product_count} sản phẩm. Vui lòng di chuyển hoặc xóa các sản phẩm trước khi xóa danh mục.'}, status=status.HTTP_400_BAD_REQUEST)

            # Empty category: delete normally
            try:
                category_id = instance.id
                category_name = instance.name
                self.perform_destroy(instance)
                return Response({'message': f'Xóa danh mục "{category_name}" thành công', 'data': {'id': category_id, 'name': category_name}}, status=status.HTTP_200_OK)
            except IntegrityError:
                return Response({'error': 'Không thể xóa danh mục. Danh mục này có liên kết với dữ liệu khác.'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception('Unhandled error in destroy category')
            return Response({'error': 'Lỗi máy chủ khi xóa danh mục', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Lấy danh sách các danh mục đang hoạt động"""
        categories = self.queryset.filter(status='active')
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Chuyển đổi trạng thái hoạt động/ngừng hoạt động"""
        category = self.get_object()
        category.status = 'inactive' if category.status == 'active' else 'active'
        category.save()
        serializer = self.get_serializer(category)
        return Response({
            'message': f'Đã chuyển trạng thái danh mục thành {category.get_status_display()}',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def delete_category(self, request, pk=None):
        """
        Admin endpoint để xóa danh mục
        Kiểm tra xem danh mục có sản phẩm hay không
        """
        # Kiểm tra quyền admin
        if not (request.user.is_staff or getattr(request.user, 'role', None) == 'admin'):
            return Response(
                {'error': 'Bạn không có quyền xóa danh mục'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            category = self.get_object()

            # Hỗ trợ tuỳ chọn xóa: reassign_to (id) hoặc force (true)
            reassign_to = request.data.get('reassign_to')
            force = request.data.get('force', False)

            # Nếu có sản phẩm trong danh mục
            if hasattr(category, 'products') and category.products.exists():
                product_count = category.products.count()

                # Nếu danh mục đã ngừng hoạt động, cho phép xóa luôn cả sản phẩm
                if category.status == 'inactive':
                    try:
                        from products.models import Product
                        Product.objects.filter(category_id=category.id).delete()
                        category_name = category.name
                        category_id = category.id
                        category.delete()
                        return Response({'message': f'Đã xóa danh mục "{category_name}" và {product_count} sản phẩm thành công', 'data': {'id': category_id, 'name': category_name}}, status=status.HTTP_200_OK)
                    except IntegrityError:
                        return Response({'error': 'Không thể xóa danh mục hoặc sản phẩm liên quan.'}, status=status.HTTP_400_BAD_REQUEST)

                # Nếu admin muốn chuyển sản phẩm sang danh mục khác
                if reassign_to:
                    try:
                        new_cat = Category.objects.get(pk=int(reassign_to))
                    except Category.DoesNotExist:
                        return Response({'error': 'Danh mục để chuyển không tồn tại.'}, status=status.HTTP_400_BAD_REQUEST)

                    if new_cat.id == category.id:
                        return Response({'error': 'Không thể chuyển sản phẩm sang cùng một danh mục.'}, status=status.HTTP_400_BAD_REQUEST)

                    # Import Product locally to avoid circular imports
                    try:
                        from products.models import Product
                    except Exception:
                        logger.exception('Products app import failed')
                        return Response({'error': 'Products app không khả dụng.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                    # Reassign products
                    Product.objects.filter(category_id=category.id).update(category=new_cat)
                    # Now safe to delete
                    try:
                        category_name = category.name
                        category_id = category.id
                        category.delete()
                        return Response({'message': f'Chuyển {product_count} sản phẩm sang danh mục "{new_cat.name}" và xóa danh mục "{category_name}" thành công', 'data': {'id': category_id, 'name': category_name}}, status=status.HTTP_200_OK)
                    except IntegrityError:
                        return Response({'error': 'Không thể xóa danh mục. Danh mục này có liên kết với dữ liệu khác.'}, status=status.HTTP_400_BAD_REQUEST)

                # Nếu admin yêu cầu force xóa (xóa luôn sản phẩm)
                if force:
                    try:
                        # import Product locally to avoid circular imports
                        from products.models import Product
                        # delete products in this category first
                        Product.objects.filter(category_id=category.id).delete()
                        category_name = category.name
                        category_id = category.id
                        category.delete()
                        return Response({'message': f'Đã xóa {product_count} sản phẩm và danh mục "{category_name}" thành công', 'data': {'id': category_id, 'name': category_name}}, status=status.HTTP_200_OK)
                    except IntegrityError:
                        return Response({'error': 'Không thể xóa danh mục hoặc sản phẩm liên quan.'}, status=status.HTTP_400_BAD_REQUEST)

                # Nếu không có tuỳ chọn hợp lệ, chặn xóa và trả về thông báo
                return Response({'error': f'Không thể xóa danh mục "{category.name}" vì hiện đang có {product_count} sản phẩm. Vui lòng di chuyển hoặc xóa các sản phẩm trước khi xóa danh mục.'}, status=status.HTTP_400_BAD_REQUEST)

            # Nếu danh mục rỗng, xóa bình thường
            try:
                category_id = category.id
                category_name = category.name
                category.delete()
                return Response({'message': f'Xóa danh mục "{category_name}" thành công', 'data': {'id': category_id, 'name': category_name}}, status=status.HTTP_200_OK)
            except IntegrityError:
                return Response({'error': 'Không thể xóa danh mục. Danh mục này có liên kết với dữ liệu khác.'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception('Unhandled error in delete_category')
            return Response({'error': 'Lỗi máy chủ khi xóa danh mục', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
