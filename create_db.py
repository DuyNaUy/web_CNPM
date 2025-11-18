import mysql.connector

# Kết nối tới MySQL server
try:
    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password=''
    )
    cursor = connection.cursor()
    
    # Tạo database mới
    print("Đang tạo database web_teddy_db...")
    cursor.execute("CREATE DATABASE IF NOT EXISTS web_teddy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    connection.commit()
    print("✅ Database web_teddy_db đã tạo thành công!")
    
    cursor.close()
    connection.close()
except mysql.connector.Error as err:
    if err.errno == 2003:
        print("❌ Lỗi: Không thể kết nối tới MySQL server. Hãy chắc chắn MySQL service đang chạy.")
    else:
        print(f"❌ Lỗi MySQL: {err}")
except Exception as e:
    print(f"❌ Lỗi: {e}")
