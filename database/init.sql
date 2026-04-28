-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255) NOT NULL,
  primary_skill VARCHAR(255),
  secondary_skill VARCHAR(255),
  city VARCHAR(255),
  practice VARCHAR(255) DEFAULT 'SSDD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  project_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  practice VARCHAR(255) DEFAULT 'SSDD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create resource allocations table
CREATE TABLE IF NOT EXISTS resource_allocations (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  allocation_percent INTEGER NOT NULL CHECK (allocation_percent >= 0 AND allocation_percent <= 100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, project_id, start_date, end_date)
);

-- Create practices master table (for RBAC)
CREATE TABLE IF NOT EXISTS practices (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);

-- Create roles table (for RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create role_practices join table (for RBAC)
CREATE TABLE IF NOT EXISTS role_practices (
  role_id     INTEGER NOT NULL REFERENCES roles(id)     ON DELETE CASCADE,
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, practice_id)
);

-- Add RBAC columns to users table (for RBAC)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;

-- Insert default admin user (password: admin123 hashed with bcrypt)
INSERT INTO users (email, password, full_name, is_admin)
VALUES ('admin@example.com', '$2a$10$3X4.kQAhcuGwGB3J5qLWvei1RWFL8lC3u8Ml9hGves2F46QjgTP/e', 'Admin User', true)
ON CONFLICT (email) DO NOTHING;

-- Seed practices from existing data
INSERT INTO practices (name)
  SELECT DISTINCT practice FROM employees WHERE practice IS NOT NULL
  UNION
  SELECT DISTINCT practice FROM projects WHERE practice IS NOT NULL
ON CONFLICT (name) DO NOTHING;
