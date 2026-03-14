import os
import django
import uuid
import json
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai_agent.models import ConversationSession, AutomatedOrder
from ai_agent.services import AIAgentService
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from products.models import Product
from categories.models import Category

User = get_user_model()

def test_payment_integration():
    client = APIClient()
    
    # Create a unique test user
    uid = uuid.uuid4().hex[:6]
    username = f'tester_{uid}'
    user = User.objects.create(
        username=username, 
        email=f'test_{uid}@example.com',
        full_name='Test User',
        phone=f'09{uid}' 
    )
    client.force_authenticate(user=user)
    
    # Start a conversation
    service = AIAgentService()
    conv = service.start_conversation(user)
    
    # Find or create an active product
    product = Product.objects.filter(status='active').first()
    if not product:
        cat, _ = Category.objects.get_or_create(name="Test Cat", slug="test-cat")
        product = Product.objects.create(name="Test Bear", price=100000, stock=10, category=cat, status='active')

    # Create an automated order
    auto_order = AutomatedOrder.objects.create(
        conversation=conv,
        user=user,
        status='draft',
        full_name='Test User',
        phone=user.phone,
        email=user.email,
        address='123 Test Street, District 1, HCM City',
        city='HCM',
        district='District 1',
        estimated_total=130000,
        shipping_fee=30000
    )
    auto_order.set_suggested_products([
        {'product_id': product.id, 'name': product.name, 'price': float(product.price), 'quantity': 1, 'subtotal': float(product.price)}
    ])
    auto_order.save()
    
    print(f"Created AutoOrder: {auto_order.id}")
    
    # Call confirm_and_create with payment_method='momo'
    url = f"/api/ai/automated-orders/{auto_order.id}/confirm_and_create/"
    response = client.post(url, {'payment_method': 'momo'}, format='json')
    
    print(f"Status Code: {response.status_code}")
    
    if hasattr(response, 'data'):
        print(f"Response Data: {response.data}")
    else:
        print(f"Response Content: {response.content}")
    
    if response.status_code == 201:
        if 'payUrl' in (response.data if hasattr(response, 'data') else {}):
            print("SUCCESS: payUrl found in response.")
        else:
            print("INFO: Order created but payUrl missing (expected if MoMo keys are test/invalid).")
    else:
        print("FAILURE: Order creation failed.")

if __name__ == "__main__":
    test_payment_integration()
