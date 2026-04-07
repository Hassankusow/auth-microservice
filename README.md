# Auth Microservice

[![Tests](https://github.com/Hassankusow/auth-microservice/actions/workflows/tests.yml/badge.svg)](https://github.com/Hassankusow/auth-microservice/actions/workflows/tests.yml)

A RESTful authentication service built with Node.js, Express, and PostgreSQL. Includes a live demo frontend for testing all API endpoints directly in the browser — no Postman required.

---

## Features

- User registration with bcrypt password hashing (cost factor 10)
- JWT-based session handling with configurable expiry
- Two-step password reset via cryptographically secure tokens
- Role-based access control (RBAC) — `user` and `admin` roles
- JWT and RBAC middleware for protecting routes
- Live demo frontend — register, login, reset password, and test all endpoints

---

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, bcryptjs, jsonwebtoken

**Frontend (Demo):** Vanilla HTML, CSS, JavaScript — dark-themed UI with live API response display

---

## Project Structure

```
auth-microservice/
├── src/
│   ├── server.js              # Express app entry point
│   ├── db/
│   │   ├── connection.js      # PostgreSQL pool setup
│   │   └── schema.sql         # Users table definition
│   ├── models/
│   │   └── UserModel.js       # User DB queries (OOP class)
│   ├── middleware/
│   │   ├── verifyToken.js     # JWT Bearer token validation
│   │   └── checkRole.js       # RBAC role guard
│   └── routes/
│       └── auth.js            # All auth route handlers
├── public/
│   ├── css/styles.css
│   ├── js/api.js              # Shared fetch client
│   └── pages/
│       ├── login.html
│       ├── register.html
│       ├── forgot.html        # Two-step password reset flow
│       └── dashboard.html     # Live endpoint testing panel
├── .env.example
├── package.json
└── README.md
```

---

## Setup

**1. Clone and install**
```bash
git clone https://github.com/Hassankusow/auth-microservice
cd auth-microservice
npm install
```

**2. Configure environment**
```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=1h
RESET_TOKEN_EXPIRES=900000
PORT=3000
```

**3. Create the database schema**
```bash
psql -U your_db_user -d auth_db -f src/db/schema.sql
```

**4. Start the server**
```bash
node src/server.js
```

**5. Open the demo**

Visit `http://localhost:3000` — register an account and test all endpoints live from the dashboard.

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user, returns JWT | No |
| POST | `/api/auth/login` | Login, returns JWT | No |
| POST | `/api/auth/forgot-password` | Generate password reset token | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| GET | `/api/auth/me` | Get current user profile | JWT |
| GET | `/api/auth/admin/users` | List all users | JWT + admin role |
| GET | `/api/health` | Service health check | No |

---

## Example Requests

**Register**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123","role":"user"}'
```

**Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

**Protected route**
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

## Author

**Hassan Abdi**
[GitHub](https://github.com/Hassankusow) | [LinkedIn](https://linkedin.com/in/hassan-abdi-119357267)
