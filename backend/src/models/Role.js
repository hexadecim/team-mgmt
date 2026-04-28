const pool = require('../config/database');

class Role {
  // Get all roles with their practices
  static async getAll() {
    const result = await pool.query(`
      SELECT r.id, r.name, r.created_at,
        COALESCE(
          JSON_AGG(JSON_BUILD_OBJECT('id', p.id, 'name', p.name)) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) AS practices
      FROM roles r
      LEFT JOIN role_practices rp ON rp.role_id = r.id
      LEFT JOIN practices p ON p.id = rp.practice_id
      GROUP BY r.id
      ORDER BY r.name ASC
    `);
    return result.rows;
  }

  // Get role by ID with practices
  static async getById(id) {
    const result = await pool.query(`
      SELECT r.id, r.name, r.created_at,
        COALESCE(
          JSON_AGG(JSON_BUILD_OBJECT('id', p.id, 'name', p.name)) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) AS practices
      FROM roles r
      LEFT JOIN role_practices rp ON rp.role_id = r.id
      LEFT JOIN practices p ON p.id = rp.practice_id
      WHERE r.id = $1
      GROUP BY r.id
    `, [id]);
    return result.rows[0];
  }

  // Create a new role
  static async create(name) {
    const result = await pool.query(
      'INSERT INTO roles (name) VALUES ($1) RETURNING *',
      [name]
    );
    return result.rows[0];
  }

  // Update role name
  static async update(id, name) {
    const result = await pool.query(
      'UPDATE roles SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    return result.rows[0];
  }

  // Delete role
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM roles WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  // Assign practices to role (replaces existing)
  static async setPractices(roleId, practiceIds) {
    // Delete existing role_practices
    await pool.query('DELETE FROM role_practices WHERE role_id = $1', [roleId]);

    // Insert new practices if array is not empty
    if (practiceIds && practiceIds.length > 0) {
      const values = practiceIds.map((practiceId, idx) => `($1, $${idx + 2})`).join(',');
      const query = `INSERT INTO role_practices (role_id, practice_id) VALUES ${values}`;
      await pool.query(query, [roleId, ...practiceIds]);
    }

    return this.getById(roleId);
  }

  // Get practices for a user (via their role)
  static async getPracticesForUser(userId) {
    const result = await pool.query(`
      SELECT p.name
      FROM practices p
      JOIN role_practices rp ON rp.practice_id = p.id
      JOIN roles r ON r.id = rp.role_id
      JOIN users u ON u.role_id = r.id
      WHERE u.id = $1
      ORDER BY p.name ASC
    `, [userId]);
    return result.rows.map(row => row.name);
  }
}

module.exports = Role;
