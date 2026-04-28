const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authMiddleware = async (req, res, next) => {
  // C4 - Read token from httpOnly cookie
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Enrich user object with role/practice data from DB
    const result = await pool.query(`
      SELECT u.id, u.email, u.is_admin,
        COALESCE(
          ARRAY_AGG(p.name) FILTER (WHERE p.name IS NOT NULL),
          ARRAY[]::text[]
        ) AS practices
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      LEFT JOIN role_practices rp ON rp.role_id = r.id
      LEFT JOIN practices p ON p.id = rp.practice_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [decoded.id]);

    if (!result.rows[0]) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      // null = admin (no filter), array = filtered (non-admin)
      practices: user.is_admin ? null : user.practices,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('Auth error:', err);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = authMiddleware;
