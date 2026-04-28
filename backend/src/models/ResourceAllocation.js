const pool = require('../config/database');

class ResourceAllocation {
  static async getAll(practices = null) {
    let query = `SELECT ra.*,
                        e.name as employee_name, e.designation as employee_designation,
                        p.name as project_name, p.client_name
                 FROM resource_allocations ra
                 JOIN employees e ON ra.employee_id = e.id
                 JOIN projects p ON ra.project_id = p.id`;
    let params = [];

    // Filter by practices if provided (null = admin, no filter)
    if (practices !== null) {
      if (Array.isArray(practices) && practices.length > 0) {
        // Filter allocations where either employee or project belongs to allowed practices
        query += ' WHERE e.practice = ANY($1) OR p.practice = ANY($1)';
        params.push(practices);
      } else if (Array.isArray(practices) && practices.length === 0) {
        // User has no role, return empty
        return [];
      }
    }

    query += ' ORDER BY ra.start_date DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getByEmployeeAndMonth(employeeId, year, month) {
    const result = await pool.query(
      `SELECT ra.*, p.name as project_name, p.client_name
       FROM resource_allocations ra
       JOIN projects p ON ra.project_id = p.id
       WHERE ra.employee_id = $1
       AND EXTRACT(YEAR FROM ra.start_date) <= $2
       AND EXTRACT(YEAR FROM ra.end_date) >= $2
       AND (
         (EXTRACT(MONTH FROM ra.start_date) <= $3 AND EXTRACT(MONTH FROM ra.end_date) >= $3)
         OR (ra.start_date <= MAKE_DATE($2, $3, 1) AND ra.end_date >= MAKE_DATE($2, $3, 1))
       )
       ORDER BY ra.start_date`,
      [employeeId, year, month]
    );
    return result.rows;
  }

  static async getByProjectId(projectId) {
    const result = await pool.query(
      `SELECT ra.*, e.name as employee_name, e.designation
       FROM resource_allocations ra
       JOIN employees e ON ra.employee_id = e.id
       WHERE ra.project_id = $1
       ORDER BY ra.start_date`,
      [projectId]
    );
    return result.rows;
  }

  static async create(employeeId, projectId, allocationPercent, startDate, endDate) {
    const result = await pool.query(
      `INSERT INTO resource_allocations (employee_id, project_id, allocation_percent, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [employeeId, projectId, allocationPercent, startDate, endDate]
    );
    return result.rows[0];
  }

  static async update(id, allocationPercent, startDate, endDate) {
    const result = await pool.query(
      `UPDATE resource_allocations
       SET allocation_percent = $1, start_date = $2, end_date = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [allocationPercent, startDate, endDate, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM resource_allocations WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async getMonthlyUtilization(employeeId, year, month) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(allocation_percent), 0)::INTEGER as total_allocation
       FROM resource_allocations
       WHERE employee_id = $1
       AND start_date < MAKE_DATE($2, $3, 1) + INTERVAL '1 month'
       AND end_date >= MAKE_DATE($2, $3, 1)`,
      [employeeId, year, month]
    );
    return parseInt(result.rows[0].total_allocation, 10);
  }
}

module.exports = ResourceAllocation;
