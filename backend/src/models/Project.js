const pool = require('../config/database');

class Project {
  static async getAll(practices = null) {
    let query = `SELECT p.*, e.name as project_manager_name
                 FROM projects p
                 LEFT JOIN employees e ON p.project_manager_id = e.id`;
    let params = [];

    // Filter by practices if provided (null = admin, no filter)
    if (practices !== null) {
      if (Array.isArray(practices) && practices.length > 0) {
        query += ' WHERE p.practice = ANY($1)';
        params.push(practices);
      } else if (Array.isArray(practices) && practices.length === 0) {
        // User has no role, return empty
        return [];
      }
    }

    query += ' ORDER BY p.id DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(
      `SELECT p.*, e.name as project_manager_name
       FROM projects p
       LEFT JOIN employees e ON p.project_manager_id = e.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(name, clientName, projectManagerId, startDate, endDate, practice = 'SSDD') {
    const result = await pool.query(
      `INSERT INTO projects (name, client_name, project_manager_id, start_date, end_date, practice)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, clientName, projectManagerId, startDate, endDate, practice]
    );
    return result.rows[0];
  }

  static async update(id, name, clientName, projectManagerId, startDate, endDate, practice = 'SSDD') {
    const result = await pool.query(
      `UPDATE projects
       SET name = $1, client_name = $2, project_manager_id = $3, start_date = $4, end_date = $5, practice = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, clientName, projectManagerId, startDate, endDate, practice, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Project;
