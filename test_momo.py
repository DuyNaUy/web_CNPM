"""
Script test thanh toán MoMo
Chạy file này để test tích hợp MoMo
"""
import sys
import os

# Thêm đường dẫn backend vào Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from orders.payment_utils import MoMoPayment

def test_create_payment():
    """Test tạo payment URL"""
    print("=== Test tạo payment URL với MoMo ===\n")
    
    # Test data
    order_id = 999  # Test order ID
    amount = 100000  # 100,000 VND
    order_info = "Test thanh toan don hang"
    
    print(f"Order ID: {order_id}")
    print(f"Amount: {amount:,} VND")
    print(f"Order Info: {order_info}\n")
    
    # Tạo payment
    result = MoMoPayment.create_payment(
        order_id=order_id,
        amount=amount,
        order_info=order_info
    )
    
    print("=== Kết quả từ MoMo ===")
    print(f"Result Code: {result.get('resultCode')}")
    print(f"Message: {result.get('message')}")
    
    if result.get('resultCode') == 0:
        print(f"\n✅ Tạo payment thành công!")
        print(f"\nPay URL: {result.get('payUrl')}")
        print(f"Deeplink: {result.get('deeplink')}")
        print(f"QR Code URL: {result.get('qrCodeUrl')}")
        print(f"\nMở URL trên để thanh toán:")
        print(result.get('payUrl'))
    else:
        print(f"\n❌ Lỗi: {result.get('message')}")

def test_verify_signature():
    """Test xác thực signature"""
    print("\n=== Test xác thực signature ===\n")
    
    # Sample callback data từ MoMo
    sample_data = {
        'partnerCode': 'MOMO',
        'orderId': '123',
        'requestId': 'test-request-id',
        'amount': 100000,
        'orderInfo': 'Test',
        'orderType': 'momo_wallet',
        'transId': '123456789',
        'resultCode': 0,
        'message': 'Success',
        'payType': 'qr',
        'responseTime': '2024-01-01 00:00:00',
        'extraData': '',
        'signature': 'test-signature'
    }
    
    result = MoMoPayment.verify_signature(sample_data)
    
    if result:
        print("✅ Signature hợp lệ")
    else:
        print("❌ Signature không hợp lệ")
        print("(Đây là kết quả mong đợi vì dùng test data)")

if __name__ == '__main__':
    print("\n" + "="*60)
    print("SCRIPT TEST THANH TOÁN MOMO")
    print("="*60 + "\n")
    
    try:
        # Test tạo payment
        test_create_payment()
        
        # Test verify signature
        test_verify_signature()
        
        print("\n" + "="*60)
        print("✅ Test hoàn tất!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Lỗi: {str(e)}")
        import traceback
        traceback.print_exc()
