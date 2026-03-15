#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai_agent.services import AIAgentService

service = AIAgentService()
test_response = "Chào bạn! TeddyShop hiện có 2 mầu. **Gấu dưa** với giá **10.000 VND** và **Gấu mật ong** với giá **700.000 VND**"
recs = service._extract_recommendations(test_response)
print(f"Found {len(recs)} recommendations:")
for rec in recs:
    print(f"  - {rec['product_name']}: {rec['price']} (ID:{rec['product_id']})")
