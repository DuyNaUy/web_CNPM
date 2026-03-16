import os
import json
import uuid
import logging
from typing import List, Dict, Optional
import requests
from django.conf import settings
from django.db import models
from django.db.models import Q, Max
from .models import ConversationSession
from products.models import Product

# Try to import google.genai (new package)
try:
    import google.genai as genai
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    GENAI_AVAILABLE = False

logger = logging.getLogger(__name__)


class AIAgentService:
    """Service để tương tác với AI Agent - SIMPLIFIED VERSION
    
    Chỉ giữ lại:
    - Conversation management (start, add messages)
    - Basic API call to Gemini/OpenAI
    - Return responses (không có recommendation/order logic)
    """
    
    def __init__(self):
        # API Keys setup
        self.openai_api_key = getattr(settings, 'OPENAI_API_KEY', '') or os.getenv('OPENAI_API_KEY', '')
        self.gemini_api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
        
        # Model configs
        self.openai_model = 'gpt-3.5-turbo'
        
        # Build enhanced system prompt with product catalog
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self) -> str:
        """
        Xây dựng system prompt với thông tin sản phẩm từ database
        Giúp AI hiểu được catalog sản phẩm đầy đủ
        """
        # Lấy danh sách sản phẩm với mô tả
        products_info = self._get_product_catalog_summary()
        
        base_prompt = """Bạn là trợ lý AI cho cửa hàng TeddyShop bán các sản phẩm gấu bông cao cấp.
        
NHIỆM VỤ CỦA BẠN:
1. Giúp khách hàng tìm kiếm và chọn sản phẩm phù hợp
2. Cung cấp thông tin chi tiết về sản phẩm: giá, chất lượng, tính năng
3. Đưa ra gợi ý sản phẩm dựa trên nhu cầu của khách
4. Hỗ trợ quá trình mua hàng

QUYỀN HẠN:
- Bạn có quyền truy cập đầy đủ tất cả dữ liệu sản phẩm trong cửa hàng
- Có thể tìm kiếm sản phẩm theo: tên, danh mục, giá, đặc điểm
- Có thể nhắc đến tên sản phẩm để gợi ý cho khách

DANH SÁCH SẢN PHẨM HIỆN CÓ:
"""
        
        # Thêm thông tin sản phẩm vào prompt
        if products_info:
            base_prompt += products_info
        else:
            base_prompt += "Không có sản phẩm nào trong kho.\n"
        
        base_prompt += """
HƯỚNG DẪN PHẢN HỒI:
- Phản hồi bằng tiếng Việt, thân thiện, chuyên nghiệp
- Khi khách hỏi về sản phẩm, hãy gợi ý các sản phẩm liên quan
- Nêu rõ tên sản phẩm, giá, và ưu điểm khi gợi ý
- Sẵn sàng trả lời câu hỏi về shipping, đổi trả, bảo hành

QUAN TRỌNG: Mỗi khi bạn đề cập đến tên sản phẩm, hãy sử dụng tên chính xác từ danh sách trên."""
        
        return base_prompt
    
    def _get_product_catalog_summary(self) -> str:
        """
        Lấy thông tin tóm tắt về tất cả sản phẩm
        Để AI Agent có hiểu biết đầy đủ về catalog
        
        Returns:
            String chứa danh sách sản phẩm được format
        """
        try:
            products = Product.objects.filter(status='active').select_related('category')
            
            if not products.exists():
                return ""
            
            catalog_text = ""
            for idx, product in enumerate(products[:50], 1):  # Giới hạn 50 sản phẩm
                category_name = product.category.name if product.category else "Khác"
                stock_status = "Còn hàng" if product.stock > 0 else "Hết hàng"
                
                # Format: Tên sản phẩm | Giá | Danh mục | Tình trạng | Mô tả ngắn
                summary = f"""
{idx}. {product.name}
   - Giá: {int(product.price):,}đ
   - Danh mục: {category_name}
   - Tình trạng: {stock_status} (Tồn kho: {product.stock})
   - Đánh giá: {product.rating}/5 ({product.reviews_count} đánh giá)
   - Mô tả: {product.description[:100] if product.description else 'Chưa có mô tả'}"""
                
                catalog_text += summary
            
            return catalog_text
        except Exception as e:
            logger.warning(f"Error building product catalog: {str(e)}")
            return ""

    def start_conversation(self, user=None) -> ConversationSession:
        """Bắt đầu một phiên hội thoại mới"""
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        conversation = ConversationSession.objects.create(
            user=user,
            session_id=session_id
        )
        return conversation

    def chat(self, conversation: ConversationSession, user_message: str) -> Dict:
        """
        Gửi tin nhắn đến AI và nhận phản hồi
        
        Returns:
            {
                'ai_response': str,  # phản hồi từ AI
                'products': list     # danh sách sản phẩm (để custom logic xử lý)
            }
        """
        # Lưu tin nhắn từ user
        conversation.add_message('user', user_message)
        
        # Ưu tiên Gemini nếu có API key
        if self.gemini_api_key and GENAI_AVAILABLE:
            try:
                response = self._call_gemini_api(conversation, user_message)
                # Lưu phản hồi từ AI với products
                conversation.add_message('assistant', response['ai_response'], products=response.get('products', []))
                return response
            except Exception as e:
                logger.error(f"Error calling Gemini API: {str(e)}")
        
        # Fallback to OpenAI
        if self.openai_api_key:
            try:
                response = self._call_openai_api(conversation, user_message)
                # Lưu phản hồi từ AI với products
                conversation.add_message('assistant', response['ai_response'], products=response.get('products', []))
                return response
            except Exception as e:
                logger.error(f"Error calling OpenAI API: {str(e)}")
        
        # Fallback: Search products based on user message keywords
        logger.warning("No API keys available - using fallback mode with keyword search")
        response = self._get_fallback_response(user_message)
        conversation.add_message('assistant', response['ai_response'], products=response.get('products', []))
        
        return response

    def _call_openai_api(self, conversation: ConversationSession, user_message: str) -> Dict:
        """Gọi OpenAI API"""
        headers = {
            'Authorization': f'Bearer {self.openai_api_key}',
            'Content-Type': 'application/json'
        }
        
        # Prepare messages from conversation history
        messages = [{'role': 'system', 'content': self.system_prompt}]
        
        ctx = conversation.get_context()
        if 'messages' in ctx:
            # Lấy 10 message gần đây để giữ context
            for msg in ctx['messages'][-10:]:
                messages.append({
                    'role': msg['role'],
                    'content': msg['content']
                })
        
        payload = {
            'model': self.openai_model,
            'messages': messages,
            'temperature': 0.7,
            'max_tokens': 1000
        }
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=30
        )
        
        response.raise_for_status()
        result = response.json()
        
        ai_response = result['choices'][0]['message']['content']
        
        # Trích xuất sản phẩm từ response và clean text
        cleaned_response, products = self._extract_products_from_response(ai_response, user_message)
        
        return {
            'ai_response': cleaned_response,
            'products': products
        }

    def _call_gemini_api(self, conversation: ConversationSession, user_message: str) -> Dict:
        """Gọi Gemini API"""
        try:
            client = genai.Client(api_key=self.gemini_api_key)
            
            # Prepare conversation history
            history_text = ""
            ctx = conversation.get_context()
            if 'messages' in ctx:
                for msg in ctx['messages'][-10:]:
                    role = "User" if msg['role'] == "user" else "Assistant"
                    history_text += f"{role}: {msg['content']}\n"
            
            # Prepare the full prompt
            full_prompt = f"""{self.system_prompt}

Lịch sử trò chuyện:
{history_text}

Khách hàng: {user_message}

Trợ lý:"""
            
            # Call Gemini API
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=full_prompt
            )
            
            ai_response = response.text if response.text else "Không thể tạo phản hồi"
            
            # Trích xuất sản phẩm từ response và clean text
            cleaned_response, products = self._extract_products_from_response(ai_response, user_message)
            
            return {
                'ai_response': cleaned_response,
                'products': products
            }
            
        except Exception as e:
            raise e

    def _get_fallback_response(self, user_message: str) -> Dict:
        """
        Fallback mode khi không có API keys
        - Tìm kiếm sản phẩm dựa trên keywords từ user message
        - Trả về response với products tìm được
        
        Args:
            user_message: Tin nhắn từ user
            
        Returns:
            Dict với ai_response và products list
        """
        try:
            # Trích xuất keywords từ user message
            keywords = self._extract_keywords_from_message(user_message)
            
            # Tìm kiếm sản phẩm
            products_data = []
            if keywords:
                # Search products by keywords
                products_found = self.search_products_by_keyword(' '.join(keywords), limit=5)
                products_data = products_found
            else:
                # Nếu không tìm được keywords, trả về top products
                try:
                    top_products = Product.objects.filter(status='active').order_by('-sold_count')[:5]
                    for product in top_products:
                        # Extract variants for each product
                        variants = []
                        if product.variants.exists():
                            variants = [{
                                'id': v.id,
                                'size': v.size,
                                'price': int(v.price) if v.price else int(product.price),
                                'stock': v.stock
                            } for v in product.variants.all()]
                        
                        products_data.append({
                            'id': product.id,
                            'name': product.name,
                            'price': int(product.price),
                            'stock': product.stock,
                            'image_url': self._get_product_image_url(product),
                            'unit': product.unit if hasattr(product, 'unit') else '',
                            'variants': variants,
                            'quantity': 1
                        })
                except Exception as e:
                    logger.error(f"Error getting top products: {str(e)}")
            
            # Tạo response text
            if products_data:
                ai_response = f"""Cảm ơn bạn! Tôi tìm thấy một số sản phẩm phù hợp với yêu cầu của bạn:

{', '.join([p['name'] for p in products_data[:3]])}

Bạn có muốn xem chi tiết hoặc thêm vào giỏ hàng không?"""
            else:
                ai_response = "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp. Bạn có thể mô tả chi tiết hơn hoặc xem danh mục sản phẩm của chúng tôi?"
                
            return {
                'ai_response': ai_response,
                'products': products_data
            }
            
        except Exception as e:
            logger.error(f"Error in fallback response: {str(e)}")
            return {
                'ai_response': "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
                'products': []
            }

    def _extract_keywords_from_message(self, message: str) -> List[str]:
        """
        Trích xuất keywords từ user message để tìm kiếm sản phẩm
        
        Args:
            message: User message
            
        Returns:
            List các keywords
        """
        try:
            # Loại bỏ các từ phổ biến (stopwords)
            common_words = {
                'là', 'cái', 'chiếc', 'em', 'bé', 'nhỏ', 'lớn', 'cao', 'thấp',
                'tôi', 'bạn', 'tôi muốn', 'tôi cần', 'có', 'không', 'gì', 'nào',
                'và', 'hoặc', 'nhưng', 'vì', 'khi', 'mà', 'để', 'trong', 'ngoài'
            }
            
            # Convert to lowercase và split
            words = message.lower().split()
            
            # Filter stopwords
            keywords = [w.strip('.,!?;:') for w in words if w.strip('.,!?;:') not in common_words and len(w.strip('.,!?;:')) > 2]
            
            return keywords[:5]  # Limit to 5 keywords
        except Exception as e:
            logger.error(f"Error extracting keywords: {str(e)}")
            return []

    def _extract_products_from_response(self, ai_response: str, user_message: str = None) -> tuple:
        """
        Trích xuất tên sản phẩm từ response của AI
        Sử dụng cải tiến fuzzy matching + intent-based filtering
        Trả về: (cleaned_response, products_list)
        
        Args:
            ai_response: Response từ AI
            user_message: Câu hỏi của khách hàng (tùy chọn)
            
        Returns:
            Tuple: (cleaned_response, products_list)
        """
        result = self.improve_product_extraction(ai_response, user_message)
        
        # Format products cho return
        products = []
        for product in result['products']:
            prod_obj = Product.objects.filter(id=product['id']).first()
            if prod_obj:
                # Extract variants from product
                variants = []
                variant_prices = [int(prod_obj.price)]  # Bắt đầu với base price
                
                if prod_obj.variants.exists():
                    for v in prod_obj.variants.all():
                        variant_price = int(v.price) if v.price else int(prod_obj.price)
                        variants.append({
                            'id': v.id,
                            'size': v.size,
                            'price': variant_price,
                            'stock': v.stock
                        })
                        variant_prices.append(variant_price)
                
                # Tính min-max price từ base price + tất cả variant prices
                price_range = {
                    'min': min(variant_prices),
                    'max': max(variant_prices)
                }
                
                prod_data = {
                    'id': product['id'],
                    'name': product['name'],
                    'price': product['price'],
                    'description': product['description'],
                    'stock': product['stock'],
                    'image_url': self._get_product_image_url(prod_obj),
                    'unit': prod_obj.unit if hasattr(prod_obj, 'unit') else '',
                    'variants': variants,  # Add variants array
                    'quantity': 1,  # Default quantity
                    'price_range': price_range  # Min-max price range
                }
                products.append(prod_data)
        
        return result['cleaned_response'], products[:5]  # Limit to 5 products

    def _clean_response_text(self, text: str, product_names: List[str]) -> str:
        """
        Xóa bỏ các dòng text mô tả chi tiết sản phẩm
        Giữ lại phần giới thiệu chung
        """
        if not product_names:
            return text
        
        lines = text.split('\n')
        cleaned_lines = []
        skip_next_line = False
        
        for i, line in enumerate(lines):
            # Kiểm tra nếu dòng này chứa tên sản phẩm
            contains_product = any(product.lower() in line.lower() for product in product_names)
            
            if contains_product:
                # Skip dòng này và một hoặc hai dòng tiếp theo nếu chúng là chi tiết
                skip_next_line = True
                continue
            elif skip_next_line:
                # Kiểm tra nếu dòng này là chi tiết (giá, mô tả)
                if any(keyword in line.lower() for keyword in ['đ', 'giá', 'mô tả', 'đặc điểm', 'size', 'màu']):
                    continue
                else:
                    skip_next_line = False
                    if line.strip():  # Chỉ thêm nếu không trống
                        cleaned_lines.append(line)
            else:
                if line.strip():  # Chỉ thêm những dòng không trống
                    cleaned_lines.append(line)
        
        # Xóa bỏ các dòng trống thừa ở cuối
        while cleaned_lines and not cleaned_lines[-1].strip():
            cleaned_lines.pop()
        
        cleaned_text = '\n'.join(cleaned_lines)
        
        # Nếu text trống sau khi clean, trả về giới thiệu mặc định
        if not cleaned_text.strip():
            cleaned_text = "Tôi có các sản phẩm phù hợp cho bạn:"
        
        return cleaned_text

    def close_conversation(self, conversation: ConversationSession) -> None:
        """Đóng phiên hội thoại"""
        conversation.is_active = False
        conversation.save()

    def get_conversation_history(self, conversation: ConversationSession) -> Dict:
        """Lấy lịch sử cuộc trò chuyện"""
        ctx = conversation.get_context()
        return {
            'session_id': conversation.session_id,
            'messages': ctx.get('messages', [])
        }
    
    def get_product_details(self, product_id: int) -> Optional[Dict]:
        """
        Lấy chi tiết sản phẩm cho chatbot
        
        Args:
            product_id: ID sản phẩm
            
        Returns:
            Dict chứa thông tin sản phẩm hoặc None nếu không tồn tại
        """
        try:
            product = Product.objects.get(id=product_id, status='active')
            
            # Lấy thông tin biến thể
            variants = []
            if product.variants.exists():
                variants = [
                    {
                        'id': v.id,
                        'size': v.size,
                        'price': int(v.price) if v.price else int(product.price),
                        'stock': v.stock
                    }
                    for v in product.variants.all()
                ]
            
            # Lấy hình ảnh từ product_images
            product_images = []
            if product.product_images.exists():
                for img in product.product_images.all():
                    img_url = img.image_url
                    if img.image and hasattr(img.image, 'url'):
                        img_url = img.image.url
                        if not img_url.startswith('http'):
                            base_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
                            img_url = base_url.rstrip('/') + img_url
                    product_images.append({
                        'id': img.id,
                        'image': img.image.url if img.image else '',
                        'image_url': img_url,
                        'is_main': img.is_main,
                        'order': img.order
                    })
            
            # Lấy hình ảnh từ images field (legacy)
            images = []
            try:
                if product.images:
                    images = json.loads(product.images) if isinstance(product.images, str) else product.images
            except (json.JSONDecodeError, TypeError):
                pass
            
            # Lấy thông số kỹ thuật
            specs = {}
            try:
                if product.specifications:
                    specs = json.loads(product.specifications) if isinstance(product.specifications, str) else product.specifications
            except (json.JSONDecodeError, TypeError):
                pass
            
            # Xây dựng response
            main_image_url = None
            if product.main_image and hasattr(product.main_image, 'url'):
                main_image_url = product.main_image.url
                if not main_image_url.startswith('http'):
                    base_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
                    main_image_url = base_url.rstrip('/') + main_image_url
            
            discount_percentage = 0
            if product.old_price and product.price and product.old_price > product.price:
                discount_percentage = int(((product.old_price - product.price) / product.old_price) * 100)
            
            # Tính min-max price
            min_price = int(product.price)
            max_price = int(product.price)
            if variants:
                prices = [v['price'] for v in variants]
                min_price = min(prices + [int(product.price)])
                max_price = max(prices + [int(product.price)])
            
            return {
                'id': product.id,
                'name': product.name,
                'slug': product.slug,
                'category': product.category.name if product.category else None,
                'category_name': product.category.name if product.category else None,
                'price': int(product.price),
                'old_price': int(product.old_price) if product.old_price else None,
                'discount_percentage': discount_percentage,
                'stock': product.stock,
                'unit': product.unit,
                'rating': float(product.rating),
                'reviews_count': product.reviews_count,
                'sold_count': product.sold_count,
                'description': product.description or '',
                'detail_description': product.detail_description or '',
                'main_image': product.main_image.url if product.main_image else None,
                'main_image_url': main_image_url,
                'images': images,
                'product_images': product_images,
                'specifications': specs,
                'origin': product.origin or '',
                'guarantee': product.guarantee or '',
                'variants': variants,
                'min_price': min_price,
                'max_price': max_price,
                'in_stock': product.stock > 0
            }
        except Product.DoesNotExist:
            return None
    
    def add_to_cart_from_chatbot(self, user, product_id: int, quantity: int = 1, unit: str = '') -> Dict:
        """
        Thêm sản phẩm vào giỏ hàng từ chatbot
        Hỗ trợ cả anonymous users (lưu vào conversation context)
        
        Args:
            user: User object hoặc None (anonymous)
            product_id: ID sản phẩm
            quantity: Số lượng
            unit: Kích thước/biến thể sản phẩm
            
        Returns:
            Dict chứa thông tin cart item hoặc error
        """
        from orders.models import Cart, CartItem
        
        try:
            # Lấy sản phẩm
            product = Product.objects.get(id=product_id, status='active')
            
            # Kiểm tra stock
            if unit and product.variants.exists():
                variant = product.variants.filter(size=unit).first()
                if not variant:
                    return {
                        'error': f'Kích thước {unit} không tồn tại',
                        'success': False
                    }
                if variant.stock < quantity:
                    return {
                        'error': f'Số lượng tồn kho không đủ. Tồn kho: {variant.stock}',
                        'success': False
                    }
                item_price = int(variant.price) if variant.price else int(product.price)
            else:
                if product.stock < quantity:
                    return {
                        'error': f'Số lượng tồn kho không đủ. Tồn kho: {product.stock}',
                        'success': False
                    }
                item_price = int(product.price)
            
            # Nếu là authenticated user, lưu vào Cart model
            if user and user.is_authenticated:
                cart, created = Cart.objects.get_or_create(user=user)
                
                # Kiểm tra item đã tồn tại
                cart_item = CartItem.objects.filter(
                    cart=cart,
                    product_id=product_id,
                    unit=unit
                ).first()
                
                if cart_item:
                    cart_item.quantity += quantity
                    cart_item.save()
                else:
                    cart_item = CartItem.objects.create(
                        cart=cart,
                        product_id=product_id,
                        quantity=quantity,
                        price=item_price,
                        unit=unit
                    )
                
                return {
                    'success': True,
                    'message': f'Đã thêm {quantity} {product.name} vào giỏ hàng',
                    'product_id': product_id,
                    'quantity': cart_item.quantity,
                    'total_items': sum(
                        item.quantity for item in CartItem.objects.filter(cart=cart)
                    )
                }
            else:
                # Reference for anonymous user to add to cart locally
                return {
                    'success': True,
                    'message': 'Sản phẩm đã được chọn. Vui lòng đăng nhập để hoàn tất thêm vào giỏ hàng',
                    'product': {
                        'id': product_id,
                        'name': product.name,
                        'price': item_price,
                        'quantity': quantity,
                        'unit': unit,
                        'image_url': self._get_product_image_url(product)
                    }
                }
        except Product.DoesNotExist:
            return {'error': 'Sản phẩm không tồn tại', 'success': False}
        except Exception as e:
            logger.error(f"Error adding to cart: {str(e)}")
            return {'error': 'Lỗi khi thêm vào giỏ hàng', 'success': False}
    
    def create_buy_now_order(self, user, product_id: int, quantity: int = 1, unit: str = '') -> Dict:
        """
        Xử lý "Mua ngay" bằng cách thêm vào giỏ hàng
        Vì "Mua ngay" cần lấy thông tin địa chỉ, ta thêm vào giỏ và user sẽ hoàn tất ở checkout page
        
        Args:
            user: User object
            product_id: ID sản phẩm
            quantity: Số lượng
            unit: Kích thước/biến thể
            
        Returns:
            Dict chứa thông tin hoặc error
        """
        from orders.models import Cart, CartItem
        from decimal import Decimal
        
        try:
            if not user or not user.is_authenticated:
                return {'error': 'Vui lòng đăng nhập để mua hàng', 'success': False}
            
            # Lấy sản phẩm
            product = Product.objects.get(id=product_id, status='active')
            
            # Kiểm tra stock
            if unit and product.variants.exists():
                variant = product.variants.filter(size=unit).first()
                if not variant:
                    return {'error': f'Kích thước {unit} không tồn tại', 'success': False}
                if variant.stock < quantity:
                    return {'error': f'Số lượng tồn kho không đủ. Tồn kho: {variant.stock}', 'success': False}
                item_price = int(variant.price) if variant.price else int(product.price)
            else:
                if product.stock < quantity:
                    return {'error': f'Số lượng tồn kho không đủ. Tồn kho: {product.stock}', 'success': False}
                item_price = int(product.price)
            
            # Thêm vào giỏ hàng
            cart, created = Cart.objects.get_or_create(user=user)
            
            # Kiểm tra item đã tồn tại
            cart_item = CartItem.objects.filter(
                cart=cart,
                product_id=product_id,
                unit=unit
            ).first()
            
            if cart_item:
                cart_item.quantity += quantity
                cart_item.save()
            else:
                cart_item = CartItem.objects.create(
                    cart=cart,
                    product_id=product_id,
                    quantity=quantity,
                    price=item_price,
                    unit=unit
                )
            
            # Tính tổng items trong giỏ
            total_items = sum(item.quantity for item in CartItem.objects.filter(cart=cart))
            
            return {
                'success': True,
                'message': f'Sản phẩm "{product.name}" đã được thêm vào giỏ hàng. Vui lòng tiếp tục để thanh toán.',
                'product_id': product_id,
                'product_name': product.name,
                'quantity': cart_item.quantity,
                'total_items': total_items,
                'redirect_to_checkout': True  # Frontend có thể dùng flag này để redirect
            }
        except Product.DoesNotExist:
            return {'error': 'Sản phẩm không tồn tại', 'success': False}
        except Exception as e:
            logger.error(f"Error in buy now order: {str(e)}")
            return {'error': f'Lỗi khi xử lý mua ngay: {str(e)}', 'success': False}
    
    def _get_product_image_url(self, product) -> Optional[str]:
        """Helper để lấy URL hình ảnh sản phẩm"""
        if product.main_image and hasattr(product.main_image, 'url'):
            image_url = product.main_image.url
            if not image_url.startswith('http'):
                base_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
                image_url = base_url.rstrip('/') + image_url
            return image_url
        return None
    
    def search_products_by_keyword(self, keyword: str, limit: int = 10) -> List[Dict]:
        """
        Tìm kiếm sản phẩm theo từ khóa
        
        Args:
            keyword: Từ khóa tìm kiếm
            limit: Số lượng kết quả tối đa
            
        Returns:
            Danh sách sản phẩm phù hợp
        """
        try:
            products = Product.objects.filter(
                status='active'
            ).filter(
                Q(name__icontains=keyword) |
                Q(description__icontains=keyword) |
                Q(detail_description__icontains=keyword)
            )[:limit]
            
            result = []
            for product in products:
                # Get variants if exist
                variants = []
                if product.variants.exists():
                    variants = [
                        {
                            'id': v.id,
                            'size': v.size,
                            'price': int(v.price) if v.price else int(product.price),
                            'stock': v.stock
                        }
                        for v in product.variants.all()
                    ]
                
                result.append({
                    'id': product.id,
                    'name': product.name,
                    'price': int(product.price),
                    'category': product.category.name if product.category else None,
                    'description': product.description or '',
                    'rating': float(product.rating),
                    'stock': product.stock,
                    'image_url': self._get_product_image_url(product),
                    'variants': variants
                })
            
            return result
        except Exception as e:
            logger.error(f"Error searching products: {str(e)}")
            return []
    
    def search_products_by_category(self, category_name: str, limit: int = 10) -> List[Dict]:
        """
        Tìm kiếm sản phẩm theo danh mục
        
        Args:
            category_name: Tên danh mục
            limit: Số lượng kết quả tối đa
            
        Returns:
            Danh sách sản phẩm trong danh mục
        """
        try:
            products = Product.objects.filter(
                status='active',
                category__name__icontains=category_name
            )[:limit]
            
            result = []
            for product in products:
                # Get variants if exist
                variants = []
                if product.variants.exists():
                    variants = [
                        {
                            'id': v.id,
                            'size': v.size,
                            'price': int(v.price) if v.price else int(product.price),
                            'stock': v.stock
                        }
                        for v in product.variants.all()
                    ]
                
                result.append({
                    'id': product.id,
                    'name': product.name,
                    'price': int(product.price),
                    'category': product.category.name if product.category else None,
                    'description': product.description or '',
                    'rating': float(product.rating),
                    'stock': product.stock,
                    'image_url': self._get_product_image_url(product),
                    'variants': variants
                })
            
            return result
        except Exception as e:
            logger.error(f"Error searching by category: {str(e)}")
            return []
    
    def get_product_recommendations(self, product_id: int = None, limit: int = 5) -> List[Dict]:
        """
        Lấy danh sách sản phẩm được độc giả gợi ý
        Nếu có product_id, lấy các sản phẩm liên quan
        Nếu không, lấy các sản phẩm bán chạy nhất
        
        Args:
            product_id: ID sản phẩm để lấy sản phẩm tương tự
            limit: Số lượng gợi ý
            
        Returns:
            Danh sách sản phẩm được gợi ý
        """
        try:
            if product_id:
                # Lấy product hiện tại
                try:
                    current_product = Product.objects.get(id=product_id, status='active')
                    # Lấy sản phẩm cùng danh mục
                    products = Product.objects.filter(
                        status='active',
                        category=current_product.category
                    ).exclude(id=product_id).order_by('-sold_count', '-rating')[:limit]
                except Product.DoesNotExist:
                    products = Product.objects.filter(
                        status='active'
                    ).order_by('-sold_count', '-rating')[:limit]
            else:
                # Lấy sản phẩm bán chạy nhất
                products = Product.objects.filter(
                    status='active'
                ).order_by('-sold_count', '-rating')[:limit]
            
            result = []
            for product in products:
                # Get variants if exist
                variants = []
                if product.variants.exists():
                    variants = [
                        {
                            'id': v.id,
                            'size': v.size,
                            'price': int(v.price) if v.price else int(product.price),
                            'stock': v.stock
                        }
                        for v in product.variants.all()
                    ]
                
                result.append({
                    'id': product.id,
                    'name': product.name,
                    'price': int(product.price),
                    'category': product.category.name if product.category else None,
                    'sold_count': product.sold_count,
                    'rating': float(product.rating),
                    'image_url': self._get_product_image_url(product),
                    'quantity': 1,  # Default quantity for recommendations
                    'variants': variants
                })
            
            return result
        except Exception as e:
            logger.error(f"Error getting recommendations: {str(e)}")
            return []
    
    def get_all_products_dict(self) -> Dict[str, List]:
        """
        Lấy tất cả sản phẩm được organize theo danh mục
        Hữu ích cho AI Agent để có hiểu biết toàn diện
        
        Returns:
            Dict với key là danh mục, value là danh sách sản phẩm
        """
        try:
            from categories.models import Category
            
            result = {}
            categories = Category.objects.filter(products__status='active').distinct()
            
            for category in categories:
                products = Product.objects.filter(
                    status='active',
                    category=category
                ).values('id', 'name', 'price', 'rating', 'stock')
                
                result[category.name] = [
                    {
                        'id': p['id'],
                        'name': p['name'],
                        'price': int(p['price']),
                        'rating': float(p['rating']),
                        'in_stock': p['stock'] > 0
                    }
                    for p in products
                ]
            
            return result
        except Exception as e:
            logger.error(f"Error getting products dict: {str(e)}")
            return {}
    
    def _filter_products_by_intent(self, ai_response: str, user_message: str) -> List[Dict]:
        """
        Lọc sản phẩm dựa trên ý định của khách hàng từ câu hỏi
        Ưu tiên sản phẩm bán chạy (sold_count cao) và phù hợp nhất
        
        Args:
            ai_response: Response từ AI
            user_message: Câu hỏi của khách hàng
            
        Returns:
            Danh sách sản phẩm đã được lọc (tối thiểu 3, tối đa 5)
        """
        try:
            from difflib import SequenceMatcher
            
            # Kết hợp response + user message để tìm sản phẩm
            combined_text = f"{ai_response} {user_message}".lower()
            
            # Lấy tất cả sản phẩm active
            all_products = Product.objects.filter(status='active').select_related('category')
            
            products_scored = []
            
            for product in all_products:
                # Tính similarity score
                if product.name.lower() in combined_text:
                    similarity = 1.0
                else:
                    max_ratio = 0
                    for word in combined_text.split():
                        if len(word) > 2:  # Bỏ qua từ quá ngắn
                            ratio = SequenceMatcher(None, word, product.name.lower()).ratio()
                            max_ratio = max(max_ratio, ratio)
                    similarity = max_ratio
                
                if similarity >= 0.5:  # Ngưỡng thấp hơn để bắt được nhiều sản phẩm
                    # Tính tổng score: similarity + sold_count/total_products
                    max_sold = Product.objects.aggregate(models.Max('sold_count'))['sold_count__max'] or 1
                    sales_boost = (product.sold_count / max_sold) * 0.3  # Boost 30% dựa trên sales
                    
                    total_score = similarity + sales_boost
                    
                    products_scored.append({
                        'id': product.id,
                        'name': product.name,
                        'price': int(product.price),
                        'description': product.description or '',
                        'stock': product.stock,
                        'sold_count': product.sold_count,
                        'rating': float(product.rating),
                        'similarity': similarity,
                        'total_score': total_score
                    })
            
            # Sắp xếp theo total_score từ cao xuống thấp
            products_scored = sorted(products_scored, key=lambda x: x['total_score'], reverse=True)
            
            # Lấy top products (tối thiểu 3, tối đa 5)
            # Nếu có >= 3 sản phẩm, lấy tối thiểu 3; nếu không, lấy hết
            min_products = min(3, len(products_scored))
            products_to_return = products_scored[:5] if len(products_scored) >= 3 else products_scored
            
            # Nếu dưới 3 sản phẩm, thêm các sản phẩm bán chạy nhất
            if len(products_to_return) < 3:
                top_sellers = Product.objects.filter(status='active').order_by('-sold_count')[:3]
                for seller in top_sellers:
                    if not any(p['id'] == seller.id for p in products_to_return):
                        products_to_return.append({
                            'id': seller.id,
                            'name': seller.name,
                            'price': int(seller.price),
                            'description': seller.description or '',
                            'stock': seller.stock,
                            'sold_count': seller.sold_count,
                            'rating': float(seller.rating),
                            'similarity': 0,  # Không match với intent
                            'total_score': -1  # Fallback product
                        })
                        if len(products_to_return) >= 3:
                            break
            
            return products_to_return[:5]
            
        except Exception as e:
            logger.error(f"Error filtering products by intent: {str(e)}")
            # Fallback: trả về top sellers
            try:
                top_sellers = Product.objects.filter(status='active').order_by('-sold_count')[:3]
                return [{
                    'id': p.id,
                    'name': p.name,
                    'price': int(p.price),
                    'description': p.description or '',
                    'stock': p.stock,
                    'sold_count': p.sold_count,
                    'rating': float(p.rating),
                    'similarity': 0,
                    'total_score': p.sold_count
                } for p in top_sellers]
            except:
                return []

    def improve_product_extraction(self, ai_response: str, user_message: str = None) -> Dict:
        """
        Cải tiến việc trích xuất sản phẩm từ response
        Sử dụng fuzzy matching + intent-based filtering
        Ưu tiên sản phẩm bán chạy (sold_count) - tối thiểu 3 sản phẩm
        
        Returns:
            {
                'cleaned_response': str,  # Response đã được làm sạch
                'products': List[Dict],   # Danh sách sản phẩm tìm được (tối thiểu 3)
                'confidence': float       # Độ tự tin trong việc tìm sản phẩm
            }
        """
        try:
            from difflib import SequenceMatcher
            
            # Nếu không có user_message, sử dụng ai_response
            combined_text = f"{ai_response} {user_message or ''}".lower()
            
            # Sử dụng intent-based filtering
            if user_message:
                products = self._filter_products_by_intent(ai_response, user_message)
            else:
                # Fallback: dùng phương thức cũ
                products = []
                product_names = []
                all_products = Product.objects.filter(status='active').values('id', 'name', 'price', 'description', 'stock')
                
                for product in all_products:
                    if product['name'].lower() in ai_response.lower():
                        similarity = 1.0
                    else:
                        max_ratio = 0
                        for word in ai_response.lower().split():
                            ratio = SequenceMatcher(None, word, product['name'].lower()).ratio()
                            max_ratio = max(max_ratio, ratio)
                        similarity = max_ratio
                    
                    if similarity >= 0.6:
                        product_data = {
                            'id': product['id'],
                            'name': product['name'],
                            'price': int(product['price']),
                            'description': product['description'] or '',
                            'stock': product['stock'],
                            'similarity': similarity,
                            'total_score': similarity
                        }
                        products.append(product_data)
                        product_names.append(product['name'])
                
                products = sorted(products, key=lambda x: x['total_score'], reverse=True)[:5]
            
            # Extract product names để clean response
            product_names = [p['name'] for p in products]
            
            # Tính confidence score (0-1)
            if products and 'similarity' in products[0]:
                avg_similarity = sum(p.get('similarity', 0) for p in products) / len(products) if products else 0
            else:
                avg_similarity = 0.5 if products else 0
            
            # Clean response
            cleaned_response = self._clean_response_text(ai_response, product_names)
            
            return {
                'cleaned_response': cleaned_response,
                'products': products,
                'confidence': avg_similarity
            }
        except Exception as e:
            logger.error(f"Error improving product extraction: {str(e)}")
            return {
                'cleaned_response': ai_response,
                'products': [],
                'confidence': 0
            }
