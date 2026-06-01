# SkillSwap – Real-Time Skill Barter Platform

> **Learn Anything. Teach Anything. Pay With Skills.**

A full-stack web application where users exchange skills instead of money. Trade hours of teaching for learning using Skill Credits.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TailwindCSS v4, Zustand, React Router |
| Backend | Django 5.1, Django REST Framework, Python 3.11 |
| Database | SQLite (dev) / PostgreSQL (production) |
| Auth | JWT (python-jose + bcrypt) |
| Real-time | WebSockets (Django Channels) |
| AI Matching | Cosine similarity (scikit-learn + numpy) |
| Deployment | Docker + Docker Compose |

## Quick Start (Local Development)

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed sample data (optional)
python manage.py seed

# Start the API server
python manage.py runserver 8000
```

API available at: http://localhost:8000

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start the dev server (proxies API to :8000)
npm run dev
```

App available at: http://localhost:5173

### 3. Demo Login

After seeding, login with:
- **Email:** alice@example.com
- **Password:** password123

Alice is an admin user with full dashboard access.

## Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# App will be available at http://localhost
# API at http://localhost:8000
```

## Project Structure

```
├── backend/
│   ├── manage.py                # Django management entry point
│   ├── skillswap/               # Django project config
│   │   ├── settings.py          # Settings (DB, CORS, JWT, Channels)
│   │   ├── urls.py              # Root URL config
│   │   ├── wsgi.py              # WSGI entry point
│   │   └── asgi.py              # ASGI entry point (HTTP + WebSocket)
│   ├── api/                     # Main Django app
│   │   ├── models.py            # Django ORM models
│   │   ├── serializers.py       # DRF serializers
│   │   ├── views.py             # API view functions
│   │   ├── urls.py              # API URL routing
│   │   ├── auth.py              # JWT auth + password hashing
│   │   ├── exceptions.py        # Custom exception handler
│   │   ├── admin.py             # Django admin registrations
│   │   ├── consumers.py         # WebSocket chat consumer
│   │   ├── routing.py           # WebSocket URL routing
│   │   ├── services/
│   │   │   └── matching.py      # Cosine similarity engine
│   │   └── management/
│   │       └── commands/
│   │           └── seed.py      # Sample data seeder
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css            # Design system
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Marketplace.jsx
│   │   │   ├── MatchSuggestions.jsx
│   │   │   ├── SessionPage.jsx
│   │   │   ├── Wallet.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── store/
│   │   │   └── authStore.js     # Zustand state
│   │   └── services/
│   │       └── api.js           # Axios + JWT
│   ├── index.html
│   ├── vite.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Key Features

- **Skill Credits Economy** – 1 hour teaching = +1 credit, learning = -1 credit
- **AI Matching** – Cosine similarity on skill vectors + reputation + availability scoring
- **Real-time Chat** – WebSocket-powered session chat (Django Channels)
- **Reputation System** – Multi-factor ratings (communication, quality, professionalism)
- **Admin Dashboard** – User management, session overview, platform analytics
- **Django Admin** – Full model management at /admin/
- **Glassmorphism UI** – Premium dark theme with gradients and micro-animations

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, get JWT |
| GET | /api/user/profile | Get profile |
| PUT | /api/user/profile | Update profile |
| POST | /api/skills/add | Add skill |
| GET | /api/skills/browse | Browse marketplace |
| GET | /api/match/suggestions | AI match suggestions |
| POST | /api/sessions/request | Request session |
| POST | /api/sessions/complete/{id} | Complete + transfer credits |
| POST | /api/sessions/rate/{id} | Rate partner |
| GET | /api/wallet/ | Get credit balance |
| GET | /api/wallet/transactions | Transaction history |
