from django.apps import AppConfig


class OrdersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'orders'

    def ready(self):
        # Ensure signals are registered when the app is ready
        try:
            import orders.signals  # noqa: F401
        except Exception:
            # Logging here helps debugging if signals fail to import
            import logging
            logging.getLogger(__name__).exception('Failed to import orders.signals')
