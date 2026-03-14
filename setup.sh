#!/bin/bash
# Quick Start Script - AI Agent Setup
# Copy file này thành setup.sh, chạy: bash setup.sh

set -e

echo "=========================================="
echo "AI Agent Setup - TeddyShop"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if Python is installed
echo -e "${YELLOW}[1/5]${NC} Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python found: $(python3 --version)${NC}"
echo ""

# Step 2: Install backend dependencies
echo -e "${YELLOW}[2/5]${NC} Installing backend dependencies..."
cd backend
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Run migrations
echo -e "${YELLOW}[3/5]${NC} Running database migrations..."
python manage.py migrate
echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

# Step 4: Create superuser (optional)
echo -e "${YELLOW}[4/5]${NC} Creating superuser..."
echo "Run: python manage.py createsuperuser"
echo -e "${YELLOW}You can do this manually or skip${NC}"
echo ""

# Step 5: Frontend setup
echo -e "${YELLOW}[5/5]${NC} Frontend setup..."
cd ../frontend
if command -v npm &> /dev/null; then
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}npm not found, skipping frontend setup${NC}"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}✓ Setup completed!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Backend:   cd backend && python manage.py runserver"
echo "2. Frontend:  cd frontend && npm run dev"
echo "3. Go to:     http://localhost:3000/customer/ai-agent"
echo ""
echo "Documentation:"
echo "  - AI_AGENT_GUIDE.md"
echo "  - SETUP_AI_AGENT.md"
echo "  - AI_AGENT_SUMMARY.md"
echo ""
