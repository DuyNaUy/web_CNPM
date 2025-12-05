import requests
import json

# Test stats API endpoint
url = "http://127.0.0.1:8000/api/orders/stats/"

# Bạn cần thay thế token này bằng token admin thật
headers = {
    "Authorization": "Bearer YOUR_ADMIN_TOKEN_HERE"
}

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"\nResponse Data:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {str(e)}")
