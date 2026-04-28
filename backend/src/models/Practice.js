const pool = require('../config/database');

class Practice {
  // Get all practices
  static async getAll() {
    const result = await pool.query(
      'SELECT id, name FROM practices ORDER BY name ASC'
    );
    return result.rows;
  }

  // Get practice by ID
  static async getById(id) {
    const result = await pool.query(
      'SELECT id, name FROM practices WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Create a new practice
  static async create(name) {
    const result = await pool.query(
      'INSERT INTO practices (name) VALUES ($1) RETURNING id, name',
      [name]
    );
    return result.rows[0];
  }

  // Delete practice
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM practices WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Practice;
