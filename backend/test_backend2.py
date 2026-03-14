import requests

try:
    url_start = "http://localhost:8000/api/ai/conversations/start_conversation/"
    res_start = requests.post(url_start)
    print("Start status:", res_start.status_code)
    print("Start content:", res_start.text)
    
    if res_start.status_code == 200:
        session_id = res_start.json().get("session_id")
        url_send = f"http://localhost:8000/api/ai/conversations/{session_id}/send_message/"
        res_send = requests.post(url_send, json={"message": "hello"})
        print("Send status:", res_send.status_code)
        print("Send content:", res_send.text)
except Exception as e:
    print("Error:", e)
