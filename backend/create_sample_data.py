"""
Script để tạo dữ liệu mẫu cho testing
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from categories.models import Category
from products.models import Product

def create_sample_data():
    print("Creating sample data...")
    
    # Create categories
    categories_data = [
        {'name': 'Rau Củ Quả', 'description': 'Các loại rau củ quả tươi sạch', 'status': 'active'},
        {'name': 'Thịt Tươi', 'description': 'Thịt các loại tươi ngon', 'status': 'active'},
        {'name': 'Hải Sản', 'description': 'Hải sản tươi sống', 'status': 'active'},
        {'name': 'Trứng & Sữa', 'description': 'Trứng và các sản phẩm từ sữa', 'status': 'active'},
        {'name': 'Gạo & Ngũ Cốc', 'description': 'Gạo và các loại ngũ cốc', 'status': 'active'},
    ]
    
    categories = {}
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults={
                'description': cat_data['description'],
                'status': cat_data['status']
            }
        )
        categories[cat_data['name']] = category
        print(f"{'Created' if created else 'Found'} category: {category.name}")
    
    # Create products
    products_data = [
        {
            'name': 'Cà Chua Bi',
            'category': 'Rau Củ Quả',
            'price': 35000,
            'stock': 80,
            'unit': 'kg',
            'rating': 4.3,
            'reviews_count': 18,
            'sold_count': 92,
            'description': 'Cà chua bi Đà Lạt tươi ngon, ngọt tự nhiên',
            'detail_description': 'Cà chua bi Đà Lạt, màu đỏ tự nhiên, ngọt thanh, giàu vitamin',
            'origin': 'Đà Lạt',
            'weight': '1kg',
            'preservation': 'Bảo quản nơi khô ráo hoặc ngăn mát tủ lạnh',
            'expiry': '7-10 ngày',
            'certification': 'VietGAP',
            'status': 'active'
        },
        {
            'name': 'Sữa Tươi Organicfarm',
            'category': 'Trứng & Sữa',
            'price': 45000,
            'stock': 120,
            'unit': 'hộp',
            'rating': 4.6,
            'reviews_count': 67,
            'sold_count': 234,
            'description': 'Sữa tươi không đường 1 lít, nguồn gốc rõ ràng',
            'detail_description': 'Sữa tươi tiệt trùng 100%, không đường, không chất bảo quản',
            'origin': 'Việt Nam',
            'weight': '1 lít',
            'preservation': 'Bảo quản mát 2-6°C',
            'expiry': '7 ngày sau khi mở nắp',
            'status': 'active'
        },
        {
            'name': 'Cá Hồi Na Uy',
            'category': 'Hải Sản',
            'price': 420000,
            'old_price': 480000,
            'stock': 25,
            'unit': 'kg',
            'rating': 4.9,
            'reviews_count': 38,
            'sold_count': 123,
            'description': 'Cá hồi Na Uy nhập khẩu, giàu omega-3',
            'detail_description': 'Cá hồi Na Uy phi lê tươi, thịt hồng đẹp, giàu omega-3, DHA tốt cho sức khỏe',
            'origin': 'Na Uy',
            'weight': '1kg',
            'preservation': 'Bảo quản đông -18°C',
            'expiry': '6 tháng',
            'certification': 'FDA',
            'status': 'active'
        },
        {
            'name': 'Xoài Cát Hòa Lộc',
            'category': 'Rau Củ Quả',
            'price': 55000,
            'stock': 60,
            'unit': 'kg',
            'rating': 4.8,
            'reviews_count': 42,
            'sold_count': 178,
            'description': 'Xoài cát Hòa Lộc Tiền Giang, ngọt thơm đặc trưng',
            'detail_description': 'Xoài cát Hòa Lộc chính gốc Tiền Giang, múi vàng, thịt mềm, ngọt đậm',
            'origin': 'Tiền Giang',
            'weight': '1kg',
            'preservation': 'Bảo quản nơi khô mát, tránh ánh nắng',
            'expiry': '5-7 ngày',
            'certification': 'VietGAP',
            'status': 'active'
        },
        {
            'name': 'Thịt Heo Sạch',
            'category': 'Thịt Tươi',
            'price': 95000,
            'stock': 80,
            'unit': 'kg',
            'rating': 4.5,
            'reviews_count': 56,
            'sold_count': 312,
            'description': 'Thịt heo ba chỉ tươi sạch, không chất cấm',
            'detail_description': 'Thịt heo ba chỉ từ trang trại đạt chuẩn an toàn, kiểm dịch nghiêm ngặt',
            'origin': 'Đồng Nai',
            'weight': '1kg',
            'preservation': 'Bảo quản mát 2-6°C',
            'expiry': '3-5 ngày',
            'certification': 'ATTP',
            'status': 'active'
        }
    ]
    
    for prod_data in products_data:
        category_name = prod_data.pop('category')
        category = categories[category_name]
        
        product, created = Product.objects.get_or_create(
            name=prod_data['name'],
            defaults={
                **prod_data,
                'category': category
            }
        )
        print(f"{'Created' if created else 'Found'} product: {product.name}")
    
    print("\nSample data creation completed!")
    print(f"Total categories: {Category.objects.count()}")
    print(f"Total products: {Product.objects.count()}")

if __name__ == '__main__':
    create_sample_data()
