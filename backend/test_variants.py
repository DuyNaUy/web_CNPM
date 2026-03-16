#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai_agent.services import AIAgentService
import json

# Test service
service = AIAgentService()
products = service.search_products_by_keyword('gau', limit=2)

print('=' * 80)
print('API Response for "gau":')
print('=' * 80)
for i, prod in enumerate(products, 1):
    print(f"\nProduct {i}:")
    print(f"  ID: {prod.get('id')}")
    print(f"  Name: {prod.get('name')}")
    print(f"  Price: {prod.get('price')}")
    print(f"  Variants present: {'variants' in prod}")
    if 'variants' in prod:
        print(f"  Number of variants: {len(prod['variants'])}")
        for j, var in enumerate(prod['variants'][:2], 1):
            print(f"    Variant {j}: {var.get('size')} - {var.get('price')}₫ (Stock: {var.get('stock')})")
    else:
        print("  ❌ MISSING variants field!")
    print(f"  Unit: {prod.get('unit', 'N/A')}")
