# Auth Microservice

A RESTful authentication service built with Node.js, Express, and PostgreSQL. Features a client-facing demo frontend built with HTML, CSS, Bootstrap, and jQuery — making AJAX calls to the auth API.

---

## Features

- User registration with bcrypt password hashing
- Login with JWT-based session handling
- Password reset via secure token (forgot password flow)
- Role-based access control (RBAC) — user / admin roles
- Protected routes using JWT middleware
- Demo frontend: Register, Login, and Password Reset pages

---

## Tech Stack

**Backend**
- Node.js + Express (REST API)
- PostgreSQL (relational database)
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- dotenv, cors

**Frontend (Demo)**
- HTML, CSS, Bootstrap 5
- jQuery + AJAX (calls the REST API)

---

## Project Structure

```
auth-microservice/
├── src/
│   ├── server.js           # Entry point
│   ├── db/
│   │   ├── connection.js   # PostgreSQL pool
│   │   └── schema.sql      # Table definitions
│   ├── models/
│   │   └── UserModel.js    # User DB queries (OOP class)
│   ├── middleware/
│   │   ├── verifyToken.js  # JWT auth middleware
│   │   └── checkRole.js    # RBAC middleware
│   └── routes/
│       └── auth.js         # Auth route handlers
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── auth.js         # jQuery AJAX logic
│   └── pages/
│       ├── login.html
│       ├── register.html
│       └── reset-password.html
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Setup

1. **Clone the repo**
```bash
git clone https://github.com/Hassankusow/auth-microservice
cd auth-microservice
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Fill in your PostgreSQL credentials and JWT secret
```

4. **Create the database**
```bash
psql -U your_db_user -d postgres -f src/db/schema.sql
```

5. **Run the server**
```bash
npm run dev
```

6. **Open the demo frontend**

Visit `http://localhost:3000` in your browser.

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login, returns JWT | No |
| POST | `/api/auth/forgot-password` | Request password reset token | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| GET | `/api/auth/me` | Get current user profile | Yes (JWT) |
| GET | `/api/admin/users` | List all users | Yes (admin role) |

---

## Author

**Hassan Abdi**
[GitHub](https://github.com/Hassankusow) | [LinkedIn](https://linkedin.com/in/hassan-abdi-119357267)
