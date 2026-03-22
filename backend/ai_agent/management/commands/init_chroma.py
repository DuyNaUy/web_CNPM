"""
Management command: python manage.py init_chroma
Khởi tạo ChromaDB embeddings từ sản phẩm
"""

from django.core.management.base import BaseCommand
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Khởi tạo ChromaDB embeddings cho tất cả sản phẩm'

    def add_arguments(self, parser):
        parser.add_argument(
            '--refresh',
            action='store_true',
            help='Xóa collection cũ và tạo mới',
        )

    def handle(self, *args, **options):
        try:
            # Import sau để tránh lỗi khi Django chưa sẵn sàng
            from ai_agent.chroma_service import ChromaDBService
            
            service = ChromaDBService()
            force_refresh = options.get('refresh', False)
            
            self.stdout.write(
                self.style.WARNING('🚀 Đang khởi tạo ChromaDB embeddings...')
            )
            
            # Thêm product embeddings
            result = service.add_product_embeddings(force_refresh=force_refresh)
            
            if result['status'] == 'success':
                # Lấy thống kê
                stats = service.get_collection_stats()
                self.stdout.write(
                    self.style.SUCCESS(f"✅ {result['message']}")
                )
                self.stdout.write(
                    self.style.SUCCESS(f"📊 Tổng sản phẩm trong ChromaDB: {stats['total_products']}")
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f"❌ {result['message']}")
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Lỗi: {str(e)}")
            )
