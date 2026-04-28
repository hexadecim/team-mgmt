-- Migration: Create limited app_user for application use
-- H9 - Database user privilege isolation
-- Run this once against the running database BEFORE switching DB_USER in .env

-- 1. Create the user with limited privileges (use a strong password)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'CHANGE_ME_strong_app_password';
  END IF;
END
$$;

-- 2. Grant connect privilege on the database
GRANT CONNECT ON DATABASE resource_analysis_db TO app_user;

-- 3. Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO app_user;

-- 4. Grant DML (no DDL) on existing tables - SELECT, INSERT, UPDATE, DELETE
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- 5. Grant usage on all sequences (needed for SERIAL/IDENTITY inserts)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- 6. Ensure future tables and sequences also get these grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;
