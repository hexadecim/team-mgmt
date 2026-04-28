const pool = require('../config/database');

/**
 * Capture utilization snapshots for all employees
 * Calculates utilization for each employee for the current month and previous months
 */
async function captureUtilizationSnapshots() {
  try {
    console.log('Starting utilization snapshots capture...');

    // Get current date and month
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Delete existing snapshots for today to avoid duplicates
    await pool.query(
      'DELETE FROM utilization_snapshots WHERE snapshot_date = $1',
      [today.toISOString().split('T')[0]]
    );

    // Query to calculate utilization for each employee for current and next 11 months
    const query = `
      WITH month_range AS (
        SELECT generate_series(0, 11) as month_offset
      ),
      months AS (
        SELECT
          (DATE_TRUNC('month', NOW()) + (INTERVAL '1 month' * month_offset))::date as month_start,
          TO_CHAR(DATE_TRUNC('month', NOW()) + (INTERVAL '1 month' * month_offset), 'YYYY-MM') as month_year
        FROM month_range
      ),
      employee_allocations AS (
        SELECT
          e.id as employee_id,
          m.month_year,
          m.month_start,
          COALESCE(SUM(ra.allocation_percent), 0) as total_allocation,
          COUNT(DISTINCT ra.project_id) as project_count
        FROM employees e
        CROSS JOIN months m
        LEFT JOIN resource_allocations ra ON e.id = ra.employee_id
          AND ra.start_date <= (m.month_start + INTERVAL '1 month' - INTERVAL '1 day')::date
          AND ra.end_date >= m.month_start::date
        GROUP BY e.id, m.month_year, m.month_start
      )
      INSERT INTO utilization_snapshots (snapshot_date, employee_id, month_year, utilization_percent, project_count)
      SELECT
        $1::date,
        employee_id,
        month_year,
        LEAST(total_allocation::integer, 200),  -- Cap at 200% for over-allocation
        project_count
      FROM employee_allocations
      WHERE total_allocation > 0 OR project_count > 0
    `;

    const result = await pool.query(query, [today.toISOString().split('T')[0]]);
    console.log(`✓ Captured ${result.rowCount} utilization snapshots`);

    // Update metadata
    await pool.query(
      `UPDATE snapshot_metadata
       SET last_snapshot_date = $1, last_snapshot_time = NOW(), record_count = $2, status = 'completed'
       WHERE snapshot_type = 'utilization'`,
      [today.toISOString().split('T')[0], result.rowCount]
    );

    return result.rowCount;
  } catch (error) {
    console.error('Error capturing utilization snapshots:', error);
    await pool.query(
      `UPDATE snapshot_metadata SET status = 'failed' WHERE snapshot_type = 'utilization'`
    );
    throw error;
  }
}

/**
 * Capture bench availability snapshots
 * Calculates available FTE capacity for each month
 */
async function captureBenchSnapshots() {
  try {
    console.log('Starting bench snapshots capture...');

    const today = new Date();

    // Delete existing snapshots for today
    await pool.query(
      'DELETE FROM bench_snapshots WHERE snapshot_date = $1',
      [today.toISOString().split('T')[0]]
    );

    // Query to calculate bench availability for each month
    const query = `
      WITH month_range AS (
        SELECT generate_series(0, 11) as month_offset
      ),
      months AS (
        SELECT
          (DATE_TRUNC('month', NOW()) + (INTERVAL '1 month' * month_offset))::date as month_start,
          TO_CHAR(DATE_TRUNC('month', NOW()) + (INTERVAL '1 month' * month_offset), 'YYYY-MM') as month_year
        FROM month_range
      ),
      employee_capacity AS (
        SELECT
          m.month_year,
          m.month_start,
          COUNT(DISTINCT e.id) as total_employees,
          COALESCE(SUM(
            CASE
              WHEN COALESCE(SUM(ra.allocation_percent), 0) < 100
              THEN (100 - COALESCE(SUM(ra.allocation_percent), 0)) / 100.0
              ELSE 0
            END
          ), 0) as available_fte
        FROM employees e
        CROSS JOIN months m
        LEFT JOIN resource_allocations ra ON e.id = ra.employee_id
          AND ra.start_date <= (m.month_start + INTERVAL '1 month' - INTERVAL '1 day')::date
          AND ra.end_date >= m.month_start::date
        GROUP BY m.month_year, m.month_start
      )
      INSERT INTO bench_snapshots (snapshot_date, month_year, total_employees, available_fte, bench_percent)
      SELECT
        $1::date,
        month_year,
        total_employees,
        available_fte,
        CASE
          WHEN total_employees > 0
          THEN ROUND((available_fte / total_employees) * 100)::integer
          ELSE 0
        END as bench_percent
      FROM employee_capacity
      WHERE total_employees > 0
    `;

    const result = await pool.query(query, [today.toISOString().split('T')[0]]);
    console.log(`✓ Captured ${result.rowCount} bench snapshots`);

    // Update metadata
    await pool.query(
      `UPDATE snapshot_metadata
       SET last_snapshot_date = $1, last_snapshot_time = NOW(), record_count = $2, status = 'completed'
       WHERE snapshot_type = 'bench'`,
      [today.toISOString().split('T')[0], result.rowCount]
    );

    return result.rowCount;
  } catch (error) {
    console.error('Error capturing bench snapshots:', error);
    await pool.query(
      `UPDATE snapshot_metadata SET status = 'failed' WHERE snapshot_type = 'bench'`
    );
    throw error;
  }
}

/**
 * Capture project allocation snapshots
 * Tracks employee allocation to projects over time
 */
async function captureProjectAllocationSnapshots() {
  try {
    console.log('Starting project allocation snapshots capture...');

    const today = new Date();

    // Delete existing snapshots for today
    await pool.query(
      'DELETE FROM project_allocation_snapshots WHERE snapshot_date = $1',
      [today.toISOString().split('T')[0]]
    );

    // Query to calculate project allocations
    const query = `
      INSERT INTO project_allocation_snapshots
        (snapshot_date, project_id, employee_count, total_allocation_percent, average_allocation_percent)
      SELECT
        $1::date,
        p.id,
        COUNT(DISTINCT ra.employee_id),
        COALESCE(SUM(ra.allocation_percent), 0),
        ROUND(COALESCE(AVG(ra.allocation_percent), 0), 2)
      FROM projects p
      LEFT JOIN resource_allocations ra ON p.id = ra.project_id
        AND ra.start_date <= NOW()::date
        AND ra.end_date >= NOW()::date
      GROUP BY p.id
      HAVING COUNT(DISTINCT ra.employee_id) > 0
    `;

    const result = await pool.query(query, [today.toISOString().split('T')[0]]);
    console.log(`✓ Captured ${result.rowCount} project allocation snapshots`);

    // Update metadata
    await pool.query(
      `UPDATE snapshot_metadata
       SET last_snapshot_date = $1, last_snapshot_time = NOW(), record_count = $2, status = 'completed'
       WHERE snapshot_type = 'project_allocation'`,
      [today.toISOString().split('T')[0], result.rowCount]
    );

    return result.rowCount;
  } catch (error) {
    console.error('Error capturing project allocation snapshots:', error);
    await pool.query(
      `UPDATE snapshot_metadata SET status = 'failed' WHERE snapshot_type = 'project_allocation'`
    );
    throw error;
  }
}

/**
 * Main function to capture all snapshots
 */
async function captureAllSnapshots() {
  try {
    console.log('\n=== Starting Daily Snapshot Capture ===');
    console.log(`Time: ${new Date().toISOString()}`);

    await captureUtilizationSnapshots();
    await captureBenchSnapshots();
    await captureProjectAllocationSnapshots();

    console.log('=== Snapshot Capture Completed Successfully ===\n');
  } catch (error) {
    console.error('Failed to capture snapshots:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  captureAllSnapshots();
}

module.exports = {
  captureAllSnapshots,
  captureUtilizationSnapshots,
  captureBenchSnapshots,
  captureProjectAllocationSnapshots,
};
