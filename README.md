# LoanFlow Dashboards

LoanFlow Dashboards is a full-stack role-based loan portal with a Django REST backend and a React/Vite frontend.

Roles in the system:

- User: browse loan advertisements, submit loan applications, and track application status.
- Bank: review applications assigned to the bank and approve or reject them.
- Admin: manage users, banks, and system-level overview data.

## Tech stack

### Frontend
- React
- Vite
- React Router
- Axios

### Backend
- Django
- Django REST Framework (token auth)
- SQLite (users/auth)
- MongoDB via MongoEngine (loan ads/applications)

## Project structure

```text
backend/
  config/
  core/
  manage.py
  requirements.txt

frontend/
  src/
  package.json
  vite.config.js
```

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- MongoDB running locally on port 27017

## Setup

### 1) Backend

```bash
cd backend
python -m venv ../.venv
../.venv/Scripts/pip install -r requirements.txt
../.venv/Scripts/python manage.py migrate
```

### 2) Frontend

```bash
cd frontend
npm install
```

## Run

Use two terminals.

### Terminal 1: Django API

```bash
cd backend
../.venv/Scripts/python manage.py runserver
```

Backend URL:

```text
http://127.0.0.1:8000
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173
```

The frontend calls the backend at:

```text
http://127.0.0.1:8000/api
```

## Demo credentials

### Demo bank accounts
- Bajaj Finance Limited
  - Username: bajaj_finance
  - Password: nbfc@2026
- Tata Capital
  - Username: tata_capital
  - Password: nbfc@2026
- Shriram Finance
  - Username: shriram_finance
  - Password: nbfc@2026

### Admin
- Username: admin
- Password: admin@2026

### Users
- Create via signup page.

## API overview

Base: `/api`

- `POST /auth/register/`
- `POST /auth/login/`
- `GET /auth/me/`
- `GET /demo-banks/`
- `GET /banks/`
- `GET /loan-ads/`
- `GET /applications/`
- `POST /applications/`
- `PATCH /applications/<id>/`
- `GET /admin/summary/`
- `GET /admin/banks/`
- `POST /admin/banks/`
- `PATCH /admin/banks/<id>/`
- `DELETE /admin/banks/<id>/`

## Environment variables

### Backend
- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `MONGO_URL`

### Frontend
- `VITE_API_URL` (default: `http://127.0.0.1:8000/api`)
