@echo off
REM Quick Start Script - AI Agent Setup (Windows)
REM Run: setup.bat

echo.
echo ==========================================
echo AI Agent Setup - TeddyShop
echo ==========================================
echo.

REM Step 1: Check Python
echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found!
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo OK - %PYTHON_VERSION%
echo.

REM Step 2: Install backend dependencies
echo [2/5] Installing backend dependencies...
cd backend
pip install -q -r requirements.txt
echo OK - Dependencies installed
echo.

REM Step 3: Run migrations
echo [3/5] Running database migrations...
python manage.py migrate
echo OK - Migrations completed
echo.

REM Step 4: Superuser
echo [4/5] Creating superuser...
echo Run: python manage.py createsuperuser
echo.

REM Step 5: Frontend
echo [5/5] Frontend setup...
cd ..\frontend
where npm >nul 2>&1
if errorlevel 1 (
    echo Warning: npm not found, skipping frontend setup
) else (
    npm install
    echo OK - Frontend dependencies installed
)
echo.

echo ==========================================
echo Setup completed!
echo ==========================================
echo.
echo Next steps:
echo 1. Backend:   cd backend ^&^& python manage.py runserver
echo 2. Frontend:  cd frontend ^&^& npm run dev
echo 3. Go to:     http://localhost:3000/customer/ai-agent
echo.
echo Documentation:
echo   - AI_AGENT_GUIDE.md
echo   - SETUP_AI_AGENT.md
echo   - AI_AGENT_SUMMARY.md
echo.
pause
