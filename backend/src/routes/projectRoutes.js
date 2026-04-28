const express = require('express');
const { body, validationResult } = require('express-validator');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// H5 - Shared validation error handler
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

// H5 - Project validation
const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 255 }).withMessage('Name must be 255 characters or less'),
  body('clientName').optional().trim().isLength({ max: 255 }).withMessage('Client name must be 255 characters or less'),
  body('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid ISO8601 date'),
  body('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid ISO8601 date'),
];

router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.post('/', projectValidation, checkValidation, projectController.create);
router.put('/:id', projectValidation, checkValidation, projectController.update);
router.delete('/:id', projectController.delete);

module.exports = router;
