import hashlib
import hmac
import json
import requests
import uuid
from datetime import datetime
from django.conf import settings


class MoMoPayment:
    """
    Xử lý thanh toán qua MoMo
    Tài liệu: https://developers.momo.vn/
    """
    
    # MoMo Sandbox credentials
    # Bạn cần đăng ký tại https://business.momo.vn/ để lấy thông tin này
    PARTNER_CODE = getattr(settings, 'MOMO_PARTNER_CODE', 'MOMO')
    ACCESS_KEY = getattr(settings, 'MOMO_ACCESS_KEY', 'F8BBA842ECF85')
    SECRET_KEY = getattr(settings, 'MOMO_SECRET_KEY', 'K951B6PE1waDMi640xX08PD3vg6EkVlz')
    ENDPOINT = getattr(settings, 'MOMO_ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/create')
    
    # URLs callback
    REDIRECT_URL = getattr(settings, 'MOMO_REDIRECT_URL', 'http://localhost:3000/customer/payment/result')
    IPN_URL = getattr(settings, 'MOMO_IPN_URL', 'http://localhost:8000/api/orders/momo-callback/')
    
    @classmethod
    def create_payment(cls, order_id, amount, order_info="Thanh toán đơn hàng"):
        """
        Tạo payment request tới MoMo
        
        Args:
            order_id: ID đơn hàng
            amount: Số tiền cần thanh toán (VND)
            order_info: Thông tin đơn hàng
            
        Returns:
            dict: Response từ MoMo bao gồm payUrl để redirect
        """
        request_id = str(uuid.uuid4())
        order_id_str = str(order_id)
        
        # Tạo raw signature
        raw_signature = (
            f"accessKey={cls.ACCESS_KEY}"
            f"&amount={amount}"
            f"&extraData="
            f"&ipnUrl={cls.IPN_URL}"
            f"&orderId={order_id_str}"
            f"&orderInfo={order_info}"
            f"&partnerCode={cls.PARTNER_CODE}"
            f"&redirectUrl={cls.REDIRECT_URL}"
            f"&requestId={request_id}"
            f"&requestType=payWithMethod"
        )
        
        # Tạo signature
        signature = hmac.new(
            cls.SECRET_KEY.encode('utf-8'),
            raw_signature.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Tạo request body
        data = {
            'partnerCode': cls.PARTNER_CODE,
            'partnerName': 'Test',
            'storeId': 'MomoTestStore',
            'requestId': request_id,
            'amount': amount,
            'orderId': order_id_str,
            'orderInfo': order_info,
            'redirectUrl': cls.REDIRECT_URL,
            'ipnUrl': cls.IPN_URL,
            'lang': 'vi',
            'requestType': 'payWithMethod',
            'autoCapture': True,
            'extraData': '',
            'signature': signature
        }
        
        try:
            # Gửi request đến MoMo
            response = requests.post(
                cls.ENDPOINT,
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            result = response.json()
            return result
            
        except Exception as e:
            return {
                'resultCode': -1,
                'message': f'Lỗi kết nối MoMo: {str(e)}'
            }
    
    @classmethod
    def verify_signature(cls, data):
        """
        Xác thực signature từ MoMo callback
        
        Args:
            data: Dictionary chứa dữ liệu từ MoMo
            
        Returns:
            bool: True nếu signature hợp lệ
        """
        # Lấy signature từ data
        received_signature = data.get('signature', '')
        
        # Tạo raw signature để so sánh
        raw_signature = (
            f"accessKey={cls.ACCESS_KEY}"
            f"&amount={data.get('amount', '')}"
            f"&extraData={data.get('extraData', '')}"
            f"&message={data.get('message', '')}"
            f"&orderId={data.get('orderId', '')}"
            f"&orderInfo={data.get('orderInfo', '')}"
            f"&orderType={data.get('orderType', '')}"
            f"&partnerCode={data.get('partnerCode', '')}"
            f"&payType={data.get('payType', '')}"
            f"&requestId={data.get('requestId', '')}"
            f"&responseTime={data.get('responseTime', '')}"
            f"&resultCode={data.get('resultCode', '')}"
            f"&transId={data.get('transId', '')}"
        )
        
        # Tạo signature
        expected_signature = hmac.new(
            cls.SECRET_KEY.encode('utf-8'),
            raw_signature.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return received_signature == expected_signature
    
    @classmethod
    def check_transaction_status(cls, order_id, request_id):
        """
        Kiểm tra trạng thái giao dịch
        
        Args:
            order_id: ID đơn hàng
            request_id: Request ID từ MoMo
            
        Returns:
            dict: Thông tin trạng thái giao dịch
        """
        # Tạo raw signature
        raw_signature = (
            f"accessKey={cls.ACCESS_KEY}"
            f"&orderId={order_id}"
            f"&partnerCode={cls.PARTNER_CODE}"
            f"&requestId={request_id}"
        )
        
        # Tạo signature
        signature = hmac.new(
            cls.SECRET_KEY.encode('utf-8'),
            raw_signature.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Tạo request body
        data = {
            'partnerCode': cls.PARTNER_CODE,
            'requestId': request_id,
            'orderId': str(order_id),
            'signature': signature,
            'lang': 'vi'
        }
        
        try:
            # Endpoint kiểm tra trạng thái
            endpoint = 'https://test-payment.momo.vn/v2/gateway/api/query'
            
            response = requests.post(
                endpoint,
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            result = response.json()
            return result
            
        except Exception as e:
            return {
                'resultCode': -1,
                'message': f'Lỗi kiểm tra trạng thái: {str(e)}'
            }
