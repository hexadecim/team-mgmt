const express = require('express');
const resourceAllocationController = require('../controllers/resourceAllocationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', resourceAllocationController.getAll);
router.get('/employee/:employeeId/month/:year/:month', resourceAllocationController.getByEmployeeAndMonth);
router.get('/project/:projectId', resourceAllocationController.getByProject);
router.post('/', resourceAllocationController.create);
router.put('/:id', resourceAllocationController.update);
router.delete('/:id', resourceAllocationController.delete);

module.exports = router;
