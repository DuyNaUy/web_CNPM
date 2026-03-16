import os
import json
import uuid
from typing import List, Dict, Optional
import requests
import re
from django.conf import settings
from django.db.models import Q
from products.models import Product
from .models import ConversationSession, AIRecommendation, AutomatedOrder

# Try to import google.genai (new package), but make it optional
try:
    import google.genai as genai
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    GENAI_AVAILABLE = False


class AIAgentService:
    """Service để tương tác với AI Agent (tư vấn bán hàng)"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'OPENAI_API_KEY', '') or os.getenv('OPENAI_API_KEY', '')
        self.gemini_api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
        if self.gemini_api_key and GENAI_AVAILABLE:
            # New package: api_key will be passed directly to client
            pass
            
        self.model = 'gpt-3.5-turbo'  # hoặc 'gpt-4'
        self.system_prompt = """Bạn là một tư vấn viên bán hàng chuyên nghiệp cho cửa hàng TeddyShop bán các sản phẩm gấu bông và đồ chơi.
        
Nhiệm vụ của bạn:
1. Tư vấn khách hàng về sản phẩm phù hợp với nhu cầu của họ dựa trên danh sách sản phẩm cung cấp
2. Giới thiệu giá và đặc điểm nổi bật
3. Khi khách hàng đồng ý mua nhiều sản phẩm cùng lúc, hãy tạo một block JSON. MỌI THÔNG TIN VỀ ĐƠN HÀNG PHẢI ĐƯỢC CHỨA TRONG BLOCK JSON NÀY.
4. Block JSON có định dạng chính xác sau (bao bọc bởi ```json và ```):
```json
{
  "action": "checkout",
  "items": [
      {"product_id": 1, "quantity": 1, "size": ""}
  ]
}
```
Tuyệt đối chỉ dùng block này khi khách quyết định chốt mua.
5. Giữ thái độ thân thiện, phản hồi bằng tiếng Việt. Không in nội dung JSON ra cho khách đọc, chỉ để hệ thống bắt tín hiệu."""

    def start_conversation(self, user) -> ConversationSession:
        """Bắt đầu một phiên hội thoại mới"""
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        conversation = ConversationSession.objects.create(
            user=user,
            session_id=session_id
        )
        return conversation

    def get_products_context(self) -> str:
        """Lấy thông tin sản phẩm để cung cấp cho AI"""
        products = Product.objects.filter(status='active')[:20]  # Lấy 20 sản phẩm
        context = "Danh sách sản phẩm hiện có:\n"
        for product in products:
            context += f"\n- {product.name}: {product.price:,} VND (Đánh giá: {product.rating}/5, Đã bán: {product.sold_count})"
            if product.description:
                context += f"\n  {product.description}"
        return context

    def chat(self, conversation: ConversationSession, user_message: str) -> Dict:
        """
        Tương tác với AI Agent
        
        Returns a dict containing:
            - 'response': text reply
            - 'recommendations': list of recommendation objects (may be empty)
            - 'should_create_order': bool flag signalling checkout/address step
            - 'cart': current cart contents from context
        """
        # record user message
        conversation.add_message('user', user_message)
        
        # if we have a Gemini API key we prioritize it
        if self.gemini_api_key:
            try:
                ai_resp = self._call_gemini_api(conversation, user_message)
                # merge cart state into response (cart might be updated inside _call_gemini_api)
                ctx = conversation.get_context()
                ai_resp['cart'] = ctx.get('cart', [])
                return ai_resp
            except Exception as e:
                print(f"Error calling Gemini API: {str(e)}")
                # fall through to OpenAI

        # otherwise fallback to OpenAI if we have api key
        if self.api_key:
            try:
                ai_resp = self._call_openai_api(conversation, user_message)
                # merge cart state into response
                ctx = conversation.get_context()
                ai_resp['cart'] = ctx.get('cart', [])
                return ai_resp
            except Exception as e:
                print(f"Error calling OpenAI API: {str(e)}")
        
        return {
            'response': "Xin lỗi, hiện tại tôi không thể kết nối với trí tuệ nhân tạo. Vui lòng kiểm tra lại cấu hình API.",
            'recommendations': [],
            'should_create_order': False,
            'cart': []
        }

    def _call_openai_api(self, conversation: ConversationSession, user_message: str) -> Dict:
        """Gọi OpenAI API"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        # Chuẩn bị conversation history
        messages = [{'role': 'system', 'content': self.system_prompt}]
        
        ctx = conversation.get_context()
        if 'messages' in ctx:
            for msg in ctx['messages'][-10:]:  # Lấy 10 message gần đây nhất
                messages.append({
                    'role': msg['role'],
                    'content': msg['content']
                })
        
        # Thêm context sản phẩm
        products_context = self.get_products_context()
        messages[-1]['content'] = f"{messages[-1]['content']}\n\n{products_context}"
        messages.append({'role': 'user', 'content': user_message})
        
        payload = {
            'model': self.model,
            'messages': messages,
            'temperature': 0.7,
            'max_tokens': 1000
        }
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=payload
        )
        
        response.raise_for_status()
        result = response.json()
        
        assistant_message = result['choices'][0]['message']['content']
        
        # Thêm response vào conversation
        conversation.add_message('assistant', assistant_message)
        
        # Parse recommendations từ response (nếu có)
        recommendations = self._extract_recommendations(assistant_message)
        # augment with product info if product_id provided and persist
        for rec in recommendations:
            pid = rec.get('product_id')
            if pid:
                try:
                    prod = Product.objects.get(id=pid)
                    rec.setdefault('product_name', prod.name)
                    rec.setdefault('price', int(prod.price) if prod.price is not None else 0)
                    if prod.main_image and hasattr(prod.main_image, 'url'):
                        rec.setdefault('image_url', self._full_url(prod.main_image.url))
                    # save to db
                    try:
                        AIRecommendation.objects.create(
                            conversation=conversation,
                            product=prod,
                            reason=rec.get('reason', ''),
                            confidence_score=rec.get('confidence_score', rec.get('confidence', 0)),
                            quantity=rec.get('quantity', 1)
                        )
                    except Exception:
                        pass
                except Product.DoesNotExist:
                    pass
        return {
            'response': assistant_message,
            'recommendations': recommendations,
            'should_create_order': False
        }

    def _call_gemini_api(self, conversation: ConversationSession, user_message: str) -> Dict:
        """Call Gemini API (using new google.genai package) and parse special JSON blocks for multi-item checkouts"""
        try:
            # Create client with the new google.genai API
            client = genai.Client(api_key=self.gemini_api_key)
            
            history_text = ""
            ctx = conversation.get_context()
            if 'messages' in ctx:
                for msg in ctx['messages'][-10:]:
                    role = "User" if msg['role'] == "user" else "Assistant"
                    history_text += f"{role}: {msg['content']}\n"
                    
            products_context = self.get_products_context()
            
            prompt = (
                f"System Instruction:\n{self.system_prompt}\n\n"
                f"Context (Available Products):\n{products_context}\n\n"
                f"Conversation History:\n{history_text}\n"
                f"User: {user_message}\nAssistant:"
            )
            
            # Call the new API
            response = client.models.generate_content(
                model='models/gemini-2.5-flash',
                contents=prompt
            )
            
            assistant_message = response.text
            
            should_create_order = False
            cart = ctx.get('cart', [])
            
            # Check for checkout JSON block
            json_match = re.search(r'```json\s*(\{.*?"action"\s*:\s*"checkout".*?\})\s*```', assistant_message, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group(1))
                    if data.get('action') == 'checkout':
                        items = data.get('items', [])
                        if items:
                            should_create_order = True
                            new_cart = []
                            for item in items:
                                pid = item.get('product_id')
                                if not pid:
                                    continue
                                try:
                                    product = Product.objects.get(id=pid)
                                    new_cart.append({
                                        'product_id': product.id,
                                        'name': product.name,
                                        'price': int(product.price) if product.price is not None else 0,
                                        'size': str(item.get('size') or item.get('unit') or ''),
                                        'quantity': int(item.get('quantity', 1))
                                    })
                                except Product.DoesNotExist:
                                    continue
                                    
                            # overwrite cart with the auto-detected multi-items
                            if new_cart:
                                cart = new_cart
                                ctx['cart'] = cart
                                conversation.set_context(ctx)
                                
                            # strip the secret JSON from the visible message
                            assistant_message = assistant_message[:json_match.start()].strip()
                except Exception as e:
                    print(f"Error parsing Gemini JSON checkout block: {e}")
                    
            conversation.add_message('assistant', assistant_message)
            recommendations = self._extract_recommendations(assistant_message)
            
            # Optionally populate more recommendations from cart so the UI can show them nicely
            if should_create_order and cart:
                 for item in cart:
                     try:
                         prod = Product.objects.get(id=item['product_id'])
                         # Check if already in recommendations
                         if not any(r['product_id'] == prod.id for r in recommendations):
                             rec = {
                                 'product_id': prod.id,
                                 'product_name': prod.name,
                                 'price': int(prod.price) if prod.price is not None else 0,
                                 'quantity': item.get('quantity', 1),
                                 'reason': "Được chọn mua",
                                 'image_url': self._full_url(prod.main_image.url) if prod.main_image and hasattr(prod.main_image, 'url') else ''
                             }
                             recommendations.append(rec)
                     except Product.DoesNotExist:
                         pass
                         
            return {
                'response': assistant_message,
                'recommendations': recommendations,
                'should_create_order': should_create_order,
                'cart': cart
            }
        except Exception as e:
            print(f"Error calling new Gemini API: {str(e)}")
            raise


    def _full_url(self, path: str) -> str:
        """Helper: nếu đường dẫn tương đối, thêm tiền tố BASE_URL hoặc localhost"""
        if not path:
            return ''
        if path.startswith('http'):
            return path
        base = getattr(settings, 'BASE_URL', '') or 'http://localhost:8000'
        return base.rstrip('/') + path

    def _extract_recommendations(self, ai_response: str) -> List[Dict]:
        """Extract recommendations từ AI response - tìm sản phẩm được nhắc đến trong text"""
        recommendations = []
        
        try:
            # Loại bỏ markdown formatting để dễ tìm sản phẩm
            clean_response = re.sub(r'\*\*|\*|__', '', ai_response)
            response_lower = clean_response.lower()
            
            # Lấy tất cả sản phẩm active
            products = Product.objects.filter(status='active')
            
            # Tìm các sản phẩm được nhắc đến trong response
            # Grouped by name để tránh duplicate
            found_by_name = {}
            
            for product in products:
                product_lower = product.name.lower()
                
                # Kiểm tra xem tên sản phẩm có trong response không
                if product_lower in response_lower:
                    if product.name not in found_by_name:
                        found_by_name[product.name] = product
                    else:
                        # Nếu trùng tên, ưu tiên cái có giá cao hơn
                        if product.price and found_by_name[product.name].price:
                            if product.price > found_by_name[product.name].price:
                                found_by_name[product.name] = product
            
            # Convert grouped dict to list of recommendations
            for product_name, product in found_by_name.items():
                rec = {
                    'product_id': product.id,
                    'product_name': product.name,
                    'price': int(product.price) if product.price else 0,
                    'quantity': 1,
                    'reason': 'Được đề xuất',
                    'confidence_score': 0.8,
                    'image_url': self._full_url(product.main_image.url) if product.main_image and hasattr(product.main_image, 'url') else ''
                }
                recommendations.append(rec)
            
        except Exception as e:
            print(f"Error extracting recommendations: {e}")
            
        return recommendations

    def analyze_product_question(self, question: str) -> Dict:
        """
        Phân tích câu hỏi của user về sản phẩm gấu bông
        Trả về: {
            'display_type': 'detail' | 'list' | 'comparison' | 'recommendation',
            'product_ids': [list of product IDs],
            'filters': {...filter criteria...},
            'analysis': 'AI analysis text'
        }
        """
        try:
            if self.gemini_api_key:
                return self._analyze_with_gemini(question)
            elif self.api_key:
                return self._analyze_with_openai(question)
        except Exception as e:
            print(f"Error analyzing question: {e}")
        
        return self._default_analysis(question)

    def _analyze_with_gemini(self, question: str) -> Dict:
        """Phân tích câu hỏi dùng Gemini API (new google.genai package)"""
        try:
            client = genai.Client(api_key=self.gemini_api_key)
            
            analysis_prompt = f"""Bạn là AI assistant phân tích câu hỏi của khách hàng về sản phẩm gấu bông.

Phân tích câu hỏi sau và xác định:
1. display_type: 'detail' (tìm 1 sản phẩm cụ thể), 'list' (tìm nhiều sản phẩm), 'comparison' (so sánh các sản phẩm), 'recommendation' (yêu cầu gợi ý)
2. Các điều kiện lọc: giá, kích cỡ, màu sắc, độ tuổi, v.v.
3. Tên gấu bông cụ thể (nếu có)

Câu hỏi: {question}

Trả lời bằng JSON format:
{{
  "display_type": "detail|list|comparison|recommendation",
  "filters": {{
    "price_range": {{"min": 0, "max": 5000000}},
    "size": "tên kích cỡ nếu có",
    "color": "màu sắc nếu có",
    "search_keyword": "từ khóa tìm kiếm chính"
  }},
  "analysis": "Phân tích ngắn về câu hỏi (tiếng Việt)"
}}"""
            
            response = client.models.generate_content(
                model='models/gemini-2.5-flash',
                contents=analysis_prompt
            )
            try:
                # Extract JSON from response
                json_match = re.search(r'\{.*?\}', response.text, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                    # Tìm sản phẩm dựa trên filters
                    result['product_ids'] = self._find_products_by_filters(result.get('filters', {}))
                    return result
            except (json.JSONDecodeError, AttributeError) as e:
                print(f"Error parsing Gemini response: {e}")
            
            return self._default_analysis(question)
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            return self._default_analysis(question)

    def _analyze_with_openai(self, question: str) -> Dict:
        """Phân tích câu hỏi dùng OpenAI API"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        analysis_prompt = f"""Bạn là AI assistant phân tích câu hỏi của khách hàng về sản phẩm gấu bông.

Phân tích câu hỏi sau và xác định:
1. display_type: 'detail' (tìm 1 sản phẩm cụ thể), 'list' (tìm nhiều sản phẩm), 'comparison' (so sánh các sản phẩm), 'recommendation' (yêu cầu gợi ý)
2. Các điều kiện lọc: giá, kích cỡ, màu sắc, độ tuổi, v.v.
3. Tên gấu bông cụ thể (nếu có)

Câu hỏi: {question}

Trả lời bằng JSON format:
{{
  "display_type": "detail|list|comparison|recommendation",
  "filters": {{
    "price_range": {{"min": 0, "max": 5000000}},
    "size": "tên kích cỡ nếu có",
    "color": "màu sắc nếu có",
    "search_keyword": "từ khóa tìm kiếm chính"
  }},
  "analysis": "Phân tích ngắn về câu hỏi (tiếng Việt)"
}}"""
        
        payload = {
            'model': self.model,
            'messages': [
                {'role': 'system', 'content': 'You are a JSON response generator. Always respond with valid JSON only.'},
                {'role': 'user', 'content': analysis_prompt}
            ],
            'temperature': 0.3,
            'max_tokens': 500
        }
        
        try:
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers=headers,
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get('choices'):
                content = result['choices'][0]['message']['content']
                json_match = re.search(r'\{.*?\}', content, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                    # Tìm sản phẩm dựa trên filters
                    parsed['product_ids'] = self._find_products_by_filters(parsed.get('filters', {}))
                    return parsed
        except Exception as e:
            print(f"Error calling OpenAI: {e}")
        
        return self._default_analysis(question)

    def _find_products_by_filters(self, filters: Dict) -> List[int]:
        """Tìm sản phẩm dựa trên filters"""
        queryset = Product.objects.filter(status='active')
        
        # Filter by keyword
        keyword = filters.get('search_keyword', '').strip()
        if keyword:
            queryset = queryset.filter(
                Q(name__icontains=keyword) | 
                Q(description__icontains=keyword) |
                Q(detail_description__icontains=keyword)
            )
        
        # Filter by price
        price_range = filters.get('price_range', {})
        if price_range:
            min_price = price_range.get('min', 0)
            max_price = price_range.get('max')
            if min_price:
                queryset = queryset.filter(price__gte=min_price)
            if max_price:
                queryset = queryset.filter(price__lte=max_price)
        
        # Filter by size (if applicable)
        size = filters.get('size', '').strip()
        if size:
            queryset = queryset.filter(
                Q(variants__size__icontains=size) |
                Q(unit__icontains=size)
            ).distinct()
        
        return list(queryset.values_list('id', flat=True)[:20])

    def _default_analysis(self, question: str) -> Dict:
        """Default analysis khi không thể kết nối AI"""
        # Simple keyword matching
        question_lower = question.lower()
        products = Product.objects.filter(status='active')
        
        # Xác định display type dựa trên từ khóa
        display_type = 'recommendation'
        if 'so sánh' in question_lower or 'khác nhau' in question_lower:
            display_type = 'comparison'
        elif 'chi tiết' in question_lower or 'thông tin' in question_lower:
            display_type = 'detail'
        elif 'tất cả' in question_lower or 'toàn bộ' in question_lower:
            display_type = 'list'
        
        # Simple keyword search
        keywords = re.findall(r'\w+', question_lower)
        product_ids = []
        
        for keyword in keywords:
            if len(keyword) > 2:
                matches = products.filter(
                    Q(name__icontains=keyword) |
                    Q(description__icontains=keyword)
                ).values_list('id', flat=True)[:5]
                product_ids.extend(matches)
        
        return {
            'display_type': display_type,
            'product_ids': list(set(product_ids)[:10]),
            'filters': {'search_keyword': ' '.join(keywords)},
            'analysis': f"Tìm kiếm sản phẩm dựa trên: {question}"
        }

    def create_order_from_recommendations(self, 
                                        conversation: ConversationSession,
                                        product_ids: List[int],
                                        quantities: Dict[int, int],
                                        order_info: Dict) -> AutomatedOrder:
        """Tạo draft order từ recommendations"""
        
        automated_order = AutomatedOrder.objects.create(
            conversation=conversation,
            user=conversation.user,
            status='draft',
            full_name=order_info.get('full_name', conversation.user.full_name),
            phone=order_info.get('phone', conversation.user.phone),
            email=order_info.get('email', conversation.user.email),
            address=order_info.get('address', conversation.user.address or ''),
            city=order_info.get('city', ''),
            district=order_info.get('district', ''),
            shipping_fee=30000
        )
        
        # Lưu suggested products
        products_data = []
        total = 0
        
        for product_id in product_ids:
            try:
                product = Product.objects.get(id=product_id)
                qty = quantities.get(product_id, 1)
                products_data.append({
                    'product_id': product_id,
                    'name': product.name,
                    'price': float(product.price),
                    'quantity': qty,
                    'size': order_info.get('sizes', {}).get(str(product_id), ''),
                    'subtotal': float(product.price) * qty
                })
                total += float(product.price) * qty
            except Product.DoesNotExist:
                continue
        
        automated_order.set_suggested_products(products_data)
        automated_order.estimated_total = int(total) + 30000
        automated_order.save()
        
        return automated_order
