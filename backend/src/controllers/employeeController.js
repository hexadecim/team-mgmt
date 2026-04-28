const Employee = require('../models/Employee');

exports.getAll = async (req, res) => {
  try {
    const employees = await Employee.getAll(req.user.practices);
    res.json(employees);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ message: 'Failed to fetch employees', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.getById(id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch employee', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, designation, primarySkill, secondarySkill, city, practice = 'SSDD' } = req.body;

    if (!name || !designation) {
      return res.status(400).json({ message: 'Name and designation are required' });
    }

    const employee = await Employee.create(name, designation, primarySkill, secondarySkill, city, practice);
    res.status(201).json({ message: 'Employee created successfully', employee });
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(500).json({ message: 'Failed to create employee', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, designation, primarySkill, secondarySkill, city, practice = 'SSDD' } = req.body;

    if (!name || !designation) {
      return res.status(400).json({ message: 'Name and designation are required' });
    }

    const employee = await Employee.update(id, name, designation, primarySkill, secondarySkill, city, practice);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee updated successfully', employee });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update employee', error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.delete(id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete employee', error: err.message });
  }
};

exports.bulkCreate = async (req, res) => {
  try {
    const { employees } = req.body;

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ message: 'Employees array is required' });
    }

    const createdEmployees = [];
    const errors = [];

    for (let i = 0; i < employees.length; i++) {
      try {
        const { name, designation, primarySkill, secondarySkill, city, practice = 'SSDD' } = employees[i];

        if (!name || !designation) {
          errors.push({ row: i + 1, message: 'Name and designation are required' });
          continue;
        }

        const employee = await Employee.create(name, designation, primarySkill, secondarySkill, city, practice);
        createdEmployees.push(employee);
      } catch (err) {
        errors.push({ row: i + 1, message: err.message });
      }
    }

    res.status(201).json({
      message: `Created ${createdEmployees.length} employees${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      createdEmployees,
      errors: errors.length > 0 ? errors : null
    });
  } catch (err) {
    console.error('Error bulk creating employees:', err);
    res.status(500).json({ message: 'Failed to bulk create employees', error: err.message });
  }
};
