# Chatbot Product Sync - Setup & Testing Guide

## Quick Setup

### Step 1: Database Check
Ensure you have products in your database:
```bash
cd backend
python manage.py shell
>>> from products.models import Product
>>> Product.objects.filter(status='active').count()
# Should return > 0
```

### Step 2: Test Services Directly

```python
# test_product_sync.py
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai_agent.services import AIAgentService
from products.models import Product

# Test 1: Check product count
print("=== Test 1: Product Count ===")
products = Product.objects.filter(status='active')
print(f"Total active products: {products.count()}")

# Test 2: Initialize service and check system prompt
print("\n=== Test 2: System Prompt ===")
service = AIAgentService()
print(f"System prompt includes catalog: {'DANH SÁCH SẢN PHẨM' in service.system_prompt}")
print(f"System prompt length: {len(service.system_prompt)} characters")

# Test 3: Search by keyword
print("\n=== Test 3: Search by Keyword ===")
results = service.search_products_by_keyword("gấu", limit=5)
print(f"Found {len(results)} products matching 'gấu'")
for product in results:
    print(f"  - {product['name']}: {product['price']:,}đ")

# Test 4: Search by category
print("\n=== Test 4: Search by Category ===")
results = service.search_products_by_category("Gấu bông", limit=5)
print(f"Found {len(results)} products in category 'Gấu bông'")

# Test 5: Get recommendations
print("\n=== Test 5: Recommendations ===")
results = service.get_product_recommendations(limit=5)
print(f"Top {len(results)} products:")
for product in results:
    print(f"  - {product['name']}: {product['sold_count']} sold, {product['rating']}/5")

# Test 6: Fuzzy extraction
print("\n=== Test 6: Fuzzy Product Extraction ===")
test_response = "Tôi thích những con gấu nhỏ màu hồng, có cái gấu bông nào không?"
result = service.improve_product_extraction(test_response)
print(f"Text: {test_response}")
print(f"Products found: {len(result['products'])}")
print(f"Confidence: {result['confidence']:.2%}")
for product in result['products']:
    print(f"  - {product['name']} (similarity: {product['similarity']:.2%})")

# Test 7: All products by category
print("\n=== Test 7: All Products by Category ===")
all_products = service.get_all_products_dict()
print(f"Categories: {len(all_products)}")
for category, products in all_products.items():
    print(f"  - {category}: {len(products)} products")

print("\n✅ All tests completed!")
```

Run the test:
```bash
cd backend
python test_product_sync.py
```

## API Testing

### Using cURL

#### 1. Start a conversation
```bash
curl -X POST http://localhost:8000/api/ai/conversations/start_conversation/ \
  -H "Content-Type: application/json"
# Returns: {"session_id": "session_xxxxx", ...}
```

#### 2. Search products by keyword
```bash
SESSION_ID="session_xxxxx"
curl "http://localhost:8000/api/ai/conversations/${SESSION_ID}/search_products_by_keyword/?keyword=gấu&limit=5"
```

#### 3. Search products by category
```bash
curl "http://localhost:8000/api/ai/conversations/${SESSION_ID}/search_products_by_category/?category=Gấu%20bông&limit=5"
```

#### 4. Get recommendations
```bash
curl "http://localhost:8000/api/ai/conversations/${SESSION_ID}/get_recommendations/?limit=5"
```

#### 5. Get all products
```bash
curl "http://localhost:8000/api/ai/conversations/${SESSION_ID}/get_all_products/"
```

### Using Python Requests

```python
import requests
import json

BASE_URL = "http://localhost:8000/api"

# Start conversation
response = requests.post(f"{BASE_URL}/ai/conversations/start_conversation/")
session_id = response.json()["session_id"]
print(f"Session: {session_id}")

# Search products
response = requests.get(
    f"{BASE_URL}/ai/conversations/{session_id}/search_products_by_keyword/",
    params={"keyword": "gấu", "limit": 5}
)
products = response.json()["products"]
print(f"\nFound {len(products)} products:")
for product in products:
    print(f"  {product['name']}: {product['price']:,}đ")

# Send message to chatbot
response = requests.post(
    f"{BASE_URL}/ai/conversations/{session_id}/send_message/",
    json={"message": "Tôi muốn tìm một con gấu bông nhỏ"}
)
data = response.json()
print(f"\nChatbot: {data['ai_response']}")
print(f"Products suggested: {len(data.get('products', []))}")
```

## Frontend Testing (React/Next.js)

### Example Hook
```typescript
// hooks/useChatbotProducts.ts
import { useState } from 'react';

export function useChatbotProducts(sessionId: string) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchByKeyword = async (keyword: string, limit = 10) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ai/conversations/${sessionId}/search_products_by_keyword/?keyword=${keyword}&limit=${limit}`
      );
      const data = await response.json();
      setProducts(data.products);
      return data.products;
    } finally {
      setLoading(false);
    }
  };

  const searchByCategory = async (category: string, limit = 10) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ai/conversations/${sessionId}/search_products_by_category/?category=${encodeURIComponent(category)}&limit=${limit}`
      );
      const data = await response.json();
      setProducts(data.products);
      return data.products;
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async (productId?: number, limit = 5) => {
    setLoading(true);
    try {
      const url = new URL(
        `/api/ai/conversations/${sessionId}/get_recommendations/`,
        window.location.origin
      );
      url.searchParams.set('limit', limit.toString());
      if (productId) url.searchParams.set('product_id', productId.toString());

      const response = await fetch(url.toString());
      const data = await response.json();
      setProducts(data.recommendations);
      return data.recommendations;
    } finally {
      setLoading(false);
    }
  };

  const getAllProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ai/conversations/${sessionId}/get_all_products/`
      );
      const data = await response.json();
      return data.categories;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    searchByKeyword,
    searchByCategory,
    getRecommendations,
    getAllProducts
  };
}
```

## Performance Testing

### Load Test (using Apache Bench)
```bash
# Test search endpoint
ab -n 100 -c 10 "http://localhost:8000/api/ai/conversations/session_test/search_products_by_keyword/?keyword=gấu"

# Results should show:
# - Mean response time: <200ms
# - Requests/sec: >50
```

### Benchmark Script
```python
# benchmark_product_sync.py
import time
from ai_agent.services import AIAgentService

service = AIAgentService()

# Benchmark search
start = time.time()
for _ in range(10):
    service.search_products_by_keyword("gấu")
elapsed = time.time() - start
print(f"Search (10 iterations): {elapsed:.3f}s ({elapsed/10*1000:.1f}ms avg)")

# Benchmark extraction
start = time.time()
for _ in range(10):
    service.improve_product_extraction("Tôi muốn gấu bông hồng")
elapsed = time.time() - start
print(f"Extraction (10 iterations): {elapsed:.3f}s ({elapsed/10*1000:.1f}ms avg)")

# Benchmark recommendations
start = time.time()
for _ in range(10):
    service.get_product_recommendations()
elapsed = time.time() - start
print(f"Recommendations (10 iterations): {elapsed:.3f}s ({elapsed/10*1000:.1f}ms avg)")
```

## Troubleshooting

### Issue: "No products found"
**Solution:**
1. Check if products exist: `Product.objects.count()`
2. Ensure status='active': `Product.objects.filter(status='active').count()`
3. Check database connection

### Issue: "Fuzzy matching not working"
**Solution:**
1. Similarity threshold is 0.6 (60%)
2. Try exact product names first
3. Check product name in database

### Issue: "API returns empty products"
**Solution:**
1. Verify session_id is correct
2. Check if conversation exists
3. Try sending a message first to initialize conversation

### Issue: "Slow response times"
**Solution:**
1. Add database indexes on Product.name
2. Implement Redis caching
3. Consider pagination for large result sets

## Monitoring

### Log Product Searches (Optional)
Add to settings.py:
```python
LOGGING = {
    'loggers': {
        'ai_agent.services': {
            'level': 'INFO',
        }
    }
}
```

Check logs:
```bash
tail -f logs/django.log | grep "search_products"
```

---

**Test Date**: March 15, 2026  
**Version**: 2.0  
**Status**: ✅ Ready for Production
