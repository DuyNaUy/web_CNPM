import mysql.connector

# Kết nối tới MySQL server để kiểm tra database cũ
try:
    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password=''
    )
    cursor = connection.cursor()
    
    # Kiểm tra database cũ có tồn tại không
    cursor.execute("SHOW DATABASES LIKE 'food_store_db'")
    if cursor.fetchone():
        print("✅ Database food_store_db tồn tại")
        
        # Dump data từ database cũ sang database mới
        print("\n📊 Đang sao chép dữ liệu từ food_store_db sang web_teddy_db...")
        
        # Lấy danh sách tất cả các bảng
        cursor.execute("USE food_store_db")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        if tables:
            print(f"\n📋 Tìm thấy {len(tables)} bảng:")
            for table in tables:
                table_name = table[0]
                print(f"  - {table_name}")
        else:
            print("⚠️  Database food_store_db không có bảng nào")
    else:
        print("❌ Database food_store_db không tồn tại")
    
    cursor.close()
    connection.close()
except mysql.connector.Error as err:
    if err.errno == 2003:
        print("❌ Lỗi: Không thể kết nối tới MySQL server")
    else:
        print(f"❌ Lỗi MySQL: {err}")
except Exception as e:
    print(f"❌ Lỗi: {e}")
