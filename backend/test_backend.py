import requests

url = "http://localhost:8000/api/ai/conversations/session_test_123/send_message/"
data = {"message": "hello"}

try:
    response = requests.post(url, json=data)
    print("Status Code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
