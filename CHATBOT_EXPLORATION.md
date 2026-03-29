# 🤖 Chatbot Implementation - Complete Exploration

## Overview
The TeddyShop project includes a sophisticated AI Agent chatbot system that provides sales consulting, product recommendations, and automated order creation. The system supports both Gemini and OpenAI APIs with intelligent fallback mechanisms.

---

## 📂 Project Structure

### Backend Structure (Django)
```
backend/
├── ai_agent/                    # Main AI Agent app
│   ├── models.py               # Database models
│   ├── views.py                # API viewsets
│   ├── services.py             # Core AI logic
│   ├── serializers.py          # API serializers
│   ├── urls.py                 # API routes
│   ├── admin.py                # Django admin configuration
│   └── migrations/             # Database migrations
└── backend/ (main Django project)
    ├── settings.py             # Project configuration
    └── urls.py                 # Main URL routing
```

### Frontend Structure (Next.js/React)
```
frontend/
├── components/
│   └── ai-agent/               # Chatbot components
│       ├── AIAgentChat.tsx      # Main chat interface
│       ├── AIAgentConsole.tsx   # Chat wrapper & flow management
│       ├── OrderPreview.tsx     # Order preview screen
│       ├── AddressFormChat.tsx  # Address collection form
│       ├── ProductRecommendationCard.tsx    # Single product card
│       ├── ProductRecommendationsGrid.tsx   # Product grid display
│       ├── *.module.css         # Component styles
│       └── index.ts             # Named exports
└── services/                   # API services
    └── (API integration files)
```

---

## 🗄️ DATABASE MODELS

### [backend/ai_agent/models.py](backend/ai_agent/models.py)

#### **1. ConversationSession**
- **Purpose**: Stores individual chat sessions with users
- **Key Fields**:
  - `user`: ForeignKey to User (nullable for anonymous users)
  - `session_id`: Unique session identifier (e.g., "session_abc123def456")
  - `title`: Chat session title (default: "Tư vấn bán hàng")
  - `context`: JSON field storing message history and cart state
  - `created_at`, `updated_at`: Timestamps
  - `is_active`: Boolean flag for active sessions
- **Methods**:
  - `get_context()`: Parses JSON context to dict
  - `set_context()`: Saves dict as JSON
  - `add_message()`: Appends message to conversation history with timestamp

#### **2. AIRecommendation**
- **Purpose**: Stores product recommendations made by the AI
- **Key Fields**:
  - `conversation`: ForeignKey to ConversationSession
  - `product`: ForeignKey to Product (the recommended item)
  - `reason`: Text explaining why the product was recommended
  - `confidence_score`: Float (0-1) indicating recommendation confidence
  - `quantity`: Suggested quantity (default: 1)
  - `is_accepted`: Boolean tracking if user accepted recommendation
  - `created_at`: Timestamp
- **Used for**: Analytics, order history, trust scoring

#### **3. AutomatedOrder**
- **Purpose**: Stores draft orders created from AI recommendations
- **Key Fields**:
  - `conversation`: Link to the chat session
  - `user`: Optional ForeignKey to User
  - `status`: Choice field - 'draft', 'confirmed', 'created', 'cancelled'
  - `suggested_products`: JSON array of products from recommendations
  - `ai_notes`: Additional notes from AI
  - **Customer Info**: full_name, phone, email, address, city, district (collected via form)
  - `estimated_total`: Calculated order subtotal
  - `shipping_fee`: Fixed fee (default: 30,000 VND)
  - `created_order_id`: Reference to actual Order if converted

---

## 🔧 BACKEND SERVICES & VIEWS

### [backend/ai_agent/services.py](backend/ai_agent/services.py) - **AIAgentService**

**Core AI Logic Class**

#### **Key Initialization**
```python
- self.api_key: OpenAI API key (from settings or environment)
- self.gemini_api_key: Google Gemini API key (prioritized)
- self.model: Model selector ('gpt-3.5-turbo' or 'gpt-4')
- self.system_prompt: Vietnamese sales consultant prompt
```

#### **Main Methods**

1. **`start_conversation(user) → ConversationSession`**
   - Creates new chat session
   - Generates unique session_id
   - Associates with user if authenticated (allows anonymous users)

2. **`chat(conversation, user_message) → Dict`**
   - Main interaction method
   - Records user message to conversation context
   - Priority order:
     1. Try Gemini API (if key configured)
     2. Fallback to OpenAI API (if key configured)
     3. Returns error message if no APIs available
   - **Returns Dict**:
     ```python
     {
       'response': str,                    # AI's text response
       'recommendations': List[Dict],      # Recommended products
       'should_create_order': bool,        # Trigger checkout flow
       'cart': List[Dict]                  # Current cart items
     }
     ```

3. **`_call_openai_api(conversation, user_message) → Dict`**
   - Makes HTTP POST to OpenAI API
   - Builds prompt with:
     - System instructions
     - Last 10 messages from conversation history
     - Current product database snapshot
     - User's new message
   - Extracts recommendations from response using regex
   - Saves AI response to conversation
   - **Calls**: `_extract_recommendations()`, `_full_url()`

4. **`_call_gemini_api(conversation, user_message) → Dict`**
   - Uses new `google.genai` package
   - Supports special JSON blocks for multi-item checkout:
     ```json
     {
       "action": "checkout",
       "items": [
         {"product_id": 1, "quantity": 1, "size": ""}
       ]
     }
     ```
   - Parses checkout blocks and updates cart automatically
   - Detects intent to create order via JSON block

5. **`get_products_context() → str`**
   - Retrieves top 20 active products
   - Formats as text: "Product Name: Price VND (Rating: X/5, Sold: Y)"
   - Included in each AI prompt for context

6. **`_extract_recommendations(response_text) → List[Dict]`**
   - Parses AI response for product recommendations
   - Looks for product names and IDs
   - Returns list of recommendation dicts with fields:
     - `product_id`
     - `product_name`
     - `reason`
     - `confidence_score`
     - `price`
     - `image_url`
     - `quantity`

#### **Helper Methods**
- `_full_url(path)`: Converts relative image URLs to full URLs
- `_match_keywords_to_products()`: Fallback keyword matching (if no API available)

---

### [backend/ai_agent/views.py](backend/ai_agent/views.py) - **ViewSets**

#### **ConversationViewSet**
**Permissions**: AllowAny (supports anonymous users)

**Custom Methods**:

1. **`start_conversation` [POST]**
   - Endpoint: `/api/ai/conversations/start_conversation/`
   - Body: Empty
   - Returns: Conversation serialized data with session_id
   - Calls: `AIAgentService.start_conversation()`

2. **`send_message` [POST]** (Detail action)
   - Endpoint: `/api/ai/conversations/{session_id}/send_message/`
   - Body: `{"message": "User message text"}`
   - Special handling for admin users:
     - If `is_admin=true` AND user is admin role: saves message directly without AI
     - Otherwise: calls `AIAgentService.chat()`
   - Returns:
     ```json
     {
       "conversation_id": "session_xxx",
       "user_message": "...",
       "ai_response": "...",
       "recommendations": [...],
       "cart": [...],
       "should_create_order": false
     }
     ```

3. **`get_history` [GET]** (Detail action)
   - Endpoint: `/api/ai/conversations/{session_id}/get_history/`
   - Returns all messages and recommendations for a conversation
   - Populated product info from serializer

4. **`close_conversation` [POST]** (Detail action)
   - Endpoint: `/api/ai/conversations/{session_id}/close_conversation/`
   - Sets `is_active = False`
   - Closes the chat session

**Querysets**:
- Anonymous users: Can only access their own conversations
- Authenticated users: Can access their conversations
- Admin users: Can access all conversations

---

#### **AutomatedOrderViewSet**
**Permissions**: AllowAny

**Custom Methods**:

1. **`collect_address` [POST]** (Detail action)
   - Endpoint: `/api/ai/orders/{id}/collect_address/`
   - Body: `{full_name, phone, email, address, city, district}`
   - Updates order with customer info
   - Sets status to 'confirmed'

2. **`confirm_and_create` [POST]** (Detail action)
   - Endpoint: `/api/ai/orders/{id}/confirm_and_create/`
   - **Validation**:
     - Order status must be 'draft' or 'confirmed'
     - Must have address and phone
   - **Action**:
     - Calculates total from products
     - Creates actual Order object
     - Sets `created_order_id`
     - Returns order code and ID
   - **Returns**:
     ```json
     {
       "order_code": "ORD-ABC123XYZ",
       "order_id": 123,
       "status": "created"
     }
     ```

---

## 📡 API ENDPOINTS

### Conversation Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/ai/conversations/start_conversation/` | Start new chat | Optional |
| POST | `/api/ai/conversations/{id}/send_message/` | Send message to AI | Optional |
| GET | `/api/ai/conversations/{id}/get_history/` | Get chat history | Optional |
| POST | `/api/ai/conversations/{id}/close_conversation/` | Close session | Optional |

### Order Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/ai/orders/` | Create draft order | Optional |
| POST | `/api/ai/orders/{id}/collect_address/` | Save address info | Optional |
| POST | `/api/ai/orders/{id}/confirm_and_create/` | Convert to real order | Optional |
| POST | `/api/ai/orders/{id}/cancel/` | Cancel draft order | Optional |

---

## 🎨 FRONTEND COMPONENTS

### [frontend/components/ai-agent/AIAgentChat.tsx](frontend/components/ai-agent/AIAgentChat.tsx)

**Purpose**: Main chat interface component

**State Management**:
- `messages`: Message array (user + assistant)
- `inputValue`: Current input field text
- `isLoading`: Loading state during API calls
- `recommendations`: Current product recommendations
- `showAddressForm`: Toggle for address collection
- `estimatedTotal`: Total order amount
- `cart`: Current shopping cart items

**Key Features**:

1. **Message Display**:
   - Renders messages with role badges
   - Displays user/assistant messages with timestamps
   - Auto-scrolls to newest message

2. **Product Recommendations**:
   - Displays recommendations embedded in AI response
   - Shows product cards with images, prices, ratings
   - Quantity selectors for each product

3. **Suggested Actions**:
   - Quick action buttons (Browse products, Large teddy, etc.)
   - Pre-written suggestions for common queries

4. **API Integration**:
   - `loadConversationHistory()`: Fetches chat history via GET
   - `sendMessage()`: Sends message and processes response
   - Handles token-based authentication

5. **Auto-address Form**:
   - Shows when user selects checkout
   - Collects full_name, phone, email, address, city, district

**Props**:
```typescript
interface AIAgentChatProps {
  conversationId: string;
  onRecommendationsReceived?: (recommendations) => void;
  onOrderCreationStart?: (recommendations, total) => void;
}
```

---

### [frontend/components/ai-agent/AIAgentConsole.tsx](frontend/components/ai-agent/AIAgentConsole.tsx)

**Purpose**: Wrapper component managing overall chat flow and state

**Features**:

1. **Session Management**:
   - Starts new conversation via `/api/ai/conversations/start_conversation/`
   - Persists session_id to localStorage (`teddy_ai_session_id`)
   - Allows new conversation with confirmation

2. **Flow Management**:
   - Shows chat OR order preview based on state
   - Collects recommendations from AIAgentChat
   - Triggers order creation flow

3. **Order Creation**:
   - `handleConfirmOrder()`: 
     - Creates automated order: `POST /api/ai/orders/`
     - Collects address: `POST /api/ai/orders/{id}/collect_address/`
     - Confirms order: `POST /api/ai/orders/{id}/confirm_and_create/`

4. **Event Listeners**:
   - Listens for `addressFormSubmit` custom events
   - Updates state and triggers API calls

---

### [frontend/components/ai-agent/OrderPreview.tsx](frontend/components/ai-agent/OrderPreview.tsx)

**Purpose**: Shows order summary before confirmation

**Props**:
```typescript
interface OrderPreviewProps {
  items: Array<{
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  estimatedTotal: number;
  onConfirm: (data) => void;
  onCancel: () => void;
}
```

**Display**:
- Product items with images, names, prices
- Quantity selectors
- Line item subtotals
- Shipping fee calculation
- Total price

---

### [frontend/components/ai-agent/AddressFormChat.tsx](frontend/components/ai-agent/AddressFormChat.tsx)

**Purpose**: Collects customer delivery information

**Form Fields**:
- Full name
- Phone number
- Email
- Address (street)
- City/Province
- District
- Payment method (COD, MOMO, etc.)

**Submission**:
- Validates required fields
- Dispatches `addressFormSubmit` custom event
- Passes data to parent component

---

### [frontend/components/ai-agent/ProductRecommendationCard.tsx](frontend/components/ai-agent/ProductRecommendationCard.tsx)

**Purpose**: Individual product recommendation card

**Displays**:
- Product image
- Product name
- Price (formatted as currency)
- AI recommendation reason
- Confidence score (%)
- Quantity selector
- Add to cart button

---

### [frontend/components/ai-agent/ProductRecommendationsGrid.tsx](frontend/components/ai-agent/ProductRecommendationsGrid.tsx)

**Purpose**: Grid layout for multiple product recommendations

**Features**:
- Grid responsive layout
- Renders ProductRecommendationCard components
- Handles product selection callbacks

---

### [frontend/components/ai-agent/index.ts](frontend/components/ai-agent/index.ts)

**Barrel export file** - Named exports for all components:
```typescript
export { AIAgentChat };
export { AIAgentConsole };
export { OrderPreview };
export { AddressFormChat };
export { ProductRecommendationCard };
export { ProductRecommendationsGrid };
```

---

## 🔐 CONFIGURATION & API KEYS

### [backend/backend/settings.py](backend/backend/settings.py) (Lines 248-249)

```python
# AI Configuration
GEMINI_API_KEY = config('GEMINI_API_KEY', default='')
OPENAI_API_KEY = config('OPENAI_API_KEY', default='')
```

**Configuration Method**:
- Uses `decouple.config()` to read from environment
- Common locations:
  1. `.env` file in backend/
  2. Environment variables
  3. Default value (empty string)

**Setup Instructions**:

#### For Gemini API:
1. Go to: https://ai.google.dev/
2. Create/get API key
3. Set in `.env`:
   ```
   GEMINI_API_KEY=AIza...your_key_here
   ```

#### For OpenAI API:
1. Go to: https://platform.openai.com/api-keys
2. Create API key
3. Set in `.env`:
   ```
   OPENAI_API_KEY=sk-...your_key_here
   ```

**Priority**:
1. Gemini (if key exists and google.genai package available)
2. OpenAI (if key exists)
3. Fallback (keyword matching without API)

---

## 📊 SERIALIZERS

### [backend/ai_agent/serializers.py](backend/ai_agent/serializers.py)

#### **AIRecommendationSerializer**
- Nested ProductSerializer for full product data
- Includes: reason, confidence_score, quantity, is_accepted

#### **ConversationSessionSerializer**
- Standard user-facing serializer
- Includes recommendations (nested)
- Fields: session_id, title, created_at, updated_at, is_active

#### **ConversationSessionAdminSerializer**
- Enhanced serializer for admin view
- Additional fields:
  - `user_full_name`: Admin user info
  - `user_email`: Admin user info
  - `message_count`: Count of messages in session
- Used when admin accesses conversations

#### **AutomatedOrderSerializer**
- All order fields for viewing
- Includes suggested_products and calculations

#### **AutomatedOrderCreateSerializer**
- Input serializer for order creation
- Uses session_id for conversation lookup

---

## 🔗 URL ROUTING

### [backend/ai_agent/urls.py](backend/ai_agent/urls.py)

```python
# Router registration
router.register(r'conversations', ConversationViewSet, basename='ai-conversation')
router.register(r'orders', AutomatedOrderViewSet, basename='automated-order')

# Project includes: /api/ai/
```

**Generated URLs**:
- `/api/ai/conversations/` - List/create
- `/api/ai/conversations/{id}/` - Detail
- `/api/ai/conversations/start_conversation/` - Custom action
- `/api/ai/conversations/{id}/send_message/` - Custom action
- `/api/ai/orders/` - List/create
- `/api/ai/orders/{id}/` - Detail
- `/api/ai/orders/{id}/confirm_and_create/` - Custom action

---

## 👮 ADMIN INTERFACE

### [backend/ai_agent/admin.py](backend/ai_agent/admin.py)

#### **ConversationSessionAdmin**
```
Display: session_id, user, title, is_active, created_at
Filters: is_active, created_at
Search: session_id, user__username, title
```

#### **AIRecommendationAdmin**
```
Display: conversation, product, confidence_score, quantity, is_accepted, created_at
Filters: is_accepted, created_at, confidence_score
Search: conversation__session_id, product__name
```

#### **AutomatedOrderAdmin**
```
Display: id, user, status, estimated_total, created_at
Filters: status, created_at
Search: user__username, email, phone
```

**Access**: http://localhost:8000/admin/ai_agent/

---

## 🧪 TESTING

### [backend/ai_agent/tests.py](backend/ai_agent/tests.py)

**Includes**:
- `AIAgentServiceTest`: Tests for service logic
  - `test_start_conversation()`
  - `test_chat_fallback()` - Tests without API keys
  - `test_extract_recommendations()` - Recommendation parsing
  - Cart management tests

**Test Patterns**:
- Fallback behavior when no API key
- Keyword matching for product selection
- Cart item tracking and order creation
- Message history storage

---

## 📑 DOCUMENTATION FILES

### Documentation included in project:

| File | Purpose |
|------|---------|
| [AI_AGENT_GUIDE.md](AI_AGENT_GUIDE.md) | Full technical documentation |
| [AI_AGENT_SUMMARY.md](AI_AGENT_SUMMARY.md) | Quick overview |
| [README_AI_AGENT.md](README_AI_AGENT.md) | User-facing setup guide |
| [SETUP_AI_AGENT.md](SETUP_AI_AGENT.md) | Installation & troubleshooting |
| [API_TESTING.md](API_TESTING.md) | API endpoint examples with cURL/Postman |
| [CHANGES.md](CHANGES.md) | All changes made for AI Agent |

---

## 🚀 EXECUTION FLOW

### User Journey - Chat to Order

```
1. User starts conversation
   ↓
   POST /api/ai/conversations/start_conversation/
   ← Returns session_id (stored in localStorage)

2. User sends message
   ↓
   POST /api/ai/conversations/{id}/send_message/
   │
   ├→ AIAgentService.chat()
   │  ├→ Try Gemini API OR OpenAI API
   │  └→ Parse recommendations and cart
   │
   ← Returns: response, recommendations, cart

3. User selects products (via recommendations)
   ↓
   Frontend updates cart state

4. User clicks "Create Order"
   ↓
   POST /api/ai/orders/ (Create draft)
   ← Returns: automated_order_id

5. Address form appears
   ↓
   User fills address info

6. User confirms order
   ↓
   POST /api/ai/orders/{id}/collect_address/
   POST /api/ai/orders/{id}/confirm_and_create/
   │
   ├→ Validates address
   ├→ Calculates total
   ├→ Creates Order object
   └→ Updates status
   
   ← Returns: order_code, order_id

7. Order confirmation screen
   ↓
   Redirects to order details page
```

---

## 🔍 KEY DATA FLOWS

### Message to Response Flow
```
User Message
    ↓
AIAgentService.chat()
    ├→ Save to conversation.context['messages']
    ├→ Build prompt (system + history + products + user message)
    ├→ Call Gemini or OpenAI API
    ├→ Save response to context['messages']
    ├→ Extract recommendations
    ├→ Create AIRecommendation DB records
    └→ Return {response, recommendations, cart}
    ↓
Frontend receives response
    ├→ Display message
    ├→ Show product recommendation cards
    └→ Update recommendations state
```

### Product Context Build
```
get_products_context()
    ↓
    Query: Product.objects.filter(status='active')[:20]
    ↓
    Format each as:
    "- Name: Price VND (Rating: X/5, Sold: Y)\n  Description: ..."
    ↓
    Included in every AI prompt
    ↓
    Helps AI make informed recommendations
```

---

## 🎯 SUMMARY

**Frontend**: React/Next.js components handling chat UI, recommendations display, and order workflow
- Main chat interface with message history
- Product recommendation cards
- Order preview and address collection
- Session persistence via localStorage

**Backend**: Django REST API with AI integration
- ConversationSession model for chat history
- AIRecommendation model for product suggestions  
- AutomatedOrder model for draft orders
- AIAgentService with Gemini/OpenAI support
- ViewSets providing REST endpoints
- Admin interface for management

**AI Integration**: 
- Primary: Google Gemini API (with multi-item checkout support)
- Fallback: OpenAI GPT-3.5-turbo
- No-API: Keyword matching fallback
- System prompt in Vietnamese for sales consulting

**Order Flow**:
1. Start chat session
2. Send messages and receive recommendations
3. Select products to purchase
4. Collect delivery address
5. Confirm and create actual order

---

**Status**: ✅ Fully implemented and integrated into TeddyShop
