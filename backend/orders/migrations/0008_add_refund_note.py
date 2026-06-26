from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0007_restore_refund_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='refund_note',
            field=models.TextField(blank=True, null=True),
        ),
    ]