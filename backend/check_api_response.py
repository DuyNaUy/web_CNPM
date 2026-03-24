#!/usr/bin/env python
"""Check API response for customer_id"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai_agent.models import ConversationSession
from ai_agent.serializers import ConversationSessionSerializer

print("=" * 60)
print("Checking API Response")
print("=" * 60)

# Get a few conversations
convs = ConversationSession.objects.all()[:10]
if not convs:
    print("No conversations found")
else:
    for conv in convs:
        serializer = ConversationSessionSerializer(conv)
        data = serializer.data
        
        print(f"\nConversation: {data['session_id']}")
        print(f"  user_id: {data['user_id']}")
        print(f"  user_full_name: {data['user_full_name']}")
        print(f"  customer_id (from API): {data.get('customer_id')}")
        print(f"  customer_type: {data['customer_type']}")
        
        # Check that user_full_name has correct format
        if data['customer_type'] == 'anonymous':
            if 'Khách' in str(data['user_full_name']):
                print(f"  ✓ Anonymous user shows as: {data['user_full_name']}")
            else:
                print(f"  ✗ ERROR: Anonymous user should show as 'Khách XXX', got: {data['user_full_name']}")
