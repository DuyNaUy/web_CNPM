from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.db.models import F
from .models import Order, OrderItem
from products.models import Product


@receiver(pre_save, sender=Order)
def store_previous_status(sender, instance, **kwargs):
    """Store previous status on the instance before saving so post_save can compare."""
    if instance.pk:
        try:
            prev = Order.objects.get(pk=instance.pk)
            instance._previous_status = prev.status
        except Order.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None


@receiver(post_save, sender=Order)
def update_product_sold_count_on_delivered(sender, instance, created, **kwargs):
    """When an order transitions to 'delivered', increment product.sold_count by quantities in order items.

    This ensures sold_count reflects only completed (delivered) purchases.
    """
    try:
        previous = getattr(instance, '_previous_status', None)
        # Only update when newly delivered
        if instance.status == 'delivered' and previous != 'delivered':
            items = OrderItem.objects.filter(order=instance)
            per_product = {}
            for it in items:
                if not it.product:
                    continue
                per_product.setdefault(it.product.id, 0)
                per_product[it.product.id] += it.quantity

            # Bulk update using F expressions
            for pid, qty in per_product.items():
                Product.objects.filter(pk=pid).update(sold_count=F('sold_count') + qty)
    except Exception:
        import logging
        logging.getLogger(__name__).exception('Failed to update sold_count for order %s', getattr(instance, 'pk', None))
