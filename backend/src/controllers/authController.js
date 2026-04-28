const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await User.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    // C4 - Set token as httpOnly session cookie (cleared when browser closes)
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,  // false because local Docker has no HTTPS
      sameSite: 'lax',
      // No maxAge/expires = session cookie
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isAdmin: user.is_admin || false,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out successfully' });
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      isAdmin: user.is_admin || false,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};

exports.getPractices = async (req, res) => {
  try {
    res.json({
      isAdmin: req.user.isAdmin,
      practices: req.user.practices, // null for admin, array for non-admin
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch practices', error: err.message });
  }
};
