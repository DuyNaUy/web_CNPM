@echo off
REM Script chuẩn bị deploy dự án TeddyShop cho Windows

echo 🚀 Chuẩn bị deploy TeddyShop...
echo.

REM 1. Kiểm tra Git
if not exist ".git" (
    echo 📦 Khởi tạo Git repository...
    git init
    git add .
    git commit -m "Initial commit - Ready for deployment"
) else (
    echo ✅ Git repository đã tồn tại
)

REM 2. Kiểm tra file .env backend
if not exist "backend\.env" (
    echo ⚠️  Tạo file backend\.env từ .env.example
    copy backend\.env.example backend\.env
    echo 📝 Vui lòng cập nhật thông tin trong backend\.env
)

REM 3. Kiểm tra file .env.local frontend
if not exist "frontend\.env.local" (
    echo ⚠️  Tạo file frontend\.env.local từ .env.local.example
    copy frontend\.env.local.example frontend\.env.local
    echo 📝 Vui lòng cập nhật API URL trong frontend\.env.local
)

echo.
echo ✅ Hoàn tất chuẩn bị!
echo.
echo 📋 Các bước tiếp theo:
echo 1. Cập nhật thông tin trong backend\.env
echo 2. Cập nhật API URL trong frontend\.env.local
echo 3. Push code lên GitHub:
echo    git remote add origin ^<your-repo-url^>
echo    git push -u origin main
echo 4. Deploy backend lên Railway/Render
echo 5. Deploy frontend lên Vercel
echo.
echo 📖 Xem hướng dẫn chi tiết trong DEPLOYMENT.md
echo.
pause
