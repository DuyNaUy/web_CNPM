import mysql.connector

try:
    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password=''
    )
    cursor = connection.cursor()
    
    print("🔄 Đang xóa database cũ food_store_db...")
    cursor.execute("DROP DATABASE IF EXISTS food_store_db")
    connection.commit()
    print("✅ Database food_store_db đã bị xóa thành công!")
    
    # Kiểm tra database mới còn tồn tại không
    cursor.execute("SHOW DATABASES LIKE 'web_teddy_db'")
    if cursor.fetchone():
        print("✅ Database web_teddy_db vẫn còn và đầy đủ dữ liệu")
    
    cursor.close()
    connection.close()
except mysql.connector.Error as err:
    print(f"❌ Lỗi MySQL: {err}")
except Exception as e:
    print(f"❌ Lỗi: {e}")
