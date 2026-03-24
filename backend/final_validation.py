#!/usr/bin/env python
"""Final validation test for customer ID display names"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai_agent.models import ConversationSession
from ai_agent.serializers import ConversationSessionSerializer
from ai_agent.services import AIAgentService

print("=" * 70)
print("FINAL VALIDATION TEST - Customer ID Display Names")
print("=" * 70)

service = AIAgentService()

# Test 1: Create new anonymous conversation
print("\n[Test 1] Creating new anonymous conversation...")
new_conv = service.start_conversation(user=None)
serializer = ConversationSessionSerializer(new_conv)
data = serializer.data

expected_name = f"Khách {new_conv.customer_id}"
actual_name = data['user_full_name']
assert actual_name == expected_name, f"Expected '{expected_name}', got '{actual_name}'"
print(f"  ✓ New anonymous user: {actual_name}")
print(f"  ✓ customer_id in API: {data['customer_id']}")

# Test 2: Check authenticated user
print("\n[Test 2] Checking authenticated user...")
auth_convs = ConversationSession.objects.filter(user__isnull=False)[:1]
if auth_convs:
    conv = auth_convs[0]
    serializer = ConversationSessionSerializer(conv)
    data = serializer.data
    assert data['user_id'] is not None, "Should have user_id"
    assert data['customer_id'] is None, "Should NOT have customer_id for authenticated users"
    print(f"  ✓ Authenticated user: {data['user_full_name']}")
    print(f"  ✓ customer_id is None: {data['customer_id']}")
else:
    print("  ⚠ No authenticated users to test")

# Test 3: Count anonymous vs authenticated
print("\n[Test 3] Checking conversation statistics...")
anon_count = ConversationSession.objects.filter(user__isnull=True).count()
auth_count = ConversationSession.objects.filter(user__isnull=False).count()
with_id = ConversationSession.objects.filter(customer_id__isnull=False).count()

print(f"  Total Anonymous: {anon_count}")
print(f"  Total Authenticated: {auth_count}")
print(f"  With customer_id: {with_id}")

# Test 4: Sample data check
print("\n[Test 4] Checking sample conversations...")
all_convs = ConversationSession.objects.all()[:10]
errors = 0
for conv in all_convs:
    serializer = ConversationSessionSerializer(conv)
    data = serializer.data
    
    if data['customer_type'] == 'anonymous':
        if 'Khách' not in str(data['user_full_name']):
            print(f"  ✗ ERROR: Anonymous user not showing as 'Khách': {data['user_full_name']}")
            errors += 1
        else:
            print(f"  ✓ {data['session_id']}: {data['user_full_name']}")
    else:
        print(f"  ✓ {data['session_id']}: {data['user_full_name']} (authenticated)")

if errors == 0:
    print("\n" + "=" * 70)
    print("✓ ALL TESTS PASSED - Customer names are displayed correctly!")
    print("=" * 70)
else:
    print(f"\n✗ FOUND {errors} ERROR(S)")
