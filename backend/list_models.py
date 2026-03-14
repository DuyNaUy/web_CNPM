import os
import django
import sys

# Setup django environment
sys.path.append('d:/TeddyShop/backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.conf import settings
import google.generativeai as genai

try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    print("Available models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error: {e}")
