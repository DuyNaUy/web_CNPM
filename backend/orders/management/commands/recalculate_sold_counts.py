from django.core.management.base import BaseCommand
from products.models import Product
from orders.models import OrderItem
from django.db.models import Sum

class Command(BaseCommand):
    help = 'Recalculate sold_count for all products based on delivered orders'

    def handle(self, *args, **options):
        qs = OrderItem.objects.filter(order__status='delivered', product__isnull=False).values('product').annotate(total_sold=Sum('quantity'))
        counts = {item['product']: item['total_sold'] for item in qs}

        products = Product.objects.all()
        updated = 0
        for p in products:
            new_count = counts.get(p.id, 0) or 0
            if p.sold_count != new_count:
                p.sold_count = new_count
                p.save(update_fields=['sold_count'])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f'Recalculated sold_count for {updated} products'))
