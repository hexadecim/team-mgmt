-- Migration: Add snapshot tables for historical trend tracking
-- Date: 2026-04-27

-- Utilization Snapshots - tracks employee utilization over time
CREATE TABLE IF NOT EXISTS utilization_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL,  -- Format: "2026-04"
  utilization_percent INTEGER NOT NULL CHECK (utilization_percent >= 0 AND utilization_percent <= 200),
  project_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_utilization_snapshots_date ON utilization_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_utilization_snapshots_employee ON utilization_snapshots(employee_id);
CREATE INDEX IF NOT EXISTS idx_utilization_snapshots_month ON utilization_snapshots(month_year);

-- Bench Snapshots - tracks bench availability over time
CREATE TABLE IF NOT EXISTS bench_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  month_year VARCHAR(7) NOT NULL,  -- Format: "2026-04"
  total_employees INTEGER NOT NULL,
  available_fte DECIMAL(10, 2) NOT NULL,
  bench_percent INTEGER NOT NULL CHECK (bench_percent >= 0 AND bench_percent <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bench_snapshots_date ON bench_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_bench_snapshots_month ON bench_snapshots(month_year);

-- Project Allocation Snapshots - tracks project allocations over time
CREATE TABLE IF NOT EXISTS project_allocation_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_count INTEGER NOT NULL,
  total_allocation_percent INTEGER NOT NULL,
  average_allocation_percent DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_allocation_snapshots_date ON project_allocation_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_project_allocation_snapshots_project ON project_allocation_snapshots(project_id);

-- Snapshot Metadata - tracks when snapshots were last captured
CREATE TABLE IF NOT EXISTS snapshot_metadata (
  id SERIAL PRIMARY KEY,
  snapshot_type VARCHAR(50) UNIQUE NOT NULL,  -- 'utilization', 'bench', 'project_allocation'
  last_snapshot_date DATE,
  last_snapshot_time TIMESTAMP,
  record_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending'  -- pending, completed, failed
);

-- Insert metadata records for tracking
INSERT INTO snapshot_metadata (snapshot_type, status)
VALUES
  ('utilization', 'pending'),
  ('bench', 'pending'),
  ('project_allocation', 'pending')
ON CONFLICT (snapshot_type) DO NOTHING;
