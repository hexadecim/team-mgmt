const express = require('express');
const Practice = require('../models/Practice');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all practices (auth-required)
router.get('/practices', authMiddleware, async (req, res) => {
  try {
    const practices = await Practice.getAll();
    res.json(practices);
  } catch (err) {
    console.error('Error fetching practices:', err);
    res.status(500).json({ message: 'Failed to fetch practices' });
  }
});

module.exports = router;
