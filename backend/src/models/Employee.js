const pool = require('../config/database');

class Employee {
  static async getAll(practices = null) {
    let query = 'SELECT * FROM employees';
    let params = [];

    // Filter by practices if provided (null = admin, no filter)
    if (practices !== null) {
      if (Array.isArray(practices) && practices.length > 0) {
        query += ' WHERE practice = ANY($1)';
        params.push(practices);
      } else if (Array.isArray(practices) && practices.length === 0) {
        // User has no role, return empty
        return [];
      }
    }

    query += ' ORDER BY id DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(name, designation, primarySkill, secondarySkill, city, practice = 'SSDD') {
    const result = await pool.query(
      'INSERT INTO employees (name, designation, primary_skill, secondary_skill, city, practice) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, designation, primarySkill, secondarySkill, city, practice]
    );
    return result.rows[0];
  }

  static async update(id, name, designation, primarySkill, secondarySkill, city, practice = 'SSDD') {
    const result = await pool.query(
      'UPDATE employees SET name = $1, designation = $2, primary_skill = $3, secondary_skill = $4, city = $5, practice = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, designation, primarySkill, secondarySkill, city, practice, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Employee;
