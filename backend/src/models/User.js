const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT u.id, u.email, u.full_name, u.is_admin, u.role_id, u.created_at, r.name as role_name FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await pool.query(`
      SELECT u.id, u.email, u.full_name, u.is_admin, u.role_id, u.created_at,
             r.name as role_name
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at DESC
    `);
    return result.rows;
  }

  static async create(email, password, fullName, isAdmin = false, roleId = null) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, full_name, is_admin, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, is_admin, role_id',
      [email, hashedPassword, fullName, isAdmin, roleId]
    );
    return result.rows[0];
  }

  static async update(id, { email, fullName, isAdmin, roleId }) {
    const result = await pool.query(
      'UPDATE users SET email = $1, full_name = $2, is_admin = $3, role_id = $4 WHERE id = $5 RETURNING id, email, full_name, is_admin, role_id',
      [email, fullName, isAdmin, roleId, id]
    );
    return result.rows[0];
  }

  static async updatePassword(id, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
      [hashedPassword, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
