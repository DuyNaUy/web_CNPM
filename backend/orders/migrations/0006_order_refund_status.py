from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0005_order_momo_order_id_order_momo_request_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='refund_status',
            field=models.CharField(choices=[('none', 'Không hoàn'), ('pending', 'Chờ hoàn tiền'), ('completed', 'Đã hoàn tiền')], default='none', max_length=20),
        ),
    ]
