# Chatbot Product Sync - Quick Reference

## 🚀 Quick Start

### Basic Usage
```python
from ai_agent.services import AIAgentService

service = AIAgentService()

# Search products
products = service.search_products_by_keyword("gấu", limit=5)
products = service.search_products_by_category("Gấu bông", limit=5)

# Get recommendations
recommendations = service.get_product_recommendations(limit=5)

# Extract products from text
result = service.improve_product_extraction("Tôi muốn gấu hồng")
print(result['products'])  # List of products
print(result['confidence'])  # 0-1 confidence score
```

## 📡 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/ai/conversations/{id}/search_products_by_keyword/` | Search by keyword |
| GET | `/api/ai/conversations/{id}/search_products_by_category/` | Search by category |
| GET | `/api/ai/conversations/{id}/get_recommendations/` | Get recommendations |
| GET | `/api/ai/conversations/{id}/get_all_products/` | Get all products |
| POST | `/api/ai/conversations/{id}/send_message/` | Send chat message |

## 📋 Query Parameters

### search_products_by_keyword
```
?keyword=search_term&limit=10
```
- `keyword` (required): Search term
- `limit` (optional): Max results, default 10

### search_products_by_category
```
?category=category_name&limit=10
```
- `category` (required): Category name
- `limit` (optional): Max results, default 10

### get_recommendations
```
?product_id=123&limit=5
```
- `product_id` (optional): Find related products
- `limit` (optional): Max results, default 5

## 📊 Response Format

### Search Results
```json
{
  "count": 5,
  "keyword": "gấu",
  "products": [
    {
      "id": 1,
      "name": "Gấu bông hồng",
      "price": 150000,
      "category": "Gấu bông",
      "description": "...",
      "rating": 4.5,
      "stock": 25,
      "image_url": "..."
    }
  ]
}
```

### All Products
```json
{
  "total_products": 25,
  "categories": {
    "Gấu bông": [
      {
        "id": 1,
        "name": "Gấu hồng",
        "price": 150000,
        "rating": 5.0,
        "in_stock": true
      }
    ]
  }
}
```

## 🔧 Common Tasks

### 1. Find products with fuzzy matching
```python
result = service.improve_product_extraction("gấu àu hồng")
# Finds similar products even with typos
# confidence = 0.85 (85% match)
```

### 2. Get best-selling products
```python
best_sellers = service.get_product_recommendations(limit=10)
# Sorted by sold_count, then rating
```

### 3. Find products for a customer query
```python
# Variant 1: Let AI choose
response = service.chat(conversation, "Tôi muốn gấu bông nhỏ")
# AI returns: ai_response + products

# Variant 2: Search directly
products = service.search_products_by_keyword("gấu nhỏ", limit=10)
```

### 4. Get products in specific category
```python
products = service.search_products_by_category("Gấu bông", limit=20)
```

### 5. Build custom product list
```python
all_prods = service.get_all_products_dict()
for category, products in all_prods.items():
    print(f"{category}: {len(products)} products")
```

## 💡 Best Practices

### ✅ DO
- Use `search_products_by_keyword()` for general search
- Use `search_products_by_category()` for browsing
- Use `improve_product_extraction()` for AI responses
- Limit results to 5-10 for UI display
- Cache results for repeated queries

### ❌ DON'T
- Query all products directly (use methods above)
- Make multiple API calls when one suffices
- Ignore confidence scores in extraction
- Assume products haven't changed (they're live)

## 🎯 Use Cases

### Chatbot Answering Product Questions
```python
user_msg = "Có gấu bông nào dưới 200k không?"
result = service.improve_product_extraction(user_msg)
products = [p for p in result['products'] if p['price'] < 200000]
```

### Product Discovery Page
```python
categories = service.get_all_products_dict()
# Display products grouped by category
```

### Search Feature
```python
@app.get("/products/search")
def search(q: str, category: str = None):
    if category:
        return service.search_products_by_category(category)
    else:
        return service.search_products_by_keyword(q)
```

### Related Products Widget
```python
product_id = 123  # Current product
related = service.get_product_recommendations(product_id, limit=5)
```

## 🐛 Debugging

### Check if products are available
```python
from products.models import Product
print(Product.objects.filter(status='active').count())
```

### Test search in shell
```bash
python manage.py shell
```
```python
from ai_agent.services import AIAgentService
service = AIAgentService()
products = service.search_products_by_keyword("test")
print(products)
```

### Enable debug logging
```python
import logging
logging.getLogger('ai_agent.services').setLevel(logging.DEBUG)
```

## 📈 Performance Tips

| Operation | Time | Optimization |
|-----------|------|--------------|
| Search by keyword | ~50ms | Limit results to 10 |
| Search by category | ~40ms | Cache category list |
| Get recommendations | ~60ms | Use Redis cache |
| Fuzzy extraction | ~100ms | Limit to 50 products |

### Enable Caching
```python
from django.views.decorators.cache import cache_page

@cache_page(300)  # 5 minutes
def get_recommendations(request, session_id):
    # Cached response
```

## 🔗 Related Files
- `/backend/ai_agent/services.py` - Service implementation
- `/backend/ai_agent/views.py` - API endpoints
- `/CHATBOT_PRODUCT_SYNC.md` - Full documentation
- `/CHATBOT_PRODUCT_SYNC_TESTING.md` - Testing guide

---

**Quick Tip**: Use query params to limit results: `?limit=5` for mobile, `?limit=20` for desktop

**Pro Tip**: Combine search methods for better UX:
```python
# First try exact keyword search
products = service.search_products_by_keyword(query, limit=10)
# If not enough results, add by category
if len(products) < 3:
    cat_products = service.search_products_by_category(category, limit=10-len(products))
    products.extend(cat_products)
```
