from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, CartViewSet, momo_callback, check_momo_payment_status

router = DefaultRouter()
router.register('', OrderViewSet, basename='order')
router.register('cart', CartViewSet, basename='cart')

urlpatterns = [
    path('', include(router.urls)),
    path('momo-callback/', momo_callback, name='momo-callback'),
    path('momo-status/<int:order_id>/', check_momo_payment_status, name='momo-status'),
]
