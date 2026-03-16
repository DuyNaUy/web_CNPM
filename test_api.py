#!/usr/bin/env python
import os, sys, django
sys.path.insert(0, 'd:\\TeddyShop\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Product
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()
client = APIClient()

print("TEST CART API")
print("-" * 50)

user = User.objects.first()
if not user:
    print("ERROR: No users")
    exit(1)

product = Product.objects.first()
if not product:
    print("ERROR: No products")
    exit(1)

refresh = RefreshToken.for_user(user)
token = str(refresh.access_token)
client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

print(f"User: {user.username}")
print(f"Product: {product.name} (ID={product.id})")
print(f"\nCalling /api/orders/cart/add_item/")

response = client.post('/api/orders/cart/add_item/', {
    'product_id': product.id,
    'quantity': 1,
    'unit': ''
}, format='json')

print(f"Status: {response.status_code}")

try:
    data = response.json()
    if response.status_code == 200:
        print("SUCCESS - Item added")
    else:
        print(f"ERROR - {data}")
except:
    print(f"ERROR - Invalid response: {response.text[:200]}")
