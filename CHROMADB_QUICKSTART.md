# 🚀 ChromaDB Quick Start - TeddyShop

## 📋 **Tóm Tắt Nhanh**

ChromaDB được tích hợp vào dự án TeddyShop. Bạn có:

| File | Mục Đích |
|------|---------|
| `chroma_service.py` | ChromaDB service (vector database) |
| `init_chroma.py` | Management command để khởi tạo embeddings |
| services.py (updated) | `search_products_with_chroma()` method |
| `CHROMADB_GUIDE.md` | Chi tiết đầy đủ |

---

## ⚡ **3 Bước Để Dùng ChromaDB**

### **Step 1: Cài Đặt Dependencies**

```bash
cd backend

# ChromaDB + Sentence-Transformers đã thêm vào requirements.txt
pip install -r requirements.txt
```

### **Step 2: Khởi Tạo Embeddings**

```bash
cd backend

# Tạo vector embeddings cho tất cả sản phẩm
python manage.py init_chroma

# Output sẽ như:
# 🚀 Đang khởi tạo ChromaDB embeddings...
# ✅ Added 50 products to ChromaDB
# 📊 Tổng sản phẩm trong ChromaDB: 50
```

⏱️ **Lần đầu sẽ chậm (phải tạo 50 products), lần sau chỉ cần 1 giây.**

### **Step 3: Sử Dụng Trong Code**

```python
# Ví dụ 1: Tìm kiếm trực tiếp
from ai_agent.services import AIAgentService

service = AIAgentService()
results = service.search_products_with_chroma("Gấu hồng mềm")

# Ví dụ 2: Tích hợp vào AI Agent
def chat(conversation, user_message):
    # Get AI response
    ai_response = get_ai_response(user_message)
    
    # Search products with ChromaDB
    products = service.search_products_with_chroma(user_message)
    
    return {
        'ai_response': ai_response,
        'products': products
    }
```

---

## 🎯 **Khi Nào Dùng ChromaDB**

### ✅ **Dùng ChromaDB khi:**
- Tìm kiếm sản phẩm dựa trên **ý nghĩa** (semantic)
- User query không chứa chính xác tên sản phẩm
- Muốn AI Agent hiểu sâu hơn nhu cầu khách

### ❌ **Dùng Keyword Search khi:**
- User query chứa chính xác tên sản phẩm
- Speed tối thiểu (keyword search nhanh hơn)
- Embedding database chưa khởi tạo

---

## 📊 **So Sánh: Keyword Search vs ChromaDB**

### **Ví Dụ 1: Query = "Gấu hồng"**

| Phương thức | Kết quả |
|-----------|---------|
| **Keyword** | Gấu hồng, Gấu hồng cao cấp |
| **ChromaDB** | Gấu hồng, Gấu hồng cao cấp, Gấu đỏ, ... |

### **Ví Dụ 2: Query = "Quà tặng cho bé gái"**

| Phương thức | Kết quả |
|-----------|---------|
| **Keyword** | (Không tìm được, không chứa tên sản phẩm) |
| **ChromaDB** | Gấu hồng, Gấu tím, Gấu màu pastel, ... |

---

## 🔧 **Quản Lý ChromaDB**

### **Kiểm Tra Status**

```python
from ai_agent.chroma_service import ChromaDBService

service = ChromaDBService()
stats = service.get_collection_stats()
print(f"Total products: {stats['total_products']}")
```

### **Update Khi Sản Phẩm Thay Đổi**

```python
from products.models import Product
from ai_agent.chroma_service import ChromaDBService

# Sản phẩm bị update
product = Product.objects.get(id=1)
product.name = "Gấu mới"
product.save()

# Update embedding
service = ChromaDBService()
service.update_product_embedding(product)
```

### **Reset (Xóa All, Tạo Lại)**

```bash
python manage.py init_chroma --refresh
```

---

## 🐛 **Debug Issues**

### **Q: ChromaDB search trả về kết quả trống?**
```
A: Embeddings chưa được tạo!
   Solution: python manage.py init_chroma
```

### **Q: Kết quả không chính xác?**
```
A: Có thể model embedding không hiểu domain
   Solution: - Combine ChromaDB + keyword search
             - Thêm metadata
             - Fine-tune model (advanced)
```

### **Q: Memory quá cao?**
```
A: Load tất cả embedding vào RAM
   Solution: - Reduce top_k từ 5 → 3
             - Increase score_threshold từ 0.3 → 0.5
             - Upgrade server RAM
```

---

## 📁 **File Structure**

```
backend/
├── ai_agent/
│   ├── chroma_service.py              ← ChromaDB service
│   ├── services.py                    ← Updated with ChromaDB methods
│   ├── management/
│   │   └── commands/
│   │       └── init_chroma.py        ← Management command
│   └── CHROMADB_GUIDE.md              ← Detailed guide
│
├── chroma_db/                         ← ChromaDB data (auto-created)
│   └── (vector embeddings)
│
└── requirements.txt                   ← Updated with chromadb
```

---

## 💡 **Smart Integration Ideas**

### **1. Hybrid Search (Keyword + Semantic)**

```python
def smart_search(query):
    # Try ChromaDB first (semantic)
    chroma_results = search_products_with_chroma(query, top_k=5)
    
    # Combine with keyword search
    keyword_results = search_products_by_keyword(query, limit=5)
    
    # Merge & deduplicate
    all_results = {r['id']: r for r in chroma_results + keyword_results}
    
    return list(all_results.values())[:10]
```

### **2. AI-Powered Recommendations**

```python
def get_ai_recommendations(user_message):
    # Use ChromaDB to understand intent
    products = search_products_with_chroma(user_message, top_k=10)
    
    # AI ranks & explains
    ai_analysis = call_gemini(f"""
    User wants: {user_message}
    Available products: {[p['name'] for p in products]}
    
    Rank top 3 recommendations with explanation
    """)
    
    return ai_analysis
```

### **3. Cache Top Searches**

```python
# Cache popular searches to reduce load
POPULAR_QUERIES = [
    "Gấu hồng",
    "Gấu bông mềm",
    "Quà tặng cho bé",
    ...
]

for query in POPULAR_QUERIES:
    cache.set(
        f"chroma_{query}",
        search_products_with_chroma(query),
        timeout=3600
    )
```

---

## 📞 **Support & Resources**

| Cần Giúp | Link |
|---------|------|
| Lỗi ChromaDB | Xem `CHROMADB_GUIDE.md` |
| API Endpoints | Xem `views.py` |
| Models | Xem `models.py` |
| Tất cả docs | Xem `DOCUMENTATION_INDEX.md` |

---

## ✅ **Checklist**

- [ ] Cài đặt requirements.txt
- [ ] Chạy `python manage.py init_chroma`
- [ ] Test tìm kiếm trong Django shell
- [ ] Integrate vào views/serializers
- [ ] Deploy lên Railway với embeddings

**Xong! ChromaDB sẵn sàng dùng!** 🎊
