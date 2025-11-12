from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from django.db import IntegrityError
from .models import Category
from .serializers import CategorySerializer


class IsAdminUser:
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
        elif self.action in ['create', 'update', 'partial_update', 'destroy', 'toggle_status']:
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
        """Xóa danh mục"""
        # Kiểm tra quyền admin
        if not (request.user.is_staff or getattr(request.user, 'role', None) == 'admin'):
            return Response(
                {'error': 'Bạn không có quyền xóa danh mục'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance = self.get_object()
        
        # Kiểm tra xem danh mục có sản phẩm không
        if hasattr(instance, 'products') and instance.products.exists():
            product_count = instance.products.count()
            return Response(
                {
                    'error': f'Không thể xóa danh mục này vì đang chứa {product_count} sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm sang danh mục khác trước.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            category_name = instance.name
            self.perform_destroy(instance)
            return Response(
                {
                    'message': f'Xóa danh mục "{category_name}" thành công',
                    'data': {
                        'id': instance.id,
                        'name': category_name
                    }
                },
                status=status.HTTP_200_OK
            )
        except IntegrityError as e:
            return Response(
                {'error': 'Không thể xóa danh mục. Danh mục này có liên kết với dữ liệu khác.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Lỗi khi xóa danh mục: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
        
        category = self.get_object()
        
        # Kiểm tra xem danh mục có sản phẩm không
        if hasattr(category, 'products') and category.products.exists():
            product_count = category.products.count()
            return Response(
                {
                    'error': f'Không thể xóa danh mục này vì đang chứa {product_count} sản phẩm',
                    'product_count': product_count
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            category_id = category.id
            category_name = category.name
            category.delete()
            return Response(
                {
                    'message': f'Xóa danh mục "{category_name}" thành công',
                    'data': {
                        'id': category_id,
                        'name': category_name
                    }
                },
                status=status.HTTP_200_OK
            )
        except IntegrityError:
            return Response(
                {'error': 'Không thể xóa danh mục. Danh mục này có liên kết với dữ liệu khác.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Lỗi khi xóa danh mục: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
