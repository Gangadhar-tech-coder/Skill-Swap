# SkillSwap – Real-Time Skill Barter Platform

> **Learn Anything. Teach Anything. Pay With Skills.**

A full-stack web application where users exchange skills instead of money. Trade hours of teaching for learning using Skill Credits. 

The platform is fully responsive and deployed natively to Android via Capacitor!

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TailwindCSS v4, Zustand, React Router |
| Mobile | Capacitor (Android) |
| Backend | Django 5.1, Django REST Framework, Python 3.11 |
| Database | SQLite (dev) / PostgreSQL (production) |
| Auth | JWT (python-jose + bcrypt) |
| Real-time | WebSockets (Django Channels) |
| AI Matching | Cosine similarity (scikit-learn + numpy) |
| Deployment | Docker + Docker Compose, Vercel (Web), Render (Backend) |

## Quick Start (Local Web Development)

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

---

## Mobile App Development (Android)

SkillSwap is bundled into a native Android app using **Capacitor**.

### Prerequisites
- Android Studio installed and configured
- Android SDK installed (SDK 34+)
- Gradle JDK set to Java 21+

### Build & Run the App
```bash
cd frontend
npm install

# Build the production web bundle
npm run build

# Sync the web bundle into the Android Studio project
npx cap sync android
```
Open Android Studio, select `frontend/android` as the project, and click **Build > Build APK** or **Run** on your emulator/device.

### Capacitor Live Reload (Hot Module Replacement)
To avoid running `build` and `sync` every time you change a UI component, you can use Live Reload!

1. Ensure your computer and mobile device are on the **same Wi-Fi network**.
2. Run the specialized dev script to broadcast Vite across your network:
   ```bash
   npm run dev:android
   ```
3. Run `npx cap sync android` to ensure the local `capacitor.config.json` is updated.
4. Open the app on your phone/emulator. When you hit `Save` on any React file in VS Code, the Android app will update instantly!

> **Production Warning**: Before building your Release APK for the Play Store, make sure to delete the `"server"` block from `frontend/capacitor.config.json` so the app doesn't attempt to load from your local IP!

---

## Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# App will be available at http://localhost
# API at http://localhost:8000
```

## Key Features

- **Skill Credits Economy** – 1 hour teaching = +1 credit, learning = -1 credit
- **AI Matching** – Cosine similarity on skill vectors + reputation + availability scoring
- **Real-time Chat** – WebSocket-powered session chat (Django Channels)
- **Reputation System** – Multi-factor ratings (communication, quality, professionalism)
- **Native Android Support** – Fully responsive Capacitor app with mobile-optimized Glassmorphism UI
- **Admin Dashboard** – User management, session overview, platform analytics

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
