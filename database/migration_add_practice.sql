-- Migration: Add practice field to employees and projects tables
-- This migration adds the practice column and sets default value to "SSDD" for existing records

-- Add practice column to employees table if it doesn't exist
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS practice VARCHAR(255) DEFAULT 'SSDD';

-- Update existing employees to have practice = 'SSDD'
UPDATE employees SET practice = 'SSDD' WHERE practice IS NULL;

-- Add practice column to projects table if it doesn't exist
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS practice VARCHAR(255) DEFAULT 'SSDD';

-- Update existing projects to have practice = 'SSDD'
UPDATE projects SET practice = 'SSDD' WHERE practice IS NULL;
