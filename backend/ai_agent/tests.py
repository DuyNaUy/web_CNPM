from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import ConversationSession, AIRecommendation, AutomatedOrder
from .services import AIAgentService
from products.models import Product

User = get_user_model()


class AIAgentServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            phone='0123456789'
        )
        self.service = AIAgentService()
        # create a category and product so fallback can return recommendations
        from categories.models import Category
        from products.models import Product
        self.category = Category.objects.create(name='Test')
        self.product = Product.objects.create(
            name='Gấu bông Teddy 30cm',
            category=self.category,
            price=20000,
            stock=10,
            status='active'
        )

    def test_start_conversation(self):
        """Test tạo conversation mới"""
        conversation = self.service.start_conversation(self.user)
        self.assertIsNotNone(conversation.session_id)
        self.assertEqual(conversation.user, self.user)
        self.assertTrue(conversation.is_active)

    def test_chat_fallback(self):
        """Test chat với fallback (no API key)"""
        conversation = self.service.start_conversation(self.user)
        response = self.service.chat(conversation, "Tôi muốn mua gấu bông")
        
        self.assertIn('response', response)
        self.assertIsInstance(response['response'], str)
        self.assertIsInstance(response['recommendations'], list)
        # we expect at least one recommendation returned for our test product
        self.assertTrue(len(response['recommendations']) >= 1, f"got {response['recommendations']} from fallback")
        rec = response['recommendations'][0]
        self.assertIn('product_id', rec)
        self.assertIn('price', rec)
        self.assertIn('image_url', rec)
        self.assertIn('product_name', rec)
        # conversation should have recommendations saved
        self.assertTrue(conversation.recommendations.exists())

        # now try selecting by number
        sel_resp = self.service.chat(conversation, "1")
        # we should get a follow-up response with product details and recommendation list
        self.assertIn('Bạn đã chọn', sel_resp['response'])
        self.assertIsInstance(sel_resp['recommendations'], list)
        # conversation context should record last_selected
        ctx = conversation.get_context()
        self.assertIn('last_selected', ctx)
        self.assertEqual(ctx['last_selected']['product_id'], self.product.id)

        # choose a size (assuming product has no variants, should not add to cart)
        size_resp = self.service.chat(conversation, "30cm")
        # since no variants, cart may not be created yet or remain empty
        ctx = conversation.get_context()
        self.assertEqual(ctx.get('cart', []), [])

        # artificially add a variant then attempt add to cart
        from products.models import ProductVariant
        variant = ProductVariant.objects.create(product=self.product, size='30cm', price=20000, stock=5)
        # select again
        _ = self.service.chat(conversation, "1")
        add_resp = self.service.chat(conversation, "30cm")
        ctx = conversation.get_context()
        self.assertTrue(ctx.get('cart'))
        self.assertEqual(ctx['cart'][0]['product_id'], self.product.id)
        self.assertEqual(ctx['cart'][0]['size'], '30cm')

        # finally try checkout
        checkout = self.service.chat(conversation, "mua")
        self.assertTrue(checkout['should_create_order'])
        self.assertIn('Đơn hàng của bạn', checkout['response'])
        self.assertIn('💳 Vui lòng cho biết địa chỉ giao hàng', checkout['response'])
