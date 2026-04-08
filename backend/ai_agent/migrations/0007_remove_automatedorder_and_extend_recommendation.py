from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_agent', '0006_conversationmessage_and_backfill'),
    ]

    operations = [
        migrations.AddField(
            model_name='airecommendation',
            name='converted_at',
            field=models.DateTimeField(blank=True, help_text='Thời điểm đề xuất được chuyển thành đơn hàng thật', null=True),
        ),
        migrations.AddField(
            model_name='airecommendation',
            name='created_order_code',
            field=models.CharField(blank=True, help_text='Mã đơn hàng thật được tạo từ đề xuất', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='airecommendation',
            name='is_selected_for_order',
            field=models.BooleanField(default=False, help_text='Đánh dấu đề xuất được dùng để tạo đơn hàng'),
        ),
        migrations.DeleteModel(
            name='AutomatedOrder',
        ),
    ]
