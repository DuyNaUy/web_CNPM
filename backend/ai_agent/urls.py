from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, AutomatedOrderViewSet

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='ai-conversation')
router.register(r'orders', AutomatedOrderViewSet, basename='automated-order')

urlpatterns = [
    path('', include(router.urls)),
]
