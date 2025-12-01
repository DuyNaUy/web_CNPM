#!/bin/bash

# Script chuẩn bị deploy dự án TeddyShop

echo "🚀 Chuẩn bị deploy TeddyShop..."

# 1. Kiểm tra Git
if [ ! -d ".git" ]; then
    echo "📦 Khởi tạo Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Ready for deployment"
else
    echo "✅ Git repository đã tồn tại"
fi

# 2. Kiểm tra file .env backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Tạo file backend/.env từ .env.example"
    cp backend/.env.example backend/.env
    echo "📝 Vui lòng cập nhật thông tin trong backend/.env"
fi

# 3. Kiểm tra file .env.local frontend
if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Tạo file frontend/.env.local từ .env.local.example"
    cp frontend/.env.local.example frontend/.env.local
    echo "📝 Vui lòng cập nhật API URL trong frontend/.env.local"
fi

echo ""
echo "✅ Hoàn tất chuẩn bị!"
echo ""
echo "📋 Các bước tiếp theo:"
echo "1. Cập nhật thông tin trong backend/.env"
echo "2. Cập nhật API URL trong frontend/.env.local"
echo "3. Push code lên GitHub:"
echo "   git remote add origin <your-repo-url>"
echo "   git push -u origin main"
echo "4. Deploy backend lên Railway/Render"
echo "5. Deploy frontend lên Vercel"
echo ""
echo "📖 Xem hướng dẫn chi tiết trong DEPLOYMENT.md"
