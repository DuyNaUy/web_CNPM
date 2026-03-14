# Admin Consultations Setup Documentation

## Overview
This document explains the admin consultations management feature that was implemented to allow admins to view, manage, and reply to customer AI consultations.

## Changes Made

### 1. Frontend Changes

#### A. Created Admin Consultations Page
**File:** `frontend/app/(main)/admin/consultations/page.tsx`

**Features:**
- Lists all customer conversations in a paginated DataTable
- Shows conversation metadata: customer name, email, creation date, message count
- Displays conversations marked as anonymous (khách vãng lai) for unauthenticated users
- Allows admin to click on any conversation to view full message history
- Admin can reply to customer messages directly
- Auto-scroll to new messages
- Role-based access control (redirects non-admin users)

**Key Components:**
- DataTable with columns: Session ID, Customer, Title, Message Count, Status, Update Time, Actions
- Dialog modal for viewing conversation details
- Message display with different styling for customer (👤), AI (🤖), and admin (👨‍💼) messages
- InputTextarea for admin replies
- Toast notifications for success/error feedback

**State Management:**
- Uses `LayoutContext` from `frontend/layout/context/layoutcontext.tsx` to get user role
- Checks if `role === 'admin'` before allowing access
- Manages loading state and pagination

#### B. Previous Frontend Changes
**File:** `frontend/components/FloatingChatButton.tsx`
- Added role check to hide chat button for admin users
- Admins see "Tư vấn Bán Hàng" menu instead of floating chat

**File:** `frontend/layout/AppMenu.tsx`
- Added menu item: `{ label: 'Tư vấn Bán Hàng', icon: 'pi pi-fw pi-comments', to: '/admin/consultations' }`

### 2. Backend Changes

#### A. Updated ConversationViewSet
**File:** `backend/ai_agent/views.py`

**Changes:**
- Modified `get_queryset()`:
  - Admin users return ALL conversations: `ConversationSession.objects.all().order_by('-updated_at')`
  - Regular users return only their own conversations: `ConversationSession.objects.filter(user=self.request.user)`
  - Anonymous users still work with session_id lookup

- Added `get_serializer_class()`:
  - Returns `ConversationSessionAdminSerializer` when request user is admin
  - Returns `ConversationSessionSerializer` for other users

**Imports Updated:**
```python
from .serializers import (
    ConversationSessionSerializer, 
    ConversationSessionAdminSerializer,
    AutomatedOrderSerializer, 
    AutomatedOrderCreateSerializer
)
```

#### B. Created New Serializer
**File:** `backend/ai_agent/serializers.py`

**New Class:** `ConversationSessionAdminSerializer`

**Fields:**
- `id` - Conversation ID
- `session_id` - Unique session identifier
- `title` - Conversation title
- `user_id` - Customer ID (null for anonymous)
- `user_full_name` - Customer full name (null for anonymous)
- `user_email` - Customer email (null for anonymous)
- `created_at` - Conversation creation timestamp
- `updated_at` - Last update timestamp
- `is_active` - Whether conversation is still active
- `message_count` - Total number of messages in conversation

**Methods:**
- `get_user_full_name()` - Returns user's full_name if user exists
- `get_user_email()` - Returns user's email if user exists
- `get_user_id()` - Returns user's ID if user exists
- `get_message_count()` - Counts messages in `context.messages` JSON array

## API Endpoints Used

### List All Conversations (Admin)
```
GET /api/ai/conversations/?limit=100
Headers: Authorization: Bearer {token}
Response: [ConversationSessionAdminSerializer, ...]
```

### Get Conversation History
```
GET /api/ai/conversations/{session_id}/get_history/
Headers: Authorization: Bearer {token}
Response: { conversation_id, messages: [...] }
```

### Send Admin Reply
```
POST /api/ai/conversations/{session_id}/send_message/
Headers: Authorization: Bearer {token}
Body: { message: "Admin reply text", is_admin: true }
```

## Data Flow

1. **Admin Logs In**
   - Role is stored in localStorage as `user.role = 'admin'`
   - LayoutContext reads this and sets `role` state

2. **Admin Visits Consultations Page**
   - Page checks `role === 'admin'` in useContext(LayoutContext)
   - If not admin, redirects to home page
   - If admin, calls GET `/api/ai/conversations/?limit=100`
   - Backend's `get_queryset()` returns ALL conversations
   - Frontend renders conversations in DataTable

3. **Admin Views Conversation Details**
   - User clicks "Eye" icon on a row
   - Calls GET `/api/ai/conversations/{session_id}/get_history/`
   - Messages are fetched and displayed in modal dialog
   - Messages sorted chronologically with timestamps

4. **Admin Sends Reply**
   - Admin types message in InputTextarea
   - Clicks "Gửi trả lời" button
   - Calls POST `/api/ai/conversations/{session_id}/send_message/`
   - Message added to conversation with role='admin'
   - Message appears immediately in UI with admin styling

## User Experience

### For Customers:
- See floating chat button at bottom right
- Chat with AI assistant without login
- Chat appears as modal overlay
- Cart data saved locally if not logged in
- Cannot see admin consultations page

### For Admin Users:
- **Cannot** see floating chat button (hidden with `if (role === 'admin') return null;`)
- See "Tư vấn Bán Hàng" menu item in admin sidebar
- Can access admin consultations page at `/admin/consultations`
- Can view all customer conversations
- Can see message history with timestamps
- Can reply directly to customers
- Conversations marked as "anonymous" if no user is logged in

## Message Structure

Messages stored as JSON in `ConversationSession.context`:
```json
{
  "messages": [
    {
      "role": "user|assistant|admin",
      "content": "Message text",
      "timestamp": "ISO 8601 datetime"
    }
  ]
}
```

## Security Notes

1. **AllowAny Permission**: ConversationViewSet allows anonymous users
   - For anonymous users: only returns conversations with `user__isnull=True`
   - For authenticated users: filters by user or returns all (if admin)

2. **Admin Check**:
   - Uses `request.user.role == 'admin'` to determine access level
   - Happens in both `get_serializer_class()` and `get_queryset()`

3. **Admin-Only Access**:
   - Page frontend also checks role and redirects non-admins
   - Double protection: backend + frontend

## Testing the Feature

### Steps to Test:
1. Create an admin user account
2. Log in as admin
3. Navigate to admin panel
4. Click on "Tư vấn Bán Hàng" menu item
5. Verify list of conversations appears
6. Click eye icon to view conversation details
7. Type a reply and send
8. Message should appear with admin badge

### Test Scenarios:
- Admin can see anonymous customer conversations ✓
- Admin can see authenticated customer conversations ✓
- Customers cannot access admin page (redirected) ✓
- Chat button hidden for admin users ✓
- Message history displays correctly ✓
- Admin replies save successfully ✓

## Future Enhancements

Potential features for future implementation:
1. Search/filter conversations by date range
2. Filter by customer name or email
3. Mark conversations as resolved
4. Admin message notification system
5. Canned responses/templates for common replies
6. Conversation export/archive
7. Real-time notifications for new customer messages
8. Admin chat history/analytics

## Files Modified

```
frontend/
├── app/(main)/admin/consultations/
│   └── page.tsx (NEW - 450+ lines)
├── components/
│   └── FloatingChatButton.tsx (MODIFIED - added role check)
└── layout/
    └── AppMenu.tsx (MODIFIED - added consultations menu item)

backend/
└── ai_agent/
    ├── views.py (MODIFIED - updated get_queryset, added get_serializer_class)
    └── serializers.py (MODIFIED - added ConversationSessionAdminSerializer)
```

## Database Information

No database migrations needed for this feature. It uses existing models:
- `ConversationSession` - already has nullable user field (from migration 0002)
- `messages` stored as JSON in `context` field
- Timestamps handled automatically by Django

## Configuration

No additional configuration required. The feature uses:
- Existing JWT authentication setup
- Existing pagination configuration from `settings.py`
- Existing LayoutContext from frontend
- Existing User model with role field

## Troubleshooting

**Issue:** Admin sees empty list
- Check that conversations exist in database
- Verify admin user has `role='admin'` in user table
- Check browser console for API errors

**Issue:** Messages not loading
- Verify conversation has messages in `context` JSON field
- Check that `get_history` endpoint returns messages array
- Check browser network tab for API response

**Issue:** Admin reply not saving
- Verify session is active (`is_active=True`)
- Check error message in toast notification
- Check server logs for any exceptions

**Issue:** Page redirects to home
- Verify user is logged in and has admin role
- Check localStorage for `user` object with `role='admin'`
- Check LayoutContext is properly initialized
