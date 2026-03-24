#!/usr/bin/env python
"""Test API serializer response"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai_agent.models import ConversationSession
from ai_agent.serializers import ConversationSessionSerializer
from ai_agent.services import AIAgentService

def test_serializer():
    print("=" * 50)
    print("Testing API Serializer Response")
    print("=" * 50)
    
    service = AIAgentService()
    
    # Create a test anonymous conversation
    print("\n[Test] Creating anonymous conversation...")
    conv = service.start_conversation(user=None)
    print(f"  Created Conversation:")
    print(f"    - Session ID: {conv.session_id}")
    print(f"    - Customer ID: {conv.customer_id}")
    
    # Serialize it
    print("\n[Test] Serializing conversation...")
    serializer = ConversationSessionSerializer(conv)
    data = serializer.data
    
    print(f"\n  Serialized Data:")
    print(f"    - session_id: {data.get('session_id')}")
    print(f"    - user_id: {data.get('user_id')}")
    print(f"    - user_full_name: {data.get('user_full_name')}")
    print(f"    - customer_id: {data.get('customer_id')}")
    print(f"    - customer_type: {data.get('customer_type')}")
    
    # Verify the user_full_name includes the customer ID
    assert "Khách" in data.get('user_full_name', ''), f"user_full_name should contain 'Khách': {data.get('user_full_name')}"
    assert data.get('customer_id') == conv.session_id, "customer_id should match session_id"
    
    print("\n  ✓ Full API response:")
    print(json.dumps(data, indent=2, ensure_ascii=False))
    
    print("\n" + "=" * 50)
    print("Serializer test PASSED!")
    print("=" * 50)

if __name__ == "__main__":
    test_serializer()
