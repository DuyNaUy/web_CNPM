from django.db import migrations


def drop_refund_status_column(apps, schema_editor):
    vendor = schema_editor.connection.vendor
    table_name = 'orders_order'
    column_name = 'refund_status'

    if vendor == 'mysql':
        cursor = schema_editor.connection.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s",
            [table_name, column_name]
        )
        exists = cursor.fetchone()[0]
        if exists:
            cursor.execute(f"ALTER TABLE {table_name} DROP COLUMN {column_name}")
        return

    if vendor == 'postgresql':
        cursor = schema_editor.connection.cursor()
        cursor.execute(f"ALTER TABLE {table_name} DROP COLUMN IF EXISTS {column_name}")
        return

    if vendor == 'sqlite':
        # SQLite cannot drop columns easily; skip for dev setups without refund_status.
        return


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0005_order_momo_order_id_order_momo_request_id_and_more'),
    ]

    operations = [
        migrations.RunPython(drop_refund_status_column, migrations.RunPython.noop),
    ]
