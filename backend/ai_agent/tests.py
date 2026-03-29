from django.contrib.auth import get_user_model
from django.test import TestCase

from categories.models import Category
from products.models import Product, ProductVariant

from .services import AIAgentService

User = get_user_model()


class AIAgentServiceScenarioTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            phone='0123456789'
        )

        self.category_love = Category.objects.create(name='Gau Tang Nguoi Yeu')
        self.category_kids = Category.objects.create(name='Gau Cho Be')

        self.product_love_best = Product.objects.create(
            name='Gau Hong Trai Tim Cao Cap',
            category=self.category_love,
            price=290000,
            stock=50,
            sold_count=220,
            rating=4.8,
            reviews_count=140,
            description='Phu hop tang nguoi yeu, chat lieu mem va om rat da.',
            detail_description='Mau hong trai tim, hop dip valentine va ky niem.',
            origin='Viet Nam',
            status='active'
        )

        self.product_love_mid = Product.objects.create(
            name='Gau Teddy Tinh Yeu 60cm',
            category=self.category_love,
            price=320000,
            stock=35,
            sold_count=180,
            rating=4.7,
            reviews_count=90,
            description='Mau gau om de thuong, phu hop qua tang nguoi yeu.',
            detail_description='Size 60cm, de trung bay va om ngu.',
            status='active'
        )

        self.product_love_high = Product.objects.create(
            name='Gau Brown Premium 80cm',
            category=self.category_love,
            price=520000,
            stock=20,
            sold_count=130,
            rating=4.6,
            reviews_count=70,
            description='Phien ban premium cho qua tang dac biet.',
            detail_description='Kich thuoc lon, chat lieu nhung min.',
            status='active'
        )

        self.product_compare_1 = Product.objects.create(
            name='Gau Panda 50cm',
            category=self.category_kids,
            price=260000,
            stock=45,
            sold_count=160,
            rating=4.5,
            reviews_count=88,
            description='Phu hop cho be va nguoi yeu, mau den trang.',
            detail_description='Dang yeu, de ve sinh.',
            status='active'
        )

        self.product_compare_2 = Product.objects.create(
            name='Tho Bunny 55cm',
            category=self.category_kids,
            price=250000,
            stock=40,
            sold_count=145,
            rating=4.4,
            reviews_count=60,
            description='Tho bong de thuong, phu hop tang dip sinh nhat.',
            detail_description='Mau pastel nhe nhang.',
            status='active'
        )

        self.product_low_price = Product.objects.create(
            name='Gau Mini Keychain 25cm',
            category=self.category_love,
            price=150000,
            stock=100,
            sold_count=95,
            rating=4.3,
            reviews_count=40,
            description='Mau mini nho gon, gia mem.',
            detail_description='Phu hop ngan sach thap.',
            status='active'
        )

        self.product_bear_focus = Product.objects.create(
            name='Gau Bear Brown 70cm',
            category=self.category_love,
            price=350000,
            stock=22,
            sold_count=120,
            rating=4.6,
            reviews_count=55,
            description='Mau gau bear mau nau, form om gon dep.',
            detail_description='Phu hop nguoi thich dong gau bear co dien.',
            status='active'
        )
        ProductVariant.objects.create(
            product=self.product_bear_focus,
            size='60cm',
            price=390000,
            stock=10,
        )

        self.service = AIAgentService()

        # Disable networked AI providers to keep unit tests deterministic.
        self.service.gemini_api_key = ''
        self.service.openai_api_key = ''
        self.service.search_products_with_chroma = lambda *args, **kwargs: []

    def test_start_conversation_creates_numeric_session(self):
        conversation = self.service.start_conversation(self.user)
        self.assertTrue(conversation.session_id.isdigit())
        self.assertEqual(conversation.user, self.user)
        self.assertTrue(conversation.is_active)

    def test_catalog_overview_question_returns_discovery_grounding(self):
        message = 'Shop co nhung san pham nao de tang nguoi yeu?'
        grounding = self.service._build_runtime_grounding_context(message)

        self.assertIn('Tổng catalog active', grounding)
        self.assertIn('truy vấn khám phá catalog tổng quan', grounding)
        self.assertIn('Gau Hong Trai Tim Cao Cap', grounding)

    def test_budget_question_prioritizes_budget_fit_and_related(self):
        query = 'Toi can qua tang nguoi yeu tam 300k, goi y giup minh'
        products = self.service._filter_products_by_intent('', query)

        self.assertGreaterEqual(len(products), 3)
        self.assertLessEqual(len(products), 5)

        # At least one option should be within or near stated budget.
        self.assertTrue(any(item['price'] <= 320000 for item in products))

        # Best-seller near budget should appear.
        self.assertIn(self.product_love_best.id, [item['id'] for item in products])

    def test_compare_two_products_query_brings_both_targets(self):
        query = 'So sanh Gau Panda 50cm va Tho Bunny 55cm giup minh'
        products = self.service._filter_products_by_intent('', query)
        returned_ids = [item['id'] for item in products]

        self.assertIn(self.product_compare_1.id, returned_ids)
        self.assertIn(self.product_compare_2.id, returned_ids)

    def test_love_gift_question_returns_best_seller_suggestions(self):
        conversation = self.service.start_conversation(self.user)
        response = self.service.chat(conversation, 'Ban co san pham nao tang nguoi yeu khong?')

        self.assertIn('ai_response', response)
        self.assertIn('products', response)
        self.assertIsInstance(response['products'], list)
        self.assertGreaterEqual(len(response['products']), 3)

        returned_ids = [item['id'] for item in response['products']]
        self.assertIn(self.product_love_best.id, returned_ids)

        # Response text should be recommendation-oriented.
        self.assertTrue(
            ('phù hợp' in response['ai_response'].lower()) or
            ('goi y' in response['ai_response'].lower())
        )

    def test_multiple_customer_questions_do_not_break_and_keep_relevance(self):
        scenarios = [
            'Shop co gi de tang nguoi yeu dip ky niem?',
            'Muc duoi 250k co mau nao dang yeu?',
            'Nen mua Gau Panda 50cm hay Tho Bunny 55cm?',
            'Tu 250k den 350k goi y 3 mau ban chay giup minh',
            'Can qua cho be gai mem mai de om ngu',
        ]

        for question in scenarios:
            with self.subTest(question=question):
                conversation = self.service.start_conversation(self.user)
                response = self.service.chat(conversation, question)
                self.assertIn('ai_response', response)
                self.assertIn('products', response)
                self.assertIsInstance(response['ai_response'], str)
                self.assertIsInstance(response['products'], list)
                self.assertLessEqual(len(response['products']), 5)

                if any(token in question.lower() for token in ['goi y', 'co gi', 'mau nao', 'nen mua', 'san pham']):
                    self.assertGreater(len(response['products']), 0)

    def test_specific_product_query_shows_only_focus_product_and_asks_view_more(self):
        conversation = self.service.start_conversation(self.user)
        response = self.service.chat(conversation, 'Ban co san pham gau bear khong?')

        self.assertIn('products', response)
        self.assertGreaterEqual(len(response['products']), 1)
        self.assertLessEqual(len(response['products']), 2)

        returned_names = [item['name'].lower() for item in response['products']]
        self.assertTrue(any('bear' in name for name in returned_names))

        response_text = response.get('ai_response', '').lower()
        self.assertTrue(
            ('ban muon xem them' in response_text) or
            ('bạn muốn xem thêm' in response_text)
        )

    def test_no_match_query_falls_back_to_best_sellers_instead_of_apology(self):
        conversation = self.service.start_conversation(self.user)
        response = self.service.chat(conversation, 'Toi can mau gau ngoai hanh tinh xyz abc')

        self.assertIn('products', response)
        self.assertGreaterEqual(len(response['products']), 1)

        returned_ids = [item['id'] for item in response['products']]
        self.assertIn(self.product_love_best.id, returned_ids)

        response_text = response.get('ai_response', '').lower()
        self.assertNotIn('xin lỗi, tôi không tìm thấy sản phẩm phù hợp', response_text)

    def test_price_query_returns_exact_price_in_response(self):
        conversation = self.service.start_conversation(self.user)
        response = self.service.chat(conversation, 'Gia Gau Panda 50cm bao nhieu?')

        self.assertIn('products', response)
        self.assertGreaterEqual(len(response['products']), 1)
        self.assertEqual(response['products'][0]['id'], self.product_compare_1.id)

        response_text = response.get('ai_response', '')
        self.assertIn('260,000đ', response_text)
        self.assertIn('Gau Panda 50cm', response_text)

    def test_price_query_for_specific_product_returns_single_focus_product(self):
        products = self.service._filter_products_by_intent('', 'Gia Gau Bear Brown 70cm bao nhieu?')

        self.assertGreaterEqual(len(products), 1)
        self.assertEqual(products[0]['id'], self.product_bear_focus.id)
        self.assertLessEqual(len(products), 1)

    def test_generic_price_query_without_product_does_not_recommend_random_items(self):
        conversation = self.service.start_conversation(self.user)
        response = self.service.chat(conversation, 'Gia bao nhieu vay?')

        self.assertIn('products', response)
        self.assertEqual(len(response['products']), 0)
        self.assertIn('tên sản phẩm', response.get('ai_response', '').lower())

    def test_budget_query_with_gia_300k_still_returns_relevant_products(self):
        conversation = self.service.start_conversation(self.user)
        response = self.service.chat(conversation, 'Toi muon mua gau gia 300k')

        self.assertIn('products', response)
        self.assertGreaterEqual(len(response['products']), 1)
        self.assertTrue(any(item['price'] <= 350000 for item in response['products']))
