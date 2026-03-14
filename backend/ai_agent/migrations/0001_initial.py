# Generated migration for ai_agent app

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0002_alter_user_role'),
        ('products', '0005_alter_product_category'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConversationSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_id', models.CharField(max_length=100, unique=True)),
                ('title', models.CharField(blank=True, default='Tư vấn bán hàng', max_length=255)),
                ('context', models.TextField(blank=True, help_text='JSON context for conversation history')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ai_conversations', to='users.user')),
            ],
            options={
                'verbose_name': 'Phiên hội thoại AI',
                'verbose_name_plural': 'Phiên hội thoại AI',
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='AutomatedOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('draft', 'Nháp'), ('confirmed', 'Đã xác nhận'), ('created', 'Tạo đơn hàng'), ('cancelled', 'Đã hủy')], default='draft', max_length=20)),
                ('suggested_products', models.TextField(help_text='JSON array of suggested products')),
                ('ai_notes', models.TextField(blank=True, help_text='Ghi chú từ AI về đơn hàng')),
                ('full_name', models.CharField(blank=True, max_length=255)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('address', models.TextField(blank=True)),
                ('city', models.CharField(blank=True, max_length=100)),
                ('district', models.CharField(blank=True, max_length=100)),
                ('estimated_total', models.DecimalField(decimal_places=0, default=0, max_digits=15)),
                ('created_order_id', models.CharField(blank=True, max_length=50, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('conversation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='automated_orders', to='ai_agent.conversationsession')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.user')),
            ],
            options={
                'verbose_name': 'Đơn hàng tự động AI',
                'verbose_name_plural': 'Đơn hàng tự động AI',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='AIRecommendation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.TextField(help_text='Lý do AI đề xuất sản phẩm này')),
                ('confidence_score', models.FloatField(default=0.5, help_text='Độ tin cậy của đề xuất (0-1)')),
                ('quantity', models.PositiveIntegerField(default=1, help_text='Số lượng được đề xuất')),
                ('is_accepted', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('conversation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='recommendations', to='ai_agent.conversationsession')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='products.product')),
            ],
            options={
                'verbose_name': 'Đề xuất sản phẩm AI',
                'verbose_name_plural': 'Đề xuất sản phẩm AI',
                'ordering': ['-created_at'],
            },
        ),
    ]
