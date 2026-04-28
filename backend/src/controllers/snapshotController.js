const pool = require('../config/database');

/**
 * Get utilization trend for a specific employee over time
 */
exports.getEmployeeUtilizationTrend = async (req, res) => {
  try {
    const { employeeId, monthsBack = 12 } = req.query;

    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const query = `
      SELECT
        snapshot_date,
        month_year,
        utilization_percent,
        project_count,
        created_at
      FROM utilization_snapshots
      WHERE employee_id = $1
        AND snapshot_date >= NOW()::date - INTERVAL '1 day' * $2
      ORDER BY snapshot_date, month_year
    `;

    const result = await pool.query(query, [employeeId, monthsBack * 30]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employee utilization trend:', error);
    res.status(500).json({ message: 'Failed to fetch utilization trend' });
  }
};

/**
 * Get utilization trends for all employees
 */
exports.getAllEmployeesUtilizationTrend = async (req, res) => {
  try {
    const { monthsBack = 12 } = req.query;

    const query = `
      SELECT
        snapshot_date,
        month_year,
        employee_id,
        utilization_percent,
        project_count
      FROM utilization_snapshots
      WHERE snapshot_date >= NOW()::date - INTERVAL '1 day' * $1
      ORDER BY snapshot_date, employee_id, month_year
    `;

    const result = await pool.query(query, [monthsBack * 30]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all employees utilization trend:', error);
    res.status(500).json({ message: 'Failed to fetch utilization trends' });
  }
};

/**
 * Get bench availability trend over time
 */
exports.getBenchTrend = async (req, res) => {
  try {
    const { monthsBack = 12 } = req.query;

    const query = `
      SELECT
        snapshot_date,
        month_year,
        total_employees,
        available_fte,
        bench_percent,
        created_at
      FROM bench_snapshots
      WHERE snapshot_date >= NOW()::date - INTERVAL '1 day' * $1
      ORDER BY snapshot_date, month_year
    `;

    const result = await pool.query(query, [monthsBack * 30]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bench trend:', error);
    res.status(500).json({ message: 'Failed to fetch bench trend' });
  }
};

/**
 * Get project allocation trend over time
 */
exports.getProjectAllocationTrend = async (req, res) => {
  try {
    const { projectId, monthsBack = 12 } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const query = `
      SELECT
        snapshot_date,
        project_id,
        employee_count,
        total_allocation_percent,
        average_allocation_percent
      FROM project_allocation_snapshots
      WHERE project_id = $1
        AND snapshot_date >= NOW()::date - INTERVAL '1 day' * $2
      ORDER BY snapshot_date
    `;

    const result = await pool.query(query, [projectId, monthsBack * 30]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching project allocation trend:', error);
    res.status(500).json({ message: 'Failed to fetch project allocation trend' });
  }
};

/**
 * Get snapshot metadata (last capture time, status, etc.)
 */
exports.getSnapshotMetadata = async (req, res) => {
  try {
    const query = `
      SELECT
        snapshot_type,
        last_snapshot_date,
        last_snapshot_time,
        record_count,
        status
      FROM snapshot_metadata
      ORDER BY snapshot_type
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching snapshot metadata:', error);
    res.status(500).json({ message: 'Failed to fetch snapshot metadata' });
  }
};

/**
 * Get average utilization trend over time (all employees)
 */
exports.getAverageUtilizationTrend = async (req, res) => {
  try {
    const { monthsBack = 12 } = req.query;

    const query = `
      SELECT
        snapshot_date,
        month_year,
        COUNT(DISTINCT employee_id) as employee_count,
        ROUND(AVG(utilization_percent)::numeric, 2) as avg_utilization,
        MAX(utilization_percent) as max_utilization,
        MIN(utilization_percent) as min_utilization,
        ROUND(STDDEV(utilization_percent)::numeric, 2) as stddev_utilization
      FROM utilization_snapshots
      WHERE snapshot_date >= NOW()::date - INTERVAL '1 day' * $1
      GROUP BY snapshot_date, month_year
      ORDER BY snapshot_date, month_year
    `;

    const result = await pool.query(query, [monthsBack * 30]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching average utilization trend:', error);
    res.status(500).json({ message: 'Failed to fetch average utilization trend' });
  }
};

/**
 * Get historical summary statistics
 */
exports.getHistoricalSummary = async (req, res) => {
  try {
    const query = `
      SELECT
        'utilization' as metric,
        COUNT(*) as total_records,
        MIN(snapshot_date) as first_snapshot,
        MAX(snapshot_date) as last_snapshot
      FROM utilization_snapshots
      UNION ALL
      SELECT
        'bench' as metric,
        COUNT(*) as total_records,
        MIN(snapshot_date) as first_snapshot,
        MAX(snapshot_date) as last_snapshot
      FROM bench_snapshots
      UNION ALL
      SELECT
        'project_allocation' as metric,
        COUNT(*) as total_records,
        MIN(snapshot_date) as first_snapshot,
        MAX(snapshot_date) as last_snapshot
      FROM project_allocation_snapshots
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching historical summary:', error);
    res.status(500).json({ message: 'Failed to fetch historical summary' });
  }
};
