import mysql.connector

# Kết nối tới MySQL server
try:
    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password=''
    )
    cursor = connection.cursor()
    
    print("🔄 Bắt đầu sao chép dữ liệu từ food_store_db sang web_teddy_db...\n")
    
    # Lấy danh sách bảng
    cursor.execute("USE food_store_db")
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    for table in tables:
        table_name = table[0]
        
        # Lấy dữ liệu từ bảng trong database cũ
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        if rows:
            # Lấy tên các cột
            cursor.execute(f"DESCRIBE {table_name}")
            columns = cursor.fetchall()
            col_names = [col[0] for col in columns]
            
            # Chèn dữ liệu vào database mới
            for row in rows:
                placeholders = ', '.join(['%s'] * len(col_names))
                col_list = ', '.join(col_names)
                query = f"INSERT INTO web_teddy_db.{table_name} ({col_list}) VALUES ({placeholders})"
                
                try:
                    cursor.execute(query, row)
                except mysql.connector.Error as err:
                    print(f"⚠️  Lỗi khi chèn vào {table_name}: {err}")
            
            connection.commit()
            print(f"✅ {table_name}: {len(rows)} dòng")
        else:
            print(f"⏭️  {table_name}: Trống")
    
    print("\n✅ Sao chép dữ liệu thành công!")
    
    cursor.close()
    connection.close()
except mysql.connector.Error as err:
    if err.errno == 2003:
        print("❌ Lỗi: Không thể kết nối tới MySQL server")
    else:
        print(f"❌ Lỗi MySQL: {err}")
except Exception as e:
    print(f"❌ Lỗi: {e}")
