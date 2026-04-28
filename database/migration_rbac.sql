-- RBAC Migration: Add role-based access control tables and columns

-- 1. Add is_admin flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Promote existing admin user
UPDATE users SET is_admin = TRUE WHERE email = 'admin@example.com';

-- 3. Create practices master table
CREATE TABLE IF NOT EXISTS practices (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);

-- 4. Seed practices from existing data (idempotent)
INSERT INTO practices (name)
  SELECT DISTINCT practice FROM employees WHERE practice IS NOT NULL
  UNION
  SELECT DISTINCT practice FROM projects WHERE practice IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- 5. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create role_practices join table (many-to-many)
CREATE TABLE IF NOT EXISTS role_practices (
  role_id     INTEGER NOT NULL REFERENCES roles(id)     ON DELETE CASCADE,
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, practice_id)
);

-- 7. Add role_id FK to users table (single role per user; NULL = no access)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;
