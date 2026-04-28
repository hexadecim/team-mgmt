const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

// Apply auth and admin middlewares to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// H5 - Shared validation error handler
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

// H5 - User validation
const userValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 255 }).withMessage('Full name must be 255 characters or less'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

// ============ USER MANAGEMENT ============
router.get('/users', adminController.listUsers);
router.post('/users', userValidation, checkValidation, adminController.createUser);
router.put('/users/:id', userValidation, checkValidation, adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// ============ ROLE MANAGEMENT ============
router.get('/roles', adminController.listRoles);
router.post('/roles', adminController.createRole);
router.put('/roles/:id', adminController.updateRole);
router.delete('/roles/:id', adminController.deleteRole);

// ============ PRACTICE MANAGEMENT ============
router.get('/practices', adminController.listPractices);
router.post('/practices', adminController.createPractice);
router.delete('/practices/:id', adminController.deletePractice);

module.exports = router;
