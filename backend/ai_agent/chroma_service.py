"""
ChromaDB Service - Quản lý Vector Embeddings cho AI Agent
Giúp AI Agent tìm kiếm sản phẩm bằng semantic search (tìm kiếm theo ý nghĩa)
"""

import os
import logging
import chromadb
from typing import List, Dict, Optional
from django.conf import settings
from products.models import Product

logger = logging.getLogger(__name__)


class ChromaDBService:
    """
    Service để quản lý vector database ChromaDB.
    
    ChromaDB lưu trữ "embeddings" - dạng vector hóa của sản phẩm.
    Giúp tìm kiếm sản phẩm theo ý nghĩa, không chỉ keyword.
    
    Ví dụ:
    - "Gấu bông hồng mềm mại" → tìm được sản phẩm "Gấu hồng cao cấp"
    - "Quà tặng cho bé gái" → tìm được các gấu bông màu hồng, tím
    """
    
    def __init__(self):
        """Khởi tạo ChromaDB client"""
        try:
            # Tạo hoặc lấy ChromaDB client (lưu local hoặc memory)
            self.chroma_dir = os.path.join(
                settings.BASE_DIR, 
                'chroma_db'  # Thư mục lưu ChromaDB
            )
            
            # Tạo thư mục nếu không tồn tại
            os.makedirs(self.chroma_dir, exist_ok=True)
            
            # Khởi tạo Chroma client (persistent - lưu trữ lâu dài)
            self.client = chromadb.PersistentClient(
                path=self.chroma_dir,
                settings=chromadb.Settings(
                    is_persistent=True,
                    anonymized_telemetry=False,
                )
            )
            
            # Lấy collection (như table trong database)
            self.collection = self.client.get_or_create_collection(
                name="teddy_products",
                metadata={"hnsw:space": "cosine"}  # Dùng cosine similarity
            )
            
            logger.info(f"✅ ChromaDB initialized at {self.chroma_dir}")
            
        except Exception as e:
            logger.error(f"❌ Error initializing ChromaDB: {str(e)}")
            raise
    
    def add_product_embeddings(self, force_refresh: bool = False):
        """
        Thêm embeddings của tất cả sản phẩm vào ChromaDB.
        
        Args:
            force_refresh: Nếu True, xóa collection cũ và tạo mới
            
        Flow:
        1. Lấy tất cả sản phẩm từ Django database
        2. Tạo text description cho mỗi sản phẩm
        3. ChromaDB tự động hóa thành vector
        4. Lưu vào collection
        """
        try:
            # Nếu force_refresh, xóa collection cũ
            if force_refresh:
                try:
                    self.client.delete_collection(name="teddy_products")
                    self.collection = self.client.get_or_create_collection(
                        name="teddy_products",
                        metadata={"hnsw:space": "cosine"}
                    )
                    logger.info("🔄 ChromaDB collection reset")
                except Exception as e:
                    logger.warning(f"⚠️ Could not delete old collection: {str(e)}")
            
            # Lấy tất cả sản phẩm
            products = Product.objects.filter(status='active').select_related('category')
            
            if not products.exists():
                logger.warning("⚠️ No products found to index")
                return {"status": "warning", "message": "No products found"}
            
            # Chuẩn bị dữ liệu cho ChromaDB
            ids = []
            documents = []
            metadatas = []
            
            for product in products:
                # Tạo unique ID
                product_id = f"product_{product.id}"
                ids.append(product_id)
                
                # Tạo document (text description để hóa vector)
                # ChromaDB sẽ lấy text này để tạo embeddings
                doc_text = self._create_product_document(product)
                documents.append(doc_text)
                
                # Metadata (thông tin bổ sung)
                metadata = {
                    "product_id": str(product.id),
                    "name": product.name,
                    "category": product.category.name if product.category else "Unknown",
                    "price": str(product.price),
                    "status": product.status,
                }
                metadatas.append(metadata)
            
            # Thêm vào ChromaDB collection
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
            )
            
            logger.info(f"✅ Added {len(products)} products to ChromaDB")
            return {
                "status": "success",
                "message": f"Added {len(products)} products to ChromaDB"
            }
            
        except Exception as e:
            logger.error(f"❌ Error adding product embeddings: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def search_similar_products(
        self, 
        query: str, 
        top_k: int = 5,
        score_threshold: float = 0.3
    ) -> List[Dict]:
        """
        Tìm kiếm sản phẩm tương tự dựa trên text query (semantic search).
        
        ChromaDB sẽ:
        1. Hóa vector query ("Gấu hồng mềm")
        2. So sánh với vector của sản phẩm
        3. Trả về top-k sản phẩm gần nhất
        
        Args:
            query: Text tìm kiếm
            top_k: Số sản phẩm trả về
            score_threshold: Ngưỡng điểm tương tự (0-1), >= ngưỡng mới trả về
            
        Returns:
            List[Dict]: Danh sách sản phẩm được rank theo độ tương tự
            
        Ví dụ:
            query = "Gấu bông hồng cho bé gái"
            Results:
            [
                {"id": 1, "name": "Gấu hồng cao cấp", "score": 0.85, ...},
                {"id": 5, "name": "Gấu bông đỏ tươi", "score": 0.78, ...},
                ...
            ]
        """
        try:
            # Truy vấn ChromaDB
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k,
            )
            
            # Xử lý kết quả
            similar_products = []
            
            if results and results['ids'] and len(results['ids']) > 0:
                ids_list = results['ids'][0]  # Query trả về list of lists
                documents_list = results['documents'][0]
                distances_list = results['distances'][0]  # Distance (càng nhỏ càng giống)
                metadatas_list = results['metadatas'][0]
                
                for idx, distance in enumerate(distances_list):
                    # ChromaDB dùng distance, chuyển thành similarity score
                    # Distance nhỏ = giống nhau = score cao
                    similarity_score = 1 - (distance / 2)  # Normalize to 0-1
                    
                    if similarity_score >= score_threshold:
                        metadata = metadatas_list[idx]
                        product_id = int(metadata.get('product_id', 0))
                        
                        # Lấy product object từ database
                        try:
                            product = Product.objects.get(id=product_id)
                            similar_products.append({
                                'product': product,
                                'similarity_score': round(similarity_score, 3),
                                'distance': round(distance, 3),
                            })
                        except Product.DoesNotExist:
                            logger.warning(f"Product {product_id} not found in database")
            
            logger.info(f"🔍 Found {len(similar_products)} similar products for query: {query}")
            return similar_products
            
        except Exception as e:
            logger.error(f"❌ Error searching products: {str(e)}")
            return []
    
    def _create_product_document(self, product: Product) -> str:
        """
        Tạo text description cho sản phẩm để ChromaDB hóa vector.
        
        Thêm càng nhiều thông tin càng tốt để embeddings chính xác.
        Ví dụ: tên, category, mô tả, đặc điểm, ... → 1 text dài
        """
        parts = [
            f"Sản phẩm: {product.name}",
            f"Danh mục: {product.category.name if product.category else 'Khác'}",
            f"Giá: {product.price} VND",
        ]
        
        # Thêm mô tả nếu có
        if product.description:
            parts.append(f"Mô tả: {product.description}")
        
        # Thêm các keyword tương liên
        if product.category:
            parts.append(f"Loại: {product.category.name}")
        
        # Ghép lại thành 1 document duy nhất
        document = " | ".join(parts)
        return document
    
    def delete_product_embedding(self, product_id: int):
        """Xóa embedding của 1 sản phẩm (khi sản phẩm bị xóa)"""
        try:
            self.collection.delete(ids=[f"product_{product_id}"])
            logger.info(f"✅ Deleted embedding for product {product_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error deleting product embedding: {str(e)}")
            return False
    
    def update_product_embedding(self, product: Product):
        """Cập nhật embedding của 1 sản phẩm"""
        try:
            product_id = f"product_{product.id}"
            doc_text = self._create_product_document(product)
            metadata = {
                "product_id": str(product.id),
                "name": product.name,
                "category": product.category.name if product.category else "Unknown",
                "price": str(product.price),
                "status": product.status,
            }
            
            # Upsert (update hoặc insert)
            self.collection.upsert(
                ids=[product_id],
                documents=[doc_text],
                metadatas=[metadata],
            )
            logger.info(f"✅ Updated embedding for product {product.id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error updating product embedding: {str(e)}")
            return False
    
    def get_collection_stats(self) -> Dict:
        """Lấy thông tin thống kê của collection"""
        try:
            count = self.collection.count()
            return {
                "total_products": count,
                "collection_name": "teddy_products",
                "status": "ready" if count > 0 else "empty"
            }
        except Exception as e:
            logger.error(f"❌ Error getting collection stats: {str(e)}")
            return {"status": "error", "message": str(e)}
