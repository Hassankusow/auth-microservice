-- Create database (run this manually once)
-- CREATE DATABASE auth_db;

-- Connect to auth_db then run the rest:

CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TABLE IF NOT EXISTS users (
  id                  SERIAL PRIMARY KEY,
  email               VARCHAR(255) UNIQUE NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  role                user_role NOT NULL DEFAULT 'user',
  reset_token         VARCHAR(255),
  reset_token_expires BIGINT,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for fast reset token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
