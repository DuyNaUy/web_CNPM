# Generated migration to allow anonymous users in AI Agent conversations

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ai_agent', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='conversationsession',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='ai_conversations', to='users.user'),
        ),
        migrations.AlterField(
            model_name='automatedorder',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='users.user'),
        ),
    ]
