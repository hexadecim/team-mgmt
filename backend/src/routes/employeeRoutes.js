const express = require('express');
const { body, validationResult } = require('express-validator');
const employeeController = require('../controllers/employeeController');
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

// H5 - Employee validation
const employeeValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }).withMessage('Name must be 255 characters or less'),
  body('designation').trim().notEmpty().withMessage('Designation is required').isLength({ max: 255 }).withMessage('Designation must be 255 characters or less'),
  body('practice').optional().isIn(['SSDD', 'VSDD', 'ESDD']).withMessage('Invalid practice'),
  body('city').optional().trim().isLength({ max: 255 }).withMessage('City must be 255 characters or less'),
];

router.get('/', employeeController.getAll);
router.get('/:id', employeeController.getById);
router.post('/', employeeValidation, checkValidation, employeeController.create);
router.post('/bulk/create', employeeController.bulkCreate);
router.put('/:id', employeeValidation, checkValidation, employeeController.update);
router.delete('/:id', employeeController.delete);

module.exports = router;
