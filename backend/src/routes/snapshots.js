const express = require('express');
const snapshotController = require('../controllers/snapshotController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/snapshots/employee-utilization-trend
 * Get utilization trend for a specific employee
 * Query params: employeeId, monthsBack (default 12)
 */
router.get('/employee-utilization-trend', snapshotController.getEmployeeUtilizationTrend);

/**
 * GET /api/snapshots/all-employees-utilization-trend
 * Get utilization trends for all employees
 * Query params: monthsBack (default 12)
 */
router.get('/all-employees-utilization-trend', snapshotController.getAllEmployeesUtilizationTrend);

/**
 * GET /api/snapshots/average-utilization-trend
 * Get average utilization trend over time
 * Query params: monthsBack (default 12)
 */
router.get('/average-utilization-trend', snapshotController.getAverageUtilizationTrend);

/**
 * GET /api/snapshots/bench-trend
 * Get bench availability trend over time
 * Query params: monthsBack (default 12)
 */
router.get('/bench-trend', snapshotController.getBenchTrend);

/**
 * GET /api/snapshots/project-allocation-trend
 * Get project allocation trend
 * Query params: projectId, monthsBack (default 12)
 */
router.get('/project-allocation-trend', snapshotController.getProjectAllocationTrend);

/**
 * GET /api/snapshots/metadata
 * Get snapshot metadata (last capture time, status)
 */
router.get('/metadata', snapshotController.getSnapshotMetadata);

/**
 * GET /api/snapshots/historical-summary
 * Get historical summary statistics
 */
router.get('/historical-summary', snapshotController.getHistoricalSummary);

module.exports = router;
