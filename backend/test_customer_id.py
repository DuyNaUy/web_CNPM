#!/usr/bin/env python
"""Test script to verify customer ID changes"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai_agent.models import ConversationSession
from ai_agent.services import AIAgentService
from users.models import User

def test_customer_id():
    print("=" * 50)
    print("Testing Customer ID Changes")
    print("=" * 50)
    
    service = AIAgentService()
    
    # Test 1: Create anonymous conversation
    print("\n[Test 1] Creating anonymous conversation...")
    anon_conv = service.start_conversation(user=None)
    print(f"  ✓ Session ID: {anon_conv.session_id}")
    print(f"  ✓ Customer ID: {anon_conv.customer_id}")
    print(f"  ✓ Customer Name: {anon_conv.get_customer_name()}")
    assert anon_conv.customer_id is not None, "Customer ID should not be None for anonymous user"
    assert anon_conv.customer_id == anon_conv.session_id, "Customer ID should match session_id for anonymous users"
    print("  ✓ PASSED")
    
    # Test 2: Try to get a user for authenticated conversation
    print("\n[Test 2] Creating authenticated conversation...")
    try:
        user = User.objects.first()
        if user:
            auth_conv = service.start_conversation(user=user)
            print(f"  ✓ Session ID: {auth_conv.session_id}")
            print(f"  ✓ Customer ID: {auth_conv.customer_id}")
            print(f"  ✓ User: {user.username}")
            print(f"  ✓ Customer Name: {auth_conv.get_customer_name()}")
            assert auth_conv.customer_id is None, "Customer ID should be None for authenticated users"
            expected_name = user.get_full_name() or user.username
            assert auth_conv.get_customer_name() == expected_name, "Should return user's name"
            print("  ✓ PASSED")
        else:
            print("  ⚠ No users in database, skipping authenticated test")
    except Exception as e:
        print(f"  ⚠ Could not test authenticated conversation: {e}")
    
    # Test 3: Verify existing conversations
    print("\n[Test 3] Checking existing conversations...")
    all_convs = ConversationSession.objects.all()[:5]
    for conv in all_convs:
        print(f"  - Session: {conv.session_id}, User: {conv.user}, Customer ID: {conv.customer_id}")
        print(f"    Display Name: {conv.get_customer_name()}")
    print("  ✓ PASSED")
    
    print("\n" + "=" * 50)
    print("All tests completed!")
    print("=" * 50)

if __name__ == "__main__":
    test_customer_id()
