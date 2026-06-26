from django.db import migrations, models


def ensure_refund_status_column(apps, schema_editor):
    connection = schema_editor.connection
    table_name = 'orders_order'
    column_name = 'refund_status'

    with connection.cursor() as cursor:
        description = connection.introspection.get_table_description(cursor, table_name)

    if any(column.name == column_name for column in description):
        return

    order_model = apps.get_model('orders', 'Order')
    field = models.CharField(
        max_length=30,
        default='none',
        choices=[
            ('none', 'Không hoàn tiền'),
            ('requested', 'Đã yêu cầu hoàn tiền'),
            ('pending_approval', 'Chờ duyệt hoàn tiền'),
            ('refunded', 'Đã hoàn tiền'),
        ],
    )
    field.set_attributes_from_name(column_name)
    schema_editor.add_field(order_model, field)


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0006_remove_refund_status'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(ensure_refund_status_column, migrations.RunPython.noop),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='order',
                    name='refund_status',
                    field=models.CharField(
                        choices=[
                            ('none', 'Không hoàn tiền'),
                            ('requested', 'Đã yêu cầu hoàn tiền'),
                            ('pending_approval', 'Chờ duyệt hoàn tiền'),
                            ('refunded', 'Đã hoàn tiền'),
                        ],
                        default='none',
                        max_length=30,
                    ),
                ),
            ],
        ),
    ]