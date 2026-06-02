# Inventory Manager

A full-stack Inventory & Order Management System built with FastAPI, React, and PostgreSQL.

## Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Backend  | FastAPI (Python 3.12) + psycopg2   |
| Frontend | React 18 + Vite + Tailwind CSS     |
| Database | PostgreSQL 16                      |
| Auth     | JWT (python-jose)                  |
| Infra    | Docker Compose                     |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

## Quick Start

```bash
# 1. Clone / enter the project
cd inventory-app

# 2. Copy environment file (already pre-filled for local dev)
cp .env.example .env

# 3. Start everything
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs
- Default login: **admin** / **admin123**

## Seed Sample Data

After the stack is running:

```bash
docker compose exec backend python seed.py
```

This creates 8 sample products and 4 sample customers.

## API Reference

| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | /api/health                     | Health check                       |
| POST   | /api/auth/token                 | Login (returns JWT)                |
| POST   | /api/auth/register              | Register new user                  |
| GET    | /api/products                   | List products (?search=&skip=&limit=) |
| POST   | /api/products                   | Create product                     |
| PUT    | /api/products/{id}              | Update product                     |
| DELETE | /api/products/{id}              | Delete product                     |
| PATCH  | /api/products/{id}/stock        | Adjust stock quantity              |
| GET    | /api/customers                  | List customers (?search=)          |
| POST   | /api/customers                  | Create customer                    |
| PUT    | /api/customers/{id}             | Update customer                    |
| DELETE | /api/customers/{id}             | Delete customer                    |
| GET    | /api/customers/{id}/orders      | Get customer order history         |
| GET    | /api/orders                     | List orders (?status=&customer_id=) |
| POST   | /api/orders                     | Create order (validates stock)     |
| PATCH  | /api/orders/{id}/status         | Update order status                |

## Run Migrations Manually

```bash
docker compose exec backend alembic upgrade head
```

## Local Dev (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set env vars (or create a .env file)
export DATABASE_URL=postgresql://appuser:apppassword@localhost:5432/inventorydb
export SECRET_KEY=dev-secret

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev     # runs on http://localhost:5173
```

> The Vite dev server proxies `/api/*` to `http://localhost:8000`.
