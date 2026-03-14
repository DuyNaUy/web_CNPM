import os
import django
import sys

# Setup django environment
sys.path.append('d:/TeddyShop/backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.conf import settings
import google.generativeai as genai

print(f"DEBUG: settings.GEMINI_API_KEY = {settings.GEMINI_API_KEY[:10]}...")

try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('models/gemini-2.5-flash')
    response = model.generate_content("Hello")
    print(f"DEBUG: Gemini Response: {response.text}")
except Exception as e:
    print(f"DEBUG: Gemini Error: {e}")
