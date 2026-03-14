import os
import json
import uuid
from typing import List, Dict, Optional
import requests
import re
import google.generativeai as genai
from django.conf import settings
from products.models import Product
from .models import ConversationSession, AIRecommendation, AutomatedOrder


class AIAgentService:
    """Service để tương tác với AI Agent (tư vấn bán hàng)"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'OPENAI_API_KEY', '') or os.getenv('OPENAI_API_KEY', '')
        self.gemini_api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            
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
        """Call Gemini API and parse special JSON blocks for multi-item checkouts"""
        model = genai.GenerativeModel('models/gemini-2.5-flash')
            
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
        
        response = model.generate_content(prompt)
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
        
        # Optionally populate recommendations from cart so the UI can show them nicely
        if should_create_order and cart:
             recommendations = []
             for item in cart:
                 try:
                     prod = Product.objects.get(id=item['product_id'])
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


    def _full_url(self, path: str) -> str:
        """Helper: nếu đường dẫn tương đối, thêm tiền tố BASE_URL hoặc localhost"""
        if not path:
            return ''
        if path.startswith('http'):
            return path
        base = getattr(settings, 'BASE_URL', '') or 'http://localhost:8000'
        return base.rstrip('/') + path

    def _extract_recommendations(self, ai_response: str) -> List[Dict]:
        """Extract recommendations từ AI response"""
        # Đây là simple version - có thể mở rộng để parse JSON từ AI
        recommendations = []
        return recommendations

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
