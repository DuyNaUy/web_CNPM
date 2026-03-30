import os
import json
import uuid
import logging
import re
from collections import defaultdict
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
- Khi gợi ý sản phẩm, nêu rõ lý do phù hợp với tiêu chí khách nêu (đối tượng tặng, dịp tặng, màu, kích thước, ngân sách...)
- Khi khách nêu ngân sách cụ thể (ví dụ 300k), ưu tiên sản phẩm đúng/tối đa trong ngân sách trước, sau đó mới gợi ý thêm 1-2 sản phẩm chênh nhẹ khoảng 10-15%
- Sẵn sàng trả lời câu hỏi về shipping, đổi trả, bảo hành
- Chỉ sử dụng dữ liệu có thật từ danh sách sản phẩm và dữ liệu truy xuất theo thời gian thực
- Không tự tạo thông tin không có trong dữ liệu (giá, tồn kho, khuyến mãi, thông số)
- Nếu thiếu dữ liệu, nói rõ là chưa có thông tin thay vì đoán
- Trình bày dưới dạng văn bản thuần, KHÔNG dùng markdown (không dùng **, __, #, ```)
- Với câu hỏi tổng quan catalog, hãy tóm tắt theo danh mục + khoảng giá trước, sau đó đề xuất 3-5 mẫu tiêu biểu
- Với câu hỏi so sánh, hãy so sánh trực tiếp theo: giá, tồn kho, đánh giá, ưu điểm chính
- Với câu hỏi thông số kỹ thuật/chất liệu/xuất xứ/bảo quản, chỉ trả lời từ dữ liệu chi tiết truy xuất realtime

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
            
            products_list = list(products)
            category_buckets = defaultdict(list)
            prices = []
            in_stock_count = 0

            for product in products_list:
                category_name = product.category.name if product.category else 'Khác'
                category_buckets[category_name].append(product)
                prices.append(int(product.price))
                if product.stock > 0:
                    in_stock_count += 1

            min_price = min(prices) if prices else 0
            max_price = max(prices) if prices else 0

            lines = [
                f"Tổng số sản phẩm active: {len(products_list)}",
                f"Sản phẩm còn hàng: {in_stock_count}",
                f"Khoảng giá toàn shop: {min_price:,}đ - {max_price:,}đ",
                "Phân nhóm catalog theo danh mục:"
            ]

            sorted_categories = sorted(
                category_buckets.items(),
                key=lambda item: len(item[1]),
                reverse=True
            )

            for idx, (category_name, items) in enumerate(sorted_categories[:12], 1):
                item_prices = [int(p.price) for p in items]
                category_min = min(item_prices) if item_prices else 0
                category_max = max(item_prices) if item_prices else 0
                top_seller = sorted(items, key=lambda p: (p.sold_count, p.rating), reverse=True)[0]
                sample_names = ', '.join([p.name for p in items[:3]])
                lines.append(
                    f"{idx}. {category_name}: {len(items)} sản phẩm | Giá {category_min:,}đ-{category_max:,}đ | "
                    f"Bán chạy: {top_seller.name} | Mẫu tiêu biểu: {sample_names}"
                )

            lines.append(
                "Lưu ý: Khi trả lời chi tiết từng câu hỏi, luôn dùng dữ liệu realtime để nêu giá/tồn kho/đánh giá chính xác tại thời điểm hiện tại."
            )
            return '\n'.join(lines)
        except Exception as e:
            logger.warning(f"Error building product catalog: {str(e)}")
            return ""

    def _is_catalog_discovery_query(self, message: str) -> bool:
        """
        Nhận diện câu hỏi dạng khám phá catalog tổng quát.
        """
        text = (message or '').lower().strip()
        discovery_keywords = [
            'co nhung san pham nao', 'có những sản phẩm nào', 'co gi', 'có gì',
            'tat ca san pham', 'tất cả sản phẩm', 'toan bo san pham', 'toàn bộ sản phẩm',
            'danh muc', 'danh mục', 'menu', 'catalog', 'catalogue',
            'goi y chung', 'gợi ý chung', 'tu van tong quan', 'tư vấn tổng quan'
        ]
        return any(keyword in text for keyword in discovery_keywords)

    def _is_specific_product_focus_query(self, message: str, specific_keywords: Optional[List[str]] = None) -> bool:
        """
        Nhận diện câu hỏi tập trung vào một mẫu cụ thể (vd: "gấu bear").
        Khi đó chỉ nên hiển thị sản phẩm đang hỏi, không tự đẩy thêm sản phẩm liên quan.
        """
        text = (message or '').lower().strip()
        if not text:
            return False

        compare_markers = ['so sanh', 'so sánh', 'vs', 'voi', 'với', 'hay', 'giua', 'giữa']
        if any(marker in text for marker in compare_markers):
            return False

        list_markers = [
            'goi y', 'gợi ý', 'danh sach', 'danh sách', 'nhieu mau', 'nhiều mẫu',
            'tu van', 'tư vấn', 'san pham nao', 'sản phẩm nào', 'co gi', 'có gì'
        ]
        if any(marker in text for marker in list_markers):
            return False

        keywords = specific_keywords or self._extract_keywords_from_message(text)
        if not keywords:
            return False

        # Câu ngắn có 1-2 từ khóa đặc thù thường là hỏi đích danh 1 mẫu.
        strong_product_cues = ['bear', 'teddy', 'panda', 'bunny']
        has_named_cue = any(cue in text for cue in strong_product_cues)
        has_question_form = any(marker in text for marker in ['co', 'có', 'khong', 'không', 'xem', 'lay', 'lấy'])

        return (len(keywords) <= 2 and has_question_form) or has_named_cue

    def _safe_json_loads(self, raw_text: str):
        if not raw_text:
            return None
        try:
            return json.loads(raw_text) if isinstance(raw_text, str) else raw_text
        except (json.JSONDecodeError, TypeError):
            return None

    def _format_product_grounding_block(self, product: Product) -> List[str]:
        """
        Chuẩn hóa dữ liệu sản phẩm thành block ngắn gọn để đưa vào prompt runtime.
        """
        category_name = product.category.name if product.category else 'Khác'
        stock_status = 'Còn hàng' if product.stock > 0 else 'Hết hàng'

        min_variant_price = int(product.price)
        max_variant_price = int(product.price)
        variant_summary = 'Không có biến thể'
        if product.variants.exists():
            variant_prices = []
            variant_lines = []
            for variant in product.variants.all():
                variant_price = int(variant.price) if variant.price else int(product.price)
                variant_prices.append(variant_price)
                variant_lines.append(f"{variant.size}: {variant_price:,}đ (stock {variant.stock})")

            if variant_prices:
                min_variant_price = min(variant_prices + [int(product.price)])
                max_variant_price = max(variant_prices + [int(product.price)])
            variant_summary = '; '.join(variant_lines[:3])

        specs = self._safe_json_loads(product.specifications)
        spec_summary = ''
        if isinstance(specs, dict) and specs:
            compact_specs = []
            for key, value in list(specs.items())[:4]:
                compact_specs.append(f"{key}: {value}")
            spec_summary = ' | '.join(compact_specs)

        lines = [
            f"- ID {product.id} | Tên: {product.name}",
            f"  Giá: {int(product.price):,}đ | Khoảng giá biến thể: {min_variant_price:,}đ-{max_variant_price:,}đ",
            f"  Danh mục: {category_name} | Tình trạng: {stock_status} | Tồn kho: {product.stock}",
            f"  Đánh giá: {float(product.rating):.1f}/5 ({product.reviews_count} lượt) | Đã bán: {product.sold_count}",
        ]

        if product.origin:
            lines.append(f"  Xuất xứ: {product.origin}")
        if product.weight:
            lines.append(f"  Trọng lượng: {product.weight}")
        if product.preservation:
            lines.append(f"  Bảo quản: {product.preservation}")
        if product.expiry:
            lines.append(f"  Hạn sử dụng: {product.expiry}")
        if product.certification:
            lines.append(f"  Chứng nhận: {product.certification}")
        if spec_summary:
            lines.append(f"  Thông số chính: {spec_summary}")
        if product.description:
            lines.append(f"  Mô tả ngắn: {product.description[:180]}")
        if product.detail_description:
            lines.append(f"  Mô tả chi tiết: {product.detail_description[:220]}")
        lines.append(f"  Biến thể: {variant_summary}")

        return lines

    def start_conversation(self, user=None) -> ConversationSession:
        """Bắt đầu một phiên hội thoại mới"""
        if user is not None:
            existing_conversation = (
                ConversationSession.objects
                .filter(user=user)
                .order_by('-updated_at')
                .first()
            )
            if existing_conversation:
                return existing_conversation

        # Tạo bản ghi trước để lấy ID, sau đó map thành mã phiên dạng số dễ đọc.
        temp_session_id = f"tmp_{uuid.uuid4().hex[:12]}"
        conversation = ConversationSession.objects.create(
            user=user,
            session_id=temp_session_id
        )
        conversation.session_id = str(conversation.id).zfill(6)
        conversation.save(update_fields=['session_id', 'updated_at'])
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

        runtime_grounding_context = self._build_runtime_grounding_context(user_message)
        
        # Prepare messages from conversation history
        messages = [
            {'role': 'system', 'content': self.system_prompt},
            {'role': 'system', 'content': runtime_grounding_context}
        ]
        
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
            'temperature': 0.2,
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
            runtime_grounding_context = self._build_runtime_grounding_context(user_message)
            
            # Prepare conversation history
            history_text = ""
            ctx = conversation.get_context()
            if 'messages' in ctx:
                for msg in ctx['messages'][-10:]:
                    role = "User" if msg['role'] == "user" else "Assistant"
                    history_text += f"{role}: {msg['content']}\n"
            
            # Prepare the full prompt
            full_prompt = f"""{self.system_prompt}

{runtime_grounding_context}

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

    def _build_runtime_grounding_context(self, user_message: str) -> str:
        """
        Tạo context dữ liệu sản phẩm liên quan theo thời gian thực để giảm hallucination.
        """
        try:
            preferences = self._extract_customer_preferences(user_message)
            preference_summary = self._build_preference_summary(preferences)
            is_discovery_query = self._is_catalog_discovery_query(user_message)
            related_products = self._filter_products_by_intent('', user_message)
            if not related_products and not is_discovery_query:
                return (
                    "DỮ LIỆU TRUY XUẤT REALTIME: Không tìm thấy sản phẩm phù hợp trực tiếp với câu hỏi. "
                    "Hãy trả lời trung thực theo dữ liệu hiện có và đề xuất khách mô tả thêm nhu cầu."
                )

            product_ids = [item['id'] for item in related_products[:10]]
            if is_discovery_query and not product_ids:
                discovery_products = Product.objects.filter(status='active').order_by('-sold_count', '-rating')[:10]
                product_ids = [item.id for item in discovery_products]

            products = Product.objects.filter(id__in=product_ids, status='active').select_related('category').prefetch_related('variants')
            product_map = {p.id: p for p in products}

            all_active_products = Product.objects.filter(status='active').select_related('category')
            all_prices = [int(p.price) for p in all_active_products]
            all_categories = set([
                p.category.name if p.category else 'Khác'
                for p in all_active_products
            ])

            min_price = min(all_prices) if all_prices else 0
            max_price = max(all_prices) if all_prices else 0

            lines = [
                "DỮ LIỆU TRUY XUẤT REALTIME (ưu tiên cao nhất):",
                "- Chỉ trả lời theo các sản phẩm dưới đây nếu câu hỏi liên quan.",
                "- Không bịa thêm thuộc tính không có trong dữ liệu.",
                f"- Tổng catalog active: {all_active_products.count()} sản phẩm | {len(all_categories)} danh mục | "
                f"Khoảng giá: {min_price:,}đ-{max_price:,}đ",
            ]
            if preference_summary:
                lines.append(f"- Tiêu chí khách hàng đang quan tâm: {preference_summary}")

            for item in related_products[:10]:
                product = product_map.get(item['id'])
                if not product:
                    continue

                lines.extend(self._format_product_grounding_block(product))

            if is_discovery_query:
                lines.append(
                    "- Đây là truy vấn khám phá catalog tổng quan: ưu tiên trả lời bằng tóm tắt danh mục + khoảng giá + "
                    "mẫu tiêu biểu trước, sau đó hỏi rõ nhu cầu để lọc sâu."
                )

            return '\n'.join(lines)
        except Exception as e:
            logger.warning(f"Error building runtime grounding context: {str(e)}")
            return (
                "DỮ LIỆU TRUY XUẤT REALTIME: Không thể tải dữ liệu liên quan lúc này. "
                "Hãy trả lời thận trọng, không suy đoán thông tin sản phẩm."
            )

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
            is_price_query = self._is_price_query(user_message)
            price_focus_keywords = self._extract_price_focus_keywords(user_message)
            min_price, max_price = self._parse_budget_from_message(user_message)
            has_budget_signal = min_price is not None or max_price is not None
            is_strict_price_query = is_price_query and not has_budget_signal
            
            # Tìm kiếm sản phẩm
            products_data = []
            intent_products = self._filter_products_by_intent('', user_message)

            if intent_products:
                for item in intent_products[:5]:
                    product = Product.objects.filter(id=item['id'], status='active').first()
                    if not product:
                        continue

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
            elif keywords:
                # Search products by keywords
                search_terms = price_focus_keywords if (is_strict_price_query and price_focus_keywords) else keywords
                products_found = self.search_products_by_keyword(' '.join(search_terms), limit=5)
                products_data = products_found
            elif not is_strict_price_query:
                # Nếu khách chưa mô tả rõ, ưu tiên hiển thị best-sellers để giữ hội thoại hữu ích.
                products_data = self.get_product_recommendations(limit=5)

            # Nếu không tìm được trực tiếp theo intent/keyword, fallback sang best-sellers.
            if not products_data and not is_strict_price_query:
                products_data = self.get_product_recommendations(limit=5)
            
            # Tạo response text
            if products_data:
                message_text = (user_message or '').lower()
                if self._should_show_recommendation_list(message_text):
                    top_names = ', '.join([p['name'] for p in products_data[:3]])
                    ai_response = (
                        "Cảm ơn bạn! Mình đã lọc được một số mẫu phù hợp với nhu cầu của bạn: "
                        f"{top_names}. Bạn muốn xem chi tiết để chọn nhanh mẫu phù hợp nhất không?"
                    )
                else:
                    ai_response = (
                        "Mình đã lọc được vài mẫu khá sát nhu cầu của bạn. "
                        "Nếu bạn muốn, mình sẽ gửi danh sách 3-5 mẫu phù hợp nhất kèm giá và lý do phù hợp."
                    )

                ai_response = self._align_response_with_products(ai_response, products_data, user_message)
            else:
                if is_strict_price_query:
                    ai_response = (
                        "Mình chưa đủ thông tin để báo đúng giá sản phẩm bạn đang hỏi. "
                        "Bạn gửi giúp mình tên sản phẩm cụ thể hoặc mã sản phẩm để mình báo giá chính xác ngay nhé."
                    )
                else:
                    ai_response = (
                        "Mình đang cập nhật dữ liệu sản phẩm theo yêu cầu của bạn. "
                        "Bạn có thể cho mình thêm ngân sách, màu hoặc kích thước để mình lọc chuẩn hơn nhé."
                    )
                
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
            normalized = re.sub(r"[^\w\s]", " ", (message or "").lower(), flags=re.UNICODE)
            words = [w.strip() for w in normalized.split() if w.strip()]

            # Chỉ loại các từ chức năng, giữ lại từ mô tả nhu cầu như "bé", "mềm", "quà"...
            common_words = {
                'la', 'là', 'toi', 'tôi', 'minh', 'mình', 'ban', 'bạn', 'cho',
                'xin', 'nho', 'nhờ', 'giup', 'giúp', 'voi', 'với', 'toi_can',
                'can', 'cần', 'muon', 'muốn', 'tim', 'tìm', 'san', 'sản',
                'pham', 'phẩm', 'co', 'có', 'khong', 'không', 'nao', 'nào',
                'va', 'và', 'hoac', 'hoặc', 'nhung', 'nhưng', 'de', 'để',
                'trong', 'ngoai', 'ngoài', 'gi', 'gì', 'duoc', 'được', 'ah',
                'a', 'ạ', 'nhe', 'nhé', 'nha', 'nhà', 'em', 'anh', 'chi', 'chị'
            }

            keywords: List[str] = []
            seen = set()
            for word in words:
                if len(word) < 2:
                    continue
                if word in common_words:
                    continue
                # Bỏ token thuần số để tránh nhiễu (giá sẽ được parse riêng)
                if re.fullmatch(r"\d+", word):
                    continue
                if word not in seen:
                    seen.add(word)
                    keywords.append(word)

            return keywords[:8]
        except Exception as e:
            logger.error(f"Error extracting keywords: {str(e)}")
            return []

    def _parse_budget_from_message(self, message: str) -> tuple:
        """
        Parse budget constraints từ câu hỏi khách hàng.

        Returns:
            (min_price, max_price) theo đơn vị VND
        """
        text = (message or '').lower()

        def _to_vnd(raw_amount: str, unit: str = '') -> Optional[int]:
            if not raw_amount:
                return None

            value_text = raw_amount.strip().replace(' ', '')
            try:
                # Hỗ trợ dạng 1.5tr / 1,5tr
                if ('.' in value_text or ',' in value_text) and unit in {'tr', 'triệu', 'm'}:
                    value = float(value_text.replace(',', '.'))
                else:
                    value = float(value_text.replace('.', '').replace(',', ''))
            except ValueError:
                return None

            unit = (unit or '').strip()
            if unit in {'k', 'nghin', 'nghìn', 'ngan', 'ngàn'}:
                value *= 1000
            elif unit in {'tr', 'triệu', 'm'}:
                value *= 1000000

            return int(value)

        # Ưu tiên parse khoảng giá: "từ X đến Y"
        range_match = re.search(
            r"tu\s+(\d[\d\.,]*)\s*(k|nghin|nghìn|ngan|ngàn|tr|triệu|m|đ|vnd)?\s+"
            r"(?:den|đến)\s+(\d[\d\.,]*)\s*(k|nghin|nghìn|ngan|ngàn|tr|triệu|m|đ|vnd)?",
            text
        )
        if range_match:
            min_price = _to_vnd(range_match.group(1), range_match.group(2) or '')
            max_price = _to_vnd(range_match.group(3), range_match.group(4) or '')
            if min_price is not None and max_price is not None:
                return (min(min_price, max_price), max(min_price, max_price))

        # Parse tất cả giá trị tiền tệ trong câu
        money_matches = list(re.finditer(
            r"(\d[\d\.,]*)\s*(k|nghin|nghìn|ngan|ngàn|tr|triệu|m|đ|vnd)",
            text
        ))
        if not money_matches:
            return (None, None)

        min_price = None
        max_price = None
        low_keywords = ['duoi', 'dưới', 'toi da', 'tối đa', 'khong qua', 'không quá', '<=', '<']
        high_keywords = ['tren', 'trên', 'tu', 'từ', 'it nhat', 'ít nhất', '>=', '>']

        for match in money_matches:
            price_val = _to_vnd(match.group(1), match.group(2))
            if price_val is None:
                continue

            context_start = max(match.start() - 16, 0)
            context_end = min(match.end() + 8, len(text))
            context = text[context_start:context_end]

            if any(keyword in context for keyword in low_keywords):
                max_price = price_val if max_price is None else min(max_price, price_val)
                continue

            if any(keyword in context for keyword in high_keywords):
                min_price = price_val if min_price is None else max(min_price, price_val)
                continue

            # Mặc định nếu không xác định được ngữ nghĩa, coi là ngân sách trần
            max_price = price_val if max_price is None else min(max_price, price_val)

        return (min_price, max_price)

    def _is_price_query(self, message: str) -> bool:
        """
        Nhận diện câu hỏi đang hỏi giá sản phẩm.
        """
        text = (message or '').lower().strip()
        if not text:
            return False

        price_markers = [
            'gia', 'giá', 'bao nhieu', 'bao nhiêu', 'bn', 'nhiu tien', 'nhiêu tiền',
            'muc gia', 'mức giá', 'price', 'bao tien', 'bao tiền'
        ]
        return any(marker in text for marker in price_markers)

    def _extract_price_focus_keywords(self, message: str) -> List[str]:
        """
        Tách từ khóa tên sản phẩm trong câu hỏi giá, loại bỏ token nhiễu kiểu "giá bao nhiêu".
        """
        keywords = self._extract_keywords_from_message(message)
        noise_words = {
            'gia', 'giá', 'bao', 'nhieu', 'nhiêu', 'bn', 'tien', 'tiền',
            'muc', 'mức', 'price', 'sp', 'san', 'sản', 'pham', 'phẩm',
            'nay', 'này', 'kia', 'đó', 'do', 'co', 'có', 'la', 'là',
            'khong', 'không', 'duoc', 'được', 'khuyen', 'khuyến', 'mai', 'sale'
        }

        focus_keywords = []
        for keyword in keywords:
            if keyword in noise_words:
                continue
            if len(keyword) < 2:
                continue
            focus_keywords.append(keyword)

        return focus_keywords[:6]

    def _build_exact_price_line(self, product: Dict) -> str:
        """
        Dựng một dòng mô tả giá chuẩn theo dữ liệu realtime của sản phẩm.
        """
        product_name = product.get('name', 'Sản phẩm')
        base_price = int(product.get('price', 0) or 0)
        variants = product.get('variants') or []

        if not variants:
            return f"{product_name}: {base_price:,}đ"

        variant_prices = [int(v.get('price', base_price) or base_price) for v in variants]
        min_price = min(variant_prices + [base_price])
        max_price = max(variant_prices + [base_price])

        if min_price == max_price:
            variant_bits = ', '.join([
                f"{v.get('size', 'size')}: {int(v.get('price', base_price) or base_price):,}đ"
                for v in variants[:3]
            ])
            if variant_bits:
                return f"{product_name}: {min_price:,}đ ({variant_bits})"
            return f"{product_name}: {min_price:,}đ"

        return f"{product_name}: {min_price:,}đ - {max_price:,}đ"

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

        response_seed = result['cleaned_response']

        if not products:
            is_price_query = self._is_price_query(user_message or '')
            if is_price_query:
                response_seed = (
                    "Mình chưa tìm thấy đúng sản phẩm bạn đang hỏi giá trong dữ liệu hiện tại. "
                    "Bạn gửi giúp mình tên sản phẩm chính xác hoặc mã sản phẩm để mình báo giá chuẩn ngay nhé."
                )
            else:
                # Nếu AI không trả được sản phẩm cụ thể, hiển thị best-sellers để tránh phản hồi rỗng.
                top_sellers = self.get_product_recommendations(limit=5)
                for item in top_sellers:
                    products.append({
                        'id': item['id'],
                        'name': item['name'],
                        'price': item['price'],
                        'description': item.get('description', ''),
                        'stock': item.get('stock', 0),
                        'image_url': item.get('image_url'),
                        'unit': item.get('unit', ''),
                        'variants': item.get('variants', []),
                        'quantity': 1,
                    })

                if products:
                    response_seed = (
                        "Mình chưa tìm thấy mẫu khớp hoàn toàn theo mô tả hiện tại. "
                        "Mình gửi bạn các sản phẩm bán chạy để tham khảo trước, "
                        "bạn muốn mình lọc tiếp theo tầm giá, màu hay kích thước nào?"
                    )

        products = products[:5]  # Limit to 5 products
        aligned_response = self._align_response_with_products(
            response_seed,
            products,
            user_message
        )

        return aligned_response, products

    def _align_response_with_products(self, original_response: str, products: List[Dict], user_message: str = None) -> str:
        """
        Đồng bộ phần text với đúng danh sách sản phẩm trả về frontend.
        Tránh tình trạng AI nêu tên sản phẩm không trùng với cards hiển thị.
        """
        if not products:
            return self._strip_markdown_formatting(original_response)

        message_text = (user_message or '').lower()
        preferences = self._extract_customer_preferences(message_text)
        preference_summary = self._build_preference_summary(preferences)
        is_specific_focus_query = self._is_specific_product_focus_query(
            message_text,
            preferences.get('specific_keywords', [])
        )
        has_budget = any(k in message_text for k in ['k', 'nghìn', 'nghin', 'triệu', 'tr', 'vnd', 'đ'])
        is_price_query = self._is_price_query(message_text)
        should_show_list = self._should_show_recommendation_list(message_text)

        is_love_gift_intent = any(
            keyword in message_text
            for keyword in [
                'nguoi yeu', 'người yêu', 'ban gai', 'bạn gái', 'ban trai', 'bạn trai',
                'qua tang', 'quà tặng', 'tang', 'tặng', 'valentine'
            ]
        )

        mention_pink = any(
            'hồng' in (product.get('name', '').lower() + ' ' + product.get('description', '').lower())
            or 'hong' in (product.get('name', '').lower() + ' ' + product.get('description', '').lower())
            for product in products[:5]
        )

        voice_style = self._select_voice_style(message_text)

        if is_love_gift_intent:
            intro = self._build_voice_intro(
                voice_style=voice_style,
                intent='love_gift',
                mention_pink=mention_pink,
                has_budget=has_budget
            )
        elif has_budget:
            intro = self._build_voice_intro(
                voice_style=voice_style,
                intent='budget',
                mention_pink=mention_pink,
                has_budget=has_budget
            )
        else:
            intro = self._build_voice_intro(
                voice_style=voice_style,
                intent='general',
                mention_pink=mention_pink,
                has_budget=has_budget
            )

        if is_specific_focus_query and products:
            focus_name = products[0].get('name', 'mẫu bạn đang quan tâm')
            if is_price_query:
                lines = [
                    intro,
                    f"Mình báo giá realtime của {focus_name} như sau:",
                    self._build_exact_price_line(products[0]),
                    "Nếu bạn muốn, mình có thể gợi ý thêm 2-3 mẫu cùng tầm giá để bạn so sánh nhanh."
                ]
                return self._strip_markdown_formatting('\n'.join(lines))

            lines = [
                intro,
                f"Mình đã hiển thị sản phẩm {focus_name} ngay bên dưới để bạn xem nhanh.",
                "Bạn muốn xem thêm mẫu tương tự không?"
            ]
            return self._strip_markdown_formatting('\n'.join(lines))

        if is_price_query and products:
            lines = [intro, "Mình đã kiểm tra giá realtime theo dữ liệu hiện tại:"]
            for idx, product in enumerate(products[:3], 1):
                lines.append(f"{idx}. {self._build_exact_price_line(product)}")
            lines.append("Bạn muốn mình lọc tiếp theo ngân sách hoặc kích thước để chọn nhanh hơn không?")
            return self._strip_markdown_formatting('\n'.join(lines))

        if not should_show_list:
            lines = [
                intro,
                "Mình đã lọc được một số mẫu rất sát nhu cầu của bạn.",
                "Nếu bạn muốn, mình sẽ gửi ngay danh sách 3-5 mẫu phù hợp nhất kèm giá và lý do phù hợp để bạn chọn nhanh."
            ]
            if preference_summary:
                lines.insert(1, f"Tiêu chí mình đang bám theo yêu cầu của bạn: {preference_summary}.")
            return self._strip_markdown_formatting('\n'.join(lines))

        lines = [intro]
        if preference_summary:
            lines.append(f"Mình lọc theo đúng tiêu chí bạn đưa: {preference_summary}.")
        lines.append("Mình đã lọc các mẫu phù hợp nhất:")
        for idx, product in enumerate(products[:3], 1):
            reason = self._build_product_reason(product, message_text, preferences)
            lines.append(
                f"{idx}. {product.get('name', '')} - {int(product.get('price', 0)):,}đ. {reason}"
            )

        lines.append("Bạn thích mình tư vấn sâu theo mẫu to/nhỏ, tầm giá hay người nhận quà để chốt nhanh hơn không?")
        return self._strip_markdown_formatting('\n'.join(lines))

    def _should_show_recommendation_list(self, message_text: str) -> bool:
        """
        Chỉ hiển thị danh sách sản phẩm khi khách hàng thể hiện rõ nhu cầu xem gợi ý.
        """
        explicit_intent_keywords = [
            'goi y', 'gợi ý', 'de xuat', 'đề xuất', 'tu van san pham', 'tư vấn sản phẩm',
            'xem san pham', 'xem mẫu', 'xem mau', 'mau nao', 'mẫu nào', 'list',
            'danh sach', 'danh sách', 'chon giup', 'chọn giúp', 'recommend',
            'chon san pham', 'chọn sản phẩm', 'nen mua', 'nên mua', 'mau phu hop', 'mẫu phù hợp',
            'san pham nao', 'sản phẩm nào', 'co san pham nao', 'có sản phẩm nào',
            'co mau nao', 'có mẫu nào', 'co loai nao', 'có loại nào'
        ]
        if any(keyword in message_text for keyword in explicit_intent_keywords):
            return True

        if self._is_price_query(message_text):
            return True

        # Câu hỏi dạng xin tư vấn chọn sản phẩm theo nhu cầu cụ thể.
        question_patterns = [
            ('co', 'khong'),
            ('có', 'không'),
            ('nao',),
            ('nào',),
        ]
        has_product_context = any(
            k in message_text
            for k in ['san pham', 'sản phẩm', 'mau', 'mẫu', 'gau bong', 'gấu bông']
        )
        has_gift_context = any(
            k in message_text
            for k in ['tang', 'tặng', 'qua', 'quà', 'nguoi yeu', 'người yêu']
        )

        if has_product_context and has_gift_context:
            return True

        return any(all(token in message_text for token in pattern) for pattern in question_patterns)

    def _build_product_reason(self, product: Dict, message_text: str, preferences: Optional[Dict] = None) -> str:
        """
        Tạo lý do ngắn gọn cho từng sản phẩm, bám theo mô tả và ngữ cảnh khách hàng.
        """
        preferences = preferences or self._extract_customer_preferences(message_text)
        description_text = (product.get('description') or '').strip()
        searchable_text = (
            (product.get('name') or '').lower() + ' ' +
            (product.get('description') or '').lower()
        )

        matched_terms = [
            term for term in preferences.get('constraint_terms', [])
            if term in searchable_text
        ]

        if description_text:
            # Lấy câu đầu tiên để giữ phần giải thích ngắn và rõ.
            first_sentence = re.split(r"[.!?]", description_text)[0].strip()
            if len(first_sentence) > 120:
                first_sentence = first_sentence[:117].rstrip() + '...'
        else:
            first_sentence = 'Mẫu này được nhiều khách chọn vì thiết kế đẹp và dễ tặng.'

        if matched_terms:
            return f"Khớp tiêu chí {', '.join(matched_terms[:2])}. {first_sentence}"

        if any(k in message_text for k in ['nguoi yeu', 'người yêu', 'qua tang', 'quà tặng', 'valentine']):
            return f"Phù hợp làm quà tặng, cảm giác ấm áp và dễ tạo thiện cảm. {first_sentence}"

        if any(k in message_text for k in ['be', 'bé', 'tre em', 'trẻ em']):
            return f"Phù hợp cho bé nhờ kiểu dáng đáng yêu, dễ ôm. {first_sentence}"

        if any(k in message_text for k in ['sinh nhat', 'sinh nhật', 'ky niem', 'kỷ niệm']):
            return f"Hợp dịp tặng quà kỷ niệm hoặc sinh nhật. {first_sentence}"

        return first_sentence

    def _extract_customer_preferences(self, message: str) -> Dict:
        """
        Trích xuất các tiêu chí quan trọng từ câu hỏi khách hàng để lọc sản phẩm sát hơn.
        """
        text = (message or '').lower()
        keywords = self._extract_keywords_from_message(text)

        generic_keywords = {
            'gau', 'gấu', 'bong', 'bông', 'gau bong', 'gấu bông',
            'qua', 'quà', 'tang', 'tặng', 'qua tang', 'quà tặng',
            'shop', 'mua', 'tim', 'tìm', 'san pham', 'sản phẩm'
        }

        color_terms = [
            term for term in ['hong', 'hồng', 'trang', 'trắng', 'nau', 'nâu', 'xam', 'xám', 'den', 'đen', 'xanh', 'do', 'đỏ']
            if term in text
        ]
        size_terms = [
            term for term in ['to', 'lon', 'lớn', 'mini', 'nho', 'nhỏ', 'size m', 'size l', 'size xl']
            if term in text
        ]
        material_terms = [
            term for term in ['mem', 'mềm', 'nhung', 'bong min', 'bông mịn', 'om', 'ôm']
            if term in text
        ]
        occasion_terms = [
            term for term in ['sinh nhat', 'sinh nhật', 'valentine', 'ky niem', 'kỷ niệm', 'tot nghiep', 'tốt nghiệp', 'noel']
            if term in text
        ]

        specific_keywords = [k for k in keywords if k not in generic_keywords]
        constraint_terms = list(dict.fromkeys(specific_keywords + color_terms + size_terms + material_terms + occasion_terms))

        return {
            'specific_keywords': specific_keywords,
            'color_terms': color_terms,
            'size_terms': size_terms,
            'material_terms': material_terms,
            'occasion_terms': occasion_terms,
            'gift_for_love': any(k in text for k in ['nguoi yeu', 'người yêu', 'ban gai', 'bạn gái', 'ban trai', 'bạn trai']),
            'gift_for_child': any(k in text for k in ['be', 'bé', 'tre em', 'trẻ em']),
            'constraint_terms': constraint_terms,
        }

    def _build_preference_summary(self, preferences: Dict) -> str:
        """
        Tóm tắt tiêu chí đã hiểu từ khách để phản hồi bám sát yêu cầu.
        """
        summary_parts = []

        if preferences.get('gift_for_love'):
            summary_parts.append('quà tặng người yêu')
        if preferences.get('gift_for_child'):
            summary_parts.append('quà cho bé')
        if preferences.get('occasion_terms'):
            summary_parts.append('dịp ' + ', '.join(preferences['occasion_terms'][:2]))
        if preferences.get('color_terms'):
            summary_parts.append('màu ' + ', '.join(preferences['color_terms'][:2]))
        if preferences.get('size_terms'):
            summary_parts.append('kích thước ' + ', '.join(preferences['size_terms'][:2]))
        if preferences.get('material_terms'):
            summary_parts.append('chất liệu/cảm giác ' + ', '.join(preferences['material_terms'][:2]))

        return '; '.join(summary_parts)

    def _select_voice_style(self, message_text: str) -> str:
        """
        Chọn template giọng văn theo ngữ cảnh khách: dịu dàng, sang trọng, trẻ trung.
        """
        luxury_keywords = {
            'cao cap', 'cao cấp', 'sang trong', 'sang trọng', 'premium', 'luxury',
            'dang cap', 'đẳng cấp', 'vip', 'doi tac', 'đối tác', 'sep', 'sếp'
        }
        youthful_keywords = {
            'tre trung', 'trẻ trung', 'teen', 'cute', 'xinh', 'de thuong',
            'dễ thương', 'nang dong', 'năng động', 'trend', 'hot'
        }

        if any(keyword in message_text for keyword in luxury_keywords):
            return 'sang_trong'
        if any(keyword in message_text for keyword in youthful_keywords):
            return 'tre_trung'
        return 'diu_dang'

    def _build_voice_intro(self, voice_style: str, intent: str, mention_pink: bool, has_budget: bool) -> str:
        """
        Dựng mở đầu tư vấn theo template giọng văn.
        """
        if voice_style == 'sang_trong':
            if intent == 'love_gift':
                if mention_pink:
                    return (
                        "Dạ có ạ, bên mình có nhiều mẫu gấu bông thiết kế đẹp, tông hồng tinh tế và rất phù hợp làm quà tặng người yêu. "
                        "Món quà này vừa tạo cảm giác ấm áp, vừa thể hiện sự trân trọng và quan tâm một cách tinh tế."
                    )
                return (
                    "Dạ có ạ, bên mình có nhiều mẫu gấu bông thiết kế chỉn chu, phù hợp làm quà tặng người yêu trong những dịp đặc biệt. "
                    "Đây là lựa chọn mang ý nghĩa yêu thương, gắn kết và thể hiện sự tinh tế của người tặng."
                )
            if intent == 'budget' and has_budget:
                return (
                    "Dạ có ạ, mình đã lọc các mẫu nổi bật, đảm bảo tính thẩm mỹ và bám sát ngân sách bạn đưa ra "
                    "để tối ưu cả giá trị quà tặng lẫn trải nghiệm nhận quà."
                )
            return (
                "Dạ có ạ, mình đã chọn các mẫu gấu bông có thiết kế đẹp và hoàn thiện tốt, "
                "phù hợp cho nhu cầu quà tặng với cảm giác sang trọng, chỉn chu."
            )

        if voice_style == 'tre_trung':
            if intent == 'love_gift':
                if mention_pink:
                    return (
                        "Dạ có nha, bên mình có nhiều mẫu gấu bông to, xinh, tông hồng cực hợp tặng người yêu, đặc biệt hợp với các bạn nữ. "
                        "Đây là món quà vừa dễ thương vừa truyền được thông điệp quan tâm rất ngọt ngào."
                    )
                return (
                    "Dạ có nha, bên mình có nhiều mẫu gấu bông đẹp và đáng yêu, rất hợp làm quà tặng người yêu. "
                    "Tặng gấu bông là cách bày tỏ tình cảm nhẹ nhàng nhưng rất ấm áp và dễ ghi điểm."
                )
            if intent == 'budget' and has_budget:
                return (
                    "Dạ có nha, mình đã lọc các mẫu hợp nhu cầu và vừa tầm ngân sách của bạn, "
                    "ưu tiên những mẫu dễ tặng, dễ thương và được chọn mua nhiều."
                )
            return (
                "Dạ có nha, mình đã chọn các mẫu gấu bông hợp gu, trẻ trung và dễ tặng, "
                "giúp bạn chọn quà nhanh mà vẫn đủ tinh tế."
            )

        # Mặc định: dịu dàng
        if intent == 'love_gift':
            if mention_pink:
                return (
                    "Dạ có ạ, bên mình có nhiều mẫu gấu bông to, đẹp, tông hồng rất phù hợp để tặng người yêu "
                    "và đang được nhiều khách lựa chọn. "
                    "Một món gấu bông không chỉ dễ thương mà còn gửi gắm sự quan tâm, "
                    "ấm áp và cảm giác luôn có nhau mỗi ngày."
                )
            return (
                "Dạ có ạ, bên mình có nhiều mẫu gấu bông đẹp, form ôm rất phù hợp làm quà tặng người yêu. "
                "Món quà này mang ý nghĩa yêu thương, sự che chở và nhắc nhớ những khoảnh khắc ngọt ngào của hai bạn."
            )
        if intent == 'budget' and has_budget:
            return (
                "Dạ có ạ, mình đã lọc các mẫu phù hợp nhu cầu và bám sát ngân sách bạn đưa ra, "
                "để bạn dễ chọn được món quà vừa ý nghĩa vừa hợp chi phí."
            )
        return (
            "Dạ có ạ, mình đã chọn các mẫu gấu bông phù hợp với nhu cầu bạn đang tìm. "
            "Các mẫu này có thiết kế dễ thương, chất liệu mềm và rất phù hợp để làm quà tặng."
        )

    def _clean_response_text(self, text: str, product_names: List[str]) -> str:
        """
        Xóa bỏ các dòng text mô tả chi tiết sản phẩm
        Giữ lại phần giới thiệu chung
        """
        if not product_names:
            return self._strip_markdown_formatting(text)
        
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

        return self._strip_markdown_formatting(cleaned_text)

    def _strip_markdown_formatting(self, text: str) -> str:
        """
        Loại bỏ markdown để frontend hiển thị văn bản thuần (không còn dấu **, __, #...).
        """
        if text is None:
            return ""

        cleaned = str(text)

        # Ưu tiên bỏ cặp markdown trước, sau đó xóa ký tự thừa còn sót.
        cleaned = re.sub(r"(\*\*|__)(.*?)\1", r"\2", cleaned)
        cleaned = cleaned.replace("**", "").replace("__", "")
        cleaned = re.sub(r"^\s{0,3}#+\s*", "", cleaned, flags=re.MULTILINE)
        cleaned = cleaned.replace("```", "").replace("`", "")

        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        return cleaned.strip()

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
                    'description': product.description or '',
                    'stock': product.stock,
                    'unit': product.unit if hasattr(product, 'unit') else '',
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
        Ưu tiên độ liên quan với câu hỏi, sau đó mới cộng điểm bán chạy
        
        Args:
            ai_response: Response từ AI
            user_message: Câu hỏi của khách hàng
            
        Returns:
            Danh sách sản phẩm đã được lọc (tối đa 5)
        """
        try:
            query_text = (user_message or '').lower().strip()
            keywords = self._extract_keywords_from_message(query_text)
            preferences = self._extract_customer_preferences(query_text)
            is_discovery_query = self._is_catalog_discovery_query(query_text)
            generic_keywords = {
                'gau', 'gấu', 'bong', 'bông', 'gau bong', 'gấu bông',
                'qua', 'quà', 'tang', 'tặng', 'qua tang', 'quà tặng',
                'shop', 'mua', 'tim', 'tìm'
            }
            specific_keywords = [k for k in keywords if k not in generic_keywords]
            is_specific_focus_query = self._is_specific_product_focus_query(query_text, specific_keywords)
            is_price_query = self._is_price_query(query_text)
            price_focus_keywords = self._extract_price_focus_keywords(query_text)
            constraint_terms = preferences.get('constraint_terms', [])
            min_price, max_price = self._parse_budget_from_message(query_text)

            target_budget = None
            if min_price is not None and max_price is not None:
                target_budget = (min_price + max_price) // 2
            elif max_price is not None:
                target_budget = max_price
            elif min_price is not None:
                target_budget = min_price

            budget_delta = None
            if target_budget:
                budget_delta = max(20000, int(target_budget * 0.15))
                budget_delta = min(budget_delta, 150000)

            is_budget_query = target_budget is not None
            is_strict_price_query = is_price_query and not is_budget_query

            candidates = Product.objects.filter(status='active').select_related('category')

            if keywords or constraint_terms:
                keyword_query = Q()
                if is_strict_price_query and price_focus_keywords:
                    keywords_for_query = price_focus_keywords
                else:
                    keywords_for_query = specific_keywords if specific_keywords else keywords
                keywords_for_query = list(dict.fromkeys(keywords_for_query + constraint_terms))
                for keyword in keywords_for_query:
                    keyword_query |= (
                        Q(name__icontains=keyword) |
                        Q(description__icontains=keyword) |
                        Q(detail_description__icontains=keyword) |
                        Q(category__name__icontains=keyword)
                    )
                candidates = candidates.filter(keyword_query).distinct()

            if is_strict_price_query and price_focus_keywords:
                strict_query = Q()
                for keyword in price_focus_keywords:
                    strict_query |= Q(name__icontains=keyword)

                strict_candidates = candidates.filter(strict_query).distinct()
                if strict_candidates.exists():
                    candidates = strict_candidates

            if is_strict_price_query and not price_focus_keywords and not is_specific_focus_query:
                return []

            # Không gợi ý tràn lan khi câu hỏi chỉ chứa từ chung chung và không có ràng buộc giá.
            if (
                keywords and
                not specific_keywords and
                not constraint_terms and
                min_price is None and
                max_price is None and
                not is_discovery_query
            ):
                return []

            candidates_list = list(candidates)
            if not candidates_list and is_discovery_query:
                candidates_list = list(
                    Product.objects.filter(status='active').select_related('category').order_by('-sold_count', '-rating')[:40]
                )
            if not candidates_list:
                return []

            semantic_boost_map = {}
            if user_message and len(query_text) >= 3:
                semantic_results = self.search_products_with_chroma(query_text, top_k=12, score_threshold=0.2)
                semantic_boost_map = {
                    int(item['id']): float(item.get('chroma_similarity_score', 0.0))
                    for item in semantic_results
                    if item.get('id')
                }

            # Ưu tiên vùng giá gần ngân sách để tránh trả sản phẩm quá lệch.
            if target_budget and budget_delta is not None:
                strict_min = max(target_budget - budget_delta, 0)
                strict_max = target_budget + budget_delta

                strict_budget_candidates = [
                    p for p in candidates_list
                    if strict_min <= int(p.price) <= strict_max
                ]

                if strict_budget_candidates:
                    candidates_list = strict_budget_candidates
                else:
                    expanded_delta = max(50000, int(target_budget * 0.35))
                    expanded_max = target_budget + expanded_delta
                    expanded_min = max(target_budget - expanded_delta, 0)
                    expanded_candidates = [
                        p for p in candidates_list
                        if expanded_min <= int(p.price) <= expanded_max
                    ]
                    if expanded_candidates:
                        candidates_list = expanded_candidates

            max_sold = max((p.sold_count for p in candidates_list), default=1) or 1
            products_scored = []

            for product in candidates_list:
                product_price = int(product.price)
                name_text = (product.name or '').lower()
                category_text = (product.category.name if product.category else '').lower()
                desc_text = (product.description or '').lower()
                detail_text = (product.detail_description or '').lower()
                searchable_text = f"{name_text} {category_text} {desc_text} {detail_text}"

                relevance_score = 0.0
                keyword_hits = 0
                specific_hits = 0
                constraint_hits = 0
                for keyword in keywords:
                    if keyword in name_text:
                        relevance_score += 0.45
                        keyword_hits += 1
                        if keyword in specific_keywords:
                            specific_hits += 1
                    elif keyword in category_text:
                        relevance_score += 0.35
                        keyword_hits += 1
                        if keyword in specific_keywords:
                            specific_hits += 1
                    elif keyword in searchable_text:
                        relevance_score += 0.2
                        keyword_hits += 1
                        if keyword in specific_keywords:
                            specific_hits += 1

                for term in constraint_terms:
                    if term in name_text:
                        relevance_score += 0.4
                        constraint_hits += 1
                    elif term in category_text:
                        relevance_score += 0.28
                        constraint_hits += 1
                    elif term in searchable_text:
                        relevance_score += 0.18
                        constraint_hits += 1

                if query_text and len(query_text) > 3 and query_text in searchable_text:
                    relevance_score += 0.35

                if keyword_hits and keywords:
                    relevance_score += min(keyword_hits / max(len(keywords), 1), 1.0) * 0.25

                if specific_keywords and specific_hits:
                    relevance_score += min(specific_hits / max(len(specific_keywords), 1), 1.0) * 0.35

                if is_strict_price_query and price_focus_keywords:
                    focus_hits = 0
                    for focus_kw in price_focus_keywords:
                        if focus_kw in name_text:
                            relevance_score += 0.65
                            focus_hits += 1
                        elif focus_kw in searchable_text:
                            relevance_score += 0.22
                            focus_hits += 1

                    if focus_hits == 0:
                        continue

                if constraint_terms and constraint_hits:
                    relevance_score += min(constraint_hits / max(len(constraint_terms), 1), 1.0) * 0.4

                if product.stock > 0:
                    relevance_score += 0.08

                budget_relation = 'neutral'
                budget_score = 0.0
                price_gap = 10**9

                if target_budget is not None and target_budget > 0:
                    price_gap = abs(product_price - target_budget)

                    if product_price <= target_budget:
                        if budget_delta is not None and product_price >= max(target_budget - budget_delta, 0):
                            budget_relation = 'within_budget'
                            budget_score += 0.45
                        else:
                            budget_relation = 'below_budget'
                            budget_score += 0.2
                    else:
                        if budget_delta is not None and product_price <= target_budget + budget_delta:
                            budget_relation = 'slightly_above_budget'
                            budget_score += 0.32
                        else:
                            budget_relation = 'over_budget'
                            budget_score += 0.05

                    closeness_bonus = max(0.0, 0.18 - ((price_gap / target_budget) * 0.18))
                    budget_score += closeness_bonus

                sales_boost = (product.sold_count / max_sold) * 0.12
                rating_boost = (float(product.rating) / 5.0) * 0.1 if product.rating else 0
                semantic_boost = min(semantic_boost_map.get(product.id, 0.0), 1.0) * 0.28
                total_score = relevance_score + sales_boost + rating_boost + budget_score + semantic_boost

                # Khi câu hỏi có intent rõ (có keyword), lọc theo ngưỡng để tránh sản phẩm lệch chủ đề.
                if keywords and relevance_score < 0.2 and semantic_boost < 0.08:
                    continue

                # Nếu có từ khóa cụ thể, bắt buộc ít nhất một từ khóa cụ thể phải khớp.
                if specific_keywords and specific_hits == 0 and semantic_boost < 0.12:
                    continue

                if constraint_terms and constraint_hits == 0 and target_budget is None and semantic_boost < 0.1:
                    continue

                # Nếu không có từ khóa cụ thể, chỉ cho qua khi có ràng buộc ngân sách rõ.
                if keywords and not specific_keywords and not constraint_terms and target_budget is None and not is_discovery_query:
                    continue

                # Khi có ngân sách, tránh gợi ý sản phẩm vượt quá nhiều nếu không đủ liên quan.
                if target_budget is not None and budget_relation == 'over_budget' and relevance_score < 0.3 and semantic_boost < 0.1:
                    continue

                budget_priority_map = {
                    'within_budget': 4,
                    'slightly_above_budget': 3,
                    'below_budget': 2,
                    'neutral': 1,
                    'over_budget': 0,
                }

                products_scored.append({
                    'id': product.id,
                    'name': product.name,
                    'price': product_price,
                    'description': product.description or '',
                    'stock': product.stock,
                    'sold_count': product.sold_count,
                    'rating': float(product.rating),
                    'similarity': min(relevance_score, 1.0),
                    'total_score': total_score,
                    'semantic_boost': semantic_boost,
                    'budget_relation': budget_relation,
                    'budget_priority': budget_priority_map.get(budget_relation, 1),
                    'price_gap': price_gap
                })

            products_scored.sort(
                key=lambda x: (
                    x.get('budget_priority', 1),
                    x['total_score'],
                    -x.get('price_gap', 10**9),
                    x['sold_count'],
                    x['rating']
                ),
                reverse=True
            )

            if products_scored:
                if is_specific_focus_query:
                    focused_products = [
                        p for p in products_scored
                        if p.get('similarity', 0) >= 0.35 or p.get('semantic_boost', 0) >= 0.12
                    ]
                    if not focused_products:
                        focused_products = products_scored[:1]
                    if is_price_query:
                        return focused_products[:1]
                    return focused_products[:2]

                if is_strict_price_query:
                    return products_scored[:3]

                if target_budget is None:
                    selected = products_scored[:5]
                    if len(selected) < 3:
                        selected_ids = {item['id'] for item in selected}
                        category_ids = list(
                            Product.objects.filter(id__in=selected_ids).values_list('category_id', flat=True)
                        )
                        related_pool = Product.objects.filter(
                            status='active',
                            category_id__in=category_ids
                        ).exclude(id__in=selected_ids).order_by('-sold_count', '-rating')[:8]

                        for related_product in related_pool:
                            if len(selected) >= 5:
                                break
                            selected.append({
                                'id': related_product.id,
                                'name': related_product.name,
                                'price': int(related_product.price),
                                'description': related_product.description or '',
                                'stock': related_product.stock,
                                'sold_count': related_product.sold_count,
                                'rating': float(related_product.rating),
                                'similarity': 0.35,
                                'total_score': 0.35,
                                'semantic_boost': 0.0,
                                'budget_relation': 'neutral',
                                'budget_priority': 1,
                                'price_gap': 10**9,
                            })
                    return selected[:5]

                within_budget = [p for p in products_scored if p.get('budget_relation') == 'within_budget']
                slightly_above = [p for p in products_scored if p.get('budget_relation') == 'slightly_above_budget']
                below_budget = [p for p in products_scored if p.get('budget_relation') == 'below_budget']
                others = [
                    p for p in products_scored
                    if p.get('budget_relation') not in {'within_budget', 'slightly_above_budget', 'below_budget'}
                ]

                selected = []
                selected.extend(within_budget[:3])
                if slightly_above:
                    selected.append(slightly_above[0])

                for pool in [within_budget[3:], slightly_above[1:], below_budget, others]:
                    for item in pool:
                        if len(selected) >= 5:
                            break
                        if any(existing['id'] == item['id'] for existing in selected):
                            continue
                        selected.append(item)
                    if len(selected) >= 5:
                        break

                if len(selected) < 3:
                    selected_ids = {item['id'] for item in selected}
                    category_ids = list(
                        Product.objects.filter(id__in=selected_ids).values_list('category_id', flat=True)
                    )
                    related_pool = Product.objects.filter(
                        status='active',
                        category_id__in=category_ids
                    ).exclude(id__in=selected_ids).order_by('-sold_count', '-rating')[:8]

                    for related_product in related_pool:
                        if len(selected) >= 5:
                            break
                        selected.append({
                            'id': related_product.id,
                            'name': related_product.name,
                            'price': int(related_product.price),
                            'description': related_product.description or '',
                            'stock': related_product.stock,
                            'sold_count': related_product.sold_count,
                            'rating': float(related_product.rating),
                            'similarity': 0.35,
                            'total_score': 0.35,
                            'semantic_boost': 0.0,
                            'budget_relation': 'neutral',
                            'budget_priority': 1,
                            'price_gap': 10**9,
                        })

                return selected[:5]

            return []
            
        except Exception as e:
            logger.error(f"Error filtering products by intent: {str(e)}")
            # Không trả sản phẩm fallback để tránh gợi ý lệch yêu cầu.
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
    
    # ============== CHROMADB INTEGRATION ==============
    
    def search_products_with_chroma(
        self, 
        query: str, 
        top_k: int = 5,
        score_threshold: float = 0.3
    ) -> List[Dict]:
        """
        Tìm kiếm sản phẩm sử dụng ChromaDB (Semantic Search)
        
        ChromaDB sử dụng "embeddings" - vector hóa sản phẩm
        để tìm kiếm dựa trên ý nghĩa (semantic), không chỉ keyword.
        
        Ví dụ:
        - Query: "Gấu bông hồng cho bé"
        - ChromaDB sẽ tìm: Gấu hồng, Gấu hồng cao cấp, v.v.
        - (Không cần query chứa chính xác cái tên)
        
        Args:
            query: Text tìm kiếm (ví dụ: "Gấu bông mềm mại")
            top_k: Số sản phẩm trả về tối đa
            score_threshold: Ngưỡng điểm similarity (0-1)
        
        Returns:
            List[Dict]: Danh sách sản phẩm được xếp hạng
        """
        try:
            from .chroma_service import ChromaDBService
            
            # Khởi tạo ChromaDB service
            chroma_service = ChromaDBService()
            
            # Tìm kiếm sản phẩm tương tự
            similar_products = chroma_service.search_similar_products(
                query=query,
                top_k=top_k,
                score_threshold=score_threshold
            )
            
            # Định dạng kết quả
            result = []
            for item in similar_products:
                product = item['product']
                similarity_score = item['similarity_score']
                
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
                    'variants': variants,
                    'chroma_similarity_score': similarity_score  # ChromaDB score
                })
            
            logger.info(f"🔍 ChromaDB found {len(result)} products for query: {query}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error with ChromaDB search: {str(e)}")
            # Fallback to keyword search
            logger.warning("Falling back to keyword search...")
            return self.search_products_by_keyword(query, limit=top_k)
    
    def create_chroma_embeddings(self, force_refresh: bool = False) -> Dict:
        """
        Khởi tạo ChromaDB embeddings cho tất cả sản phẩm
        
        Gọi hàm này một lần để tạo vector cho sản phẩm.
        Sau đó ChromaDB sẽ lưu lâu dài không cần gọi lại.
        
        Args:
            force_refresh: Nếu True, xóa embeddings cũ và tạo mới
            
        Returns:
            Dict: Status và message
            
        Usage:
            service = AIAgentService()
            result = service.create_chroma_embeddings()
            # Hoặc từ Django management command:
            # python manage.py init_chroma --refresh
        """
        try:
            from .chroma_service import ChromaDBService
            
            chroma_service = ChromaDBService()
            result = chroma_service.add_product_embeddings(force_refresh=force_refresh)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error creating ChromaDB embeddings: {str(e)}")
            return {"status": "error", "message": str(e)}
