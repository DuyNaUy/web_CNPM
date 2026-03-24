#!/usr/bin/env python
"""Migrate old conversations by assigning customer_id to anonymous users without it"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai_agent.models import ConversationSession

print("=" * 60)
print("Migrating Old Conversations")
print("=" * 60)

# Find all anonymous conversations without customer_id
old_conversations = ConversationSession.objects.filter(
    user__isnull=True,
    customer_id__isnull=True
)

print(f"\nFound {old_conversations.count()} old anonymous conversations without customer_id\n")

for idx, conv in enumerate(old_conversations, 1):
    # Assign customer_id based on the session_id if it's numeric, otherwise use model id
    try:
        # Try to use numeric ID if session_id is numeric
        if conv.session_id.isdigit():
            conv.customer_id = conv.session_id
        else:
            # Generate a unique ID based on the model's pk
            conv.customer_id = f"{conv.id:03d}" if conv.id < 1000 else str(conv.id)
    except:
        conv.customer_id = str(conv.id)
    
    conv.save()
    print(f"{idx}. Session: {conv.session_id} -> Customer ID: {conv.customer_id}")

print(f"\n✓ Successfully migrated {old_conversations.count()} conversations!")
print("=" * 60)
