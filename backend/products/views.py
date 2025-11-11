from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, ProductImage
from .serializers import (
    ProductSerializer,
    ProductListSerializer,
    ProductCreateUpdateSerializer,
    ProductImageSerializer
)

class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet cho quản lý sản phẩm.
    Hỗ trợ CRUD operations, upload ảnh, filter, search
    Có thể truy vấn theo ID hoặc slug
    """
    queryset = Product.objects.select_related('category').all()
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'detail_description']
    ordering_fields = ['name', 'price', 'stock', 'rating', 'sold_count', 'created_at']
    ordering = ['-created_at']
    filterset_fields = ['category', 'status']
    lookup_field = 'slug'
    lookup_value_regex = '[^/]+'  # Allow any characters except /
    
    def get_serializer_class(self):
        """Sử dụng serializer khác nhau cho các action"""
        if self.action == 'list':
            return ProductListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductSerializer
    
    def get_permissions(self):
        """
        Cho phép mọi người xem danh sách và chi tiết sản phẩm
        Chỉ admin mới được tạo, sửa, xóa
        """
        if self.action in ['list', 'retrieve', 'featured', 'by_category']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def list(self, request, *args, **kwargs):
        """Lấy danh sách sản phẩm với filter và search"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Filter theo giá
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter theo rating
        min_rating = request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        
        # Filter tồn kho thấp
        low_stock = request.query_params.get('low_stock')
        if low_stock:
            queryset = queryset.filter(stock__lt=50)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def get_object(self):
        """
        Override để hỗ trợ lookup bằng cả ID và slug
        """
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        
        # Get the lookup value from URL
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        
        # Try to find by slug first
        try:
            obj = queryset.get(**filter_kwargs)
        except (Product.DoesNotExist, ValueError):
            # If slug doesn't work, try by ID
            try:
                obj = queryset.get(id=self.kwargs[lookup_url_kwarg])
            except (Product.DoesNotExist, ValueError):
                from rest_framework.exceptions import NotFound
                raise NotFound('Không tìm thấy sản phẩm')
        
        # May raise a permission denied
        self.check_object_permissions(self.request, obj)
        return obj
    
    def retrieve(self, request, *args, **kwargs):
        """Lấy chi tiết sản phẩm theo slug hoặc ID"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'message': 'Lấy thông tin sản phẩm thành công',
            'data': serializer.data
        })
    
    def create(self, request, *args, **kwargs):
        """Tạo sản phẩm mới"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Lấy lại product với full serializer để trả về
        product = Product.objects.get(pk=serializer.instance.pk)
        full_serializer = ProductSerializer(product, context={'request': request})
        
        return Response(
            {
                'message': 'Tạo sản phẩm thành công',
                'data': full_serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """Cập nhật thông tin sản phẩm"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Lấy lại product với full serializer để trả về
        product = Product.objects.get(pk=instance.pk)
        full_serializer = ProductSerializer(product, context={'request': request})
        
        return Response({
            'message': 'Cập nhật sản phẩm thành công',
            'data': full_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Xóa sản phẩm"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': 'Xóa sản phẩm thành công'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Lấy danh sách sản phẩm nổi bật (deprecated - trả về sản phẩm active)"""
        products = self.queryset.filter(status='active')[:10]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Lấy sản phẩm theo danh mục"""
        category_id = request.query_params.get('category_id')
        if not category_id:
            return Response(
                {'error': 'Vui lòng cung cấp category_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        products = self.queryset.filter(category_id=category_id, status='active')
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        """Upload ảnh chính cho sản phẩm"""
        product = self.get_object()
        
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Vui lòng chọn hình ảnh'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        product.main_image = request.FILES['image']
        product.save()
        
        serializer = ProductSerializer(product, context={'request': request})
        return Response({
            'message': 'Upload ảnh thành công',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def add_images(self, request, pk=None):
        """Thêm nhiều ảnh phụ cho sản phẩm"""
        product = self.get_object()
        
        images = request.FILES.getlist('images')
        if not images:
            return Response(
                {'error': 'Vui lòng chọn ít nhất một hình ảnh'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_images = []
        for idx, image_file in enumerate(images):
            product_image = ProductImage.objects.create(
                product=product,
                image=image_file,
                order=idx
            )
            created_images.append(product_image)
        
        serializer = ProductImageSerializer(created_images, many=True, context={'request': request})
        return Response({
            'message': f'Đã thêm {len(created_images)} ảnh',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['delete'], url_path='delete_image/(?P<image_id>[^/.]+)')
    def delete_image(self, request, pk=None, image_id=None):
        """Xóa một ảnh phụ của sản phẩm"""
        product = self.get_object()
        
        try:
            product_image = ProductImage.objects.get(id=image_id, product=product)
            product_image.delete()
            
            return Response({
                'message': 'Đã xóa ảnh thành công'
            })
        except ProductImage.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy ảnh'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        """Chuyển đổi trạng thái sản phẩm nổi bật (deprecated - không còn sử dụng)"""
        return Response(
            {'message': 'Tính năng sản phẩm nổi bật đã bị loại bỏ'},
            status=status.HTTP_410_GONE
        )
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Chuyển đổi trạng thái sản phẩm"""
        product = self.get_object()
        
        if product.status == 'active':
            product.status = 'inactive'
        else:
            product.status = 'active'
        
        product.save()
        
        serializer = ProductSerializer(product, context={'request': request})
        return Response({
            'message': f'Đã chuyển trạng thái sang {product.get_status_display()}',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Lấy danh sách sản phẩm sắp hết hàng (stock < 50)"""
        products = self.queryset.filter(stock__lt=50, stock__gt=0)
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """Lấy danh sách sản phẩm hết hàng"""
        products = self.queryset.filter(stock=0)
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
