const ResourceAllocation = require('../models/ResourceAllocation');

exports.getAll = async (req, res) => {
  try {
    const allocations = await ResourceAllocation.getAll(req.user.practices);
    res.json(allocations);
  } catch (err) {
    console.error('Error fetching allocations:', err);
    res.status(500).json({ message: 'Failed to fetch allocations', error: err.message });
  }
};

exports.getByEmployeeAndMonth = async (req, res) => {
  try {
    const { employeeId, year, month } = req.params;
    const allocations = await ResourceAllocation.getByEmployeeAndMonth(
      parseInt(employeeId),
      parseInt(year),
      parseInt(month)
    );
    res.json(allocations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch allocations', error: err.message });
  }
};

exports.getByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const allocations = await ResourceAllocation.getByProjectId(parseInt(projectId));
    res.json(allocations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch allocations', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { employeeId, projectId, allocationPercent, startDate, endDate, forceAllocate } = req.body;

    if (!employeeId || !projectId || allocationPercent === undefined || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const allocationPercentNum = parseInt(allocationPercent, 10);

    if (allocationPercentNum < 0 || allocationPercentNum > 100) {
      return res.status(400).json({ message: 'Allocation percent must be between 0 and 100' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    // Check monthly utilization for each month in the range (unless force allocate is set)
    if (!forceAllocate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const monthsWithExceedance = [];

      for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        const monthUtilization = await ResourceAllocation.getMonthlyUtilization(
          employeeId,
          d.getFullYear(),
          d.getMonth() + 1
        );

        const totalUtilization = parseInt(monthUtilization, 10) + allocationPercentNum;
        if (totalUtilization > 100) {
          monthsWithExceedance.push({
            month: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            current: parseInt(monthUtilization, 10),
            requested: allocationPercentNum,
            total: totalUtilization
          });
        }
      }

      if (monthsWithExceedance.length > 0) {
        return res.status(400).json({
          message: 'Monthly utilization would exceed 100% in some months',
          exceedance: monthsWithExceedance,
          code: 'UTILIZATION_EXCEEDED'
        });
      }
    }

    const allocation = await ResourceAllocation.create(
      employeeId,
      projectId,
      allocationPercentNum,
      startDate,
      endDate
    );

    res.status(201).json({ message: 'Allocation created successfully', allocation });
  } catch (err) {
    console.error('Error creating allocation:', err);
    if (err.constraint === 'resource_allocations_employee_id_project_id_start_date_end_date_key') {
      return res.status(400).json({ message: 'This allocation already exists for this period' });
    }
    res.status(500).json({ message: 'Failed to create allocation', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { allocationPercent, startDate, endDate } = req.body;

    if (allocationPercent === undefined || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const allocationPercentNum = parseInt(allocationPercent, 10);

    if (allocationPercentNum < 0 || allocationPercentNum > 100) {
      return res.status(400).json({ message: 'Allocation percent must be between 0 and 100' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    const allocation = await ResourceAllocation.update(id, allocationPercentNum, startDate, endDate);

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    res.json({ message: 'Allocation updated successfully', allocation });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update allocation', error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const allocation = await ResourceAllocation.delete(id);

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    res.json({ message: 'Allocation deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete allocation', error: err.message });
  }
};
