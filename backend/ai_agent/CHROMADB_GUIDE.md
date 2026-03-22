# 🔍 ChromaDB Integration Guide - TeddyShop

## Giới Thiệu

**ChromaDB** là vector database giúp **AI Agent tìm kiếm sản phẩm bằng semantic search**.

### ❌ **Cách Tìm Kiếm Cũ (Keyword Search):**
```
Query: "Gấu hồng"
→ Tìm sản phẩm chứa chính xác từ "hồng"
→ Kết quả: Gấu Gấu hồng, Gấu hồng cao cấp
→ Không tìm thấy: Gấu đỏ hồng, Gấu hồng mềm mại (không chứa từ "gấu")
```

### ✅ **Cách Tìm Kiếm Mới (Semantic Search với ChromaDB):**
```
Query: "Gấu bông hồng mềm cho bé gái"
→ ChromaDB hiểu NGHĨA của query
→ Kết quả: Gấu hồng, Gấu hồng cao cấp, Gấu đỏ tươi, v.v.
→ Tìm thấy: Tất cả gấu màu hồng/đỏ, bất kể cách diễn đạt
```

---

## 🚀 **Installation & Setup**

### **Bước 1: Cài Đặt Dependencies**

```bash
cd backend

# Install ChromaDB + Sentence-Transformers
pip install -r requirements.txt

# Hoặc install manual:
pip install chromadb>=0.4.0 sentence-transformers>=2.2.0
```

### **Bước 2: Tạo ChromaDB Embeddings**

**Option A: Django Management Command (Recommended)**
```bash
cd backend

# Lần đầu: Tạo embeddings cho tất cả sản phẩm
python manage.py init_chroma

# Output:
# 🚀 Đang khởi tạo ChromaDB embeddings...
# ✅ Added 50 products to ChromaDB
# 📊 Tổng sản phẩm trong ChromaDB: 50
```

**Option B: Từ Django Shell**
```bash
cd backend
python manage.py shell

>>> from ai_agent.services import AIAgentService
>>> service = AIAgentService()
>>> result = service.create_chroma_embeddings()
>>> print(result)
```

**Option C: Force Refresh (Xóa cũ, tạo mới)**
```bash
# Xóa embeddings cũ, rebuild từ đầu
python manage.py init_chroma --refresh
```

---

## 📍 **ChromaDB Hoạt Động Như Thế Nào?**

```
Bước 1: Tạo Embeddings (1 lần, lưu lâu dài)
───────────────────────────────────────────
Product: "Gấu bông hồng cao cấp mềm mại cho bé"
    ↓
Sentence-Transformers (model: all-MiniLM-L6-v2)
    ↓
Vector: [0.12, 0.45, 0.89, ..., 0.23]  ← 384 chiều vector
    ↓
ChromaDB lưu trữ: Product ID + Vector + Metadata
    ↓
Database: chroma_db/ folder (local storage)


Bước 2: Tìm Kiếm (Real-time)
────────────────────────────
Query: "Gấu hồng dễ thương"
    ↓
Sentence-Transformers (cùng model)
    ↓
Query Vector: [0.11, 0.46, 0.88, ..., 0.24]
    ↓
So sánh với tất cả Product Vector (using Cosine Similarity)
    ↓
Top 5 sản phẩm gần nhất
    ↓
Kết quả: [
  {id: 1, name: "Gấu hồng", score: 0.95},
  {id: 5, name: "Gấu hồng cao cấp", score: 0.92},
  ...
]
```

---

## 💻 **Sử Dụng ChromaDB trong Code**

### **Cách 1: Direct Search (Tìm kiếm trực tiếp)**

```python
from ai_agent.services import AIAgentService

service = AIAgentService()

# Tìm kiếm sản phẩm với ChromaDB
results = service.search_products_with_chroma(
    query="Gấu bông hồng mềm mại",
    top_k=5,         # Trả về top 5 sản phẩm
    score_threshold=0.3  # Ngưỡng similarity score
)

# Kết quả:
for product in results:
    print(f"{product['name']}: {product['chroma_similarity_score']}")
    # Output:
    # Gấu hồng cao cấp: 0.95
    # Gấu hồng mềm: 0.93
    # Gấu đỏ tươi: 0.89
```

### **Cách 2: Tích hợp vào AI Agent Chat**

**File: backend/ai_agent/services.py**

```python
def chat(self, conversation: ConversationSession, user_message: str) -> Dict:
    """Gửi tin nhắn đến AI"""
    
    # 1️⃣ Gọi AI (Gemini/OpenAI)
    ai_response = self._call_gemini_api(conversation, user_message)
    
    # 2️⃣ Dùng ChromaDB tìm sản phẩm liên quan
    products = self.search_products_with_chroma(
        query=user_message,  # Dùng user message làm query
        top_k=5
    )
    
    # 3️⃣ Trả về response + products
    return {
        'ai_response': ai_response,
        'products': products  # Để frontend hiển thị
    }
```

### **Cách 3: REST API Endpoint (tùy chọn)**

**File: backend/ai_agent/views.py**

```python
from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['POST'])
def chroma_search(request):
    """
    POST /api/ai/chroma-search/
    Body: {"query": "Gấu bông hồng mềm"}
    """
    query = request.data.get('query', '')
    
    if not query:
        return Response({'error': 'Query required'}, status=400)
    
    service = AIAgentService()
    products = service.search_products_with_chroma(query, top_k=5)
    
    return Response({
        'query': query,
        'results': products,
        'count': len(products)
    })
```

---

## 📊 **ChromaDB Statistics & Management**

### **Kiểm Tra ChromaDB Status**

```python
from ai_agent.chroma_service import ChromaDBService

service = ChromaDBService()

# Lấy thông tin collection
stats = service.get_collection_stats()
print(stats)
# Output:
# {
#   'total_products': 50,
#   'collection_name': 'teddy_products',
#   'status': 'ready'
# }
```

### **Cập Nhật Embedding Khi Sản Phẩm Thay Đổi**

```python
from ai_agent.chroma_service import ChromaDBService
from products.models import Product

# Khi sản phẩm bị cập nhật
product = Product.objects.get(id=1)
product.name = "Gấu hồng mới"
product.save()

# Cập nhật embedding
service = ChromaDBService()
service.update_product_embedding(product)
```

### **Xóa Embedding Khi Sản Phẩm Bị Xóa**

```python
service = ChromaDBService()
service.delete_product_embedding(product_id=1)
```

---

## ⚙️ **Configuration**

### **ChromaDB Default Settings**

```python
# File: backend/ai_agent/chroma_service.py

# Location: d:/TeddyShop/backend/chroma_db/
# Storage: Persistent (lưu file local)
# Similarity: Cosine distance
# Embedding Model: all-MiniLM-L6-v2 (384 dimensions)
```

### **Thay Đổi Embedding Model (Optional)**

```python
# Nếu muốn embedding quality tốt hơn (mỗi chậm hơn):
# Sửa trong chroma_service.py:

# GOOD (default):
sentence_transformers.SentenceTransformer('all-MiniLM-L6-v2')
# 384 dimensions, nhanh, đủ tốt

# BETTER (slower):
sentence_transformers.SentenceTransformer('all-mpnet-base-v2')
# 768 dimensions, chậm hơn, chính xác hơn

# BEST (slowest):
sentence_transformers.SentenceTransformer('all-large-v1')
# 768 dimensions, chậm, chính xác nhất
```

---

## 🐛 **Troubleshooting**

### **Problem: ChromaDB không tìm được sản phẩm**

```
Cause: Embeddings chưa được tạo
Solution:
python manage.py init_chroma
```

### **Problem: Memory quá high**

```
Cause: ChromaDB load tất cả embedding vào RAM
Solution:
- Reduce top_k size
- Use score_threshold caothơn (0.5 thay vì 0.3)
- Upgrade server RAM
```

### **Problem: Tìm kiếm kết quả sai**

```
Cause: Embedding model không hiểu domain sản phẩm
Solution:
- Fine-tune embedding model (advanced)
- Combine ChromaDB + keyword search
- Thêm metadata columns
```

---

## 📈 **Performance Tips**

| Tối Ưu | Thực Hiện | Tác Dụng |
|--------|----------|---------|
| Cache Results | Lưu kết quả tìm kiếm 5 phút | -50% API calls |
| Batch Indexing | Tạo embeddings hàng loạt | -80% tạo lần đầu |
| Similarity Threshold | top_k=3, score>=0.5 | -70% memory usage |
| On-Demand Init | Tạo embeddings khi cần | Giảm startup time |

---

## 🎯 **Next Steps**

### ✅ Quick Start:
```bash
# 1. Install
pip install -r requirements.txt

# 2. Initialize
python manage.py init_chroma

# 3. Test
python manage.py shell
>>> from ai_agent.services import AIAgentService
>>> service = AIAgentService()
>>> results = service.search_products_with_chroma("gấu hồng")
>>> print(results)
```

### 📚 More Info:
- [ChromaDB Docs](https://docs.trychroma.com)
- [Sentence-Transformers](https://www.sbert.net/)
- [Semantic Search](https://huggingface.co/spaces/sentence-transformers/semantic-search)

---

**Chúc bạn sử dụng ChromaDB thành công!** 🚀
