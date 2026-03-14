# Quick Commands - AI Agent Setup

## 🚀 One-Line Setup (Recommended)

### Windows:
```batch
setup.bat
```

### Linux/Mac:
```bash
bash setup.sh
```

---

## Manual Setup Commands

### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create migrations (optional, already included)
python manage.py makemigrations ai_agent

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver 8000
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## Verification Commands

```bash
# Check if ai_agent migrations were applied
cd backend
python manage.py showmigrations ai_agent

# Check if tables created
python manage.py shell
>>> from ai_agent.models import ConversationSession
>>> ConversationSession.objects.all()

# Check API is working
curl -X GET http://localhost:8000/api/ai/conversations/
# Should return 401 Unauthorized (which is correct, need token)
```

---

## Testing Commands

```bash
# Run ai_agent tests
cd backend
python manage.py test ai_agent

# Check syntax
python -m py_compile ai_agent/*.py

# Start interactive shell
python manage.py shell
>>> from ai_agent.services import AIAgentService
>>> service = AIAgentService()
>>> print(service.api_key)
```

---

## Environment Setup

### Create .env file (Backend)
```bash
cd backend

# Windows
type nul > .env

# Linux/Mac
touch .env

# Edit and add:
# OPENAI_API_KEY=sk-your-key-here
```

### Create .env.local file (Frontend)
```bash
cd frontend

# Windows
type nul > .env.local

# Linux/Mac
touch .env.local

# Edit and add:
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Database Commands

```bash
cd backend

# View migrations status
python manage.py showmigrations

# Create migration for ai_agent (if needed)
python manage.py makemigrations ai_agent

# Apply migrations
python manage.py migrate

# Reset ai_agent (WARNING: deletes data!)
python manage.py migrate ai_agent zero
```

---

## Server Commands

```bash
# Backend - Terminal 1
cd backend
python manage.py runserver 8000

# Frontend - Terminal 2
cd frontend
npm run dev

# Check backend health
curl http://localhost:8000/admin/

# Check frontend
http://localhost:3000/customer/ai-agent
```

---

## Admin Commands

```bash
cd backend

# Create admin user
python manage.py createsuperuser

# Change admin password
python manage.py changepassword username

# Shell access
python manage.py shell

# Collect static files (production)
python manage.py collectstatic
```

---

## Deployment Commands

```bash
cd backend

# Generate static files
python manage.py collectstatic --noinput

# Create production migrations
python manage.py makemigrations

# Apply all migrations
python manage.py migrate

# Run gunicorn (production)
gunicorn backend.wsgi:application --bind 0.0.0.0:8000
```

---

## Troubleshooting Commands

```bash
# Check Python version
python --version

# Check pip packages
pip list | grep -i django

# Check if port is in use (Linux/Mac)
lsof -i :8000
lsof -i :3000

# Check if port is in use (Windows)
netstat -ano | findstr :8000

# Kill process (Linux/Mac)
kill -9 <PID>

# Kill process (Windows)
taskkill /PID <PID> /F
```

---

## Import/Export Commands

```bash
cd backend

# Export data to JSON
python manage.py dumpdata ai_agent > ai_agent.json

# Import data from JSON
python manage.py loaddata ai_agent.json

# Reset database
python manage.py migrate ai_agent zero
python manage.py migrate ai_agent
```

---

## Quick API Tests

```bash
# Get token
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'

# Start conversation
curl -X POST http://localhost:8000/api/ai/conversations/start_conversation/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send message
curl -X POST http://localhost:8000/api/ai/conversations/1/send_message/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Get history
curl -X GET http://localhost:8000/api/ai/conversations/1/get_history/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create order
curl -X POST http://localhost:8000/api/ai/orders/1/confirm_and_create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method": "cod"}'
```

---

## Cleanup Commands

```bash
# Remove Python cache
find . -type d -name __pycache__ -exec rm -r {} +
find . -name "*.pyc" -delete

# Remove node_modules (and reinstall later)
cd frontend
rm -rf node_modules
npm install

# Remove migrations (CAREFUL!)
# Only do this in development, not production!
rm backend/ai_agent/migrations/*.py
```

---

## Install Optional Dependencies

```bash
# OpenAI support
pip install openai

# PostgreSQL support
pip install psycopg2-binary

# Redis for caching
pip install redis

# Celery for async tasks
pip install celery
```

---

## Production Deployment

```bash
# 1. Collect static
python manage.py collectstatic --noinput

# 2. Run migrations
python manage.py migrate

# 3. Create superuser
python manage.py createsuperuser

# 4. Start gunicorn
gunicorn backend.wsgi --workers 4 --bind 0.0.0.0:8000 --timeout 120

# 5. Build frontend
npm run build

# 6. Start frontend
npm start
```

---

## Common Issues & Fixes

```bash
# Module not found
pip install -r requirements.txt

# Port already in use
# Kill the process using lsof (Mac) or netstat (Windows)

# Database locked
python manage.py migrate

# Static files missing
python manage.py collectstatic

# Import errors
python -m pip install --upgrade pip setuptools
```

---

## Useful Aliases (Linux/Mac)

Add to `~/.bashrc` or `~/.zshrc`:

```bash
alias start-teddy='cd ~/TeddyShop && backend/venv/bin/python backend/manage.py runserver'
alias start-frontend='cd ~/TeddyShop/frontend && npm run dev'
alias start-both='(cd backend && python manage.py runserver) & (cd frontend && npm run dev)'
```

Then use:
```bash
start-teddy
start-frontend
start-both
```

---

## Documentation

```bash
# Read main guides
cat README_AI_AGENT.md
cat SETUP_AI_AGENT.md
cat AI_AGENT_GUIDE.md

# View API examples
cat API_TESTING.md

# Check completion
cat COMPLETION_REPORT.md
```

---

## URLs to Remember

| Service | URL |
|---------|-----|
| Backend | http://localhost:8000 |
| Django Admin | http://localhost:8000/admin |
| API Root | http://localhost:8000/api |
| AI API | http://localhost:8000/api/ai |
| Frontend | http://localhost:3000 |
| AI Agent | http://localhost:3000/customer/ai-agent |

---

## Next Steps

1. ✅ Run setup script
2. ✅ Start servers
3. ✅ Visit http://localhost:3000/customer/ai-agent
4. ✅ Test chat functionality
5. ✅ Create sample order
6. ✅ Check admin dashboard
7. ✅ Read documentation

---

**Happy coding! 🚀**
