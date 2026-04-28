const Project = require('../models/Project');

exports.getAll = async (req, res) => {
  try {
    const projects = await Project.getAll(req.user.practices);
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ message: 'Failed to fetch projects', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.getById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch project', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, clientName, projectManagerId, startDate, endDate, practice = 'SSDD' } = req.body;

    if (!name || !clientName || !startDate || !endDate) {
      return res.status(400).json({ message: 'Project name, client name, start date, and end date are required' });
    }

    const project = await Project.create(name, clientName, projectManagerId, startDate, endDate, practice);
    res.status(201).json({ message: 'Project created successfully', project });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ message: 'Failed to create project', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, clientName, projectManagerId, startDate, endDate, practice = 'SSDD' } = req.body;

    if (!name || !clientName || !startDate || !endDate) {
      return res.status(400).json({ message: 'Project name, client name, start date, and end date are required' });
    }

    const project = await Project.update(id, name, clientName, projectManagerId, startDate, endDate, practice);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project updated successfully', project });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update project', error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.delete(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete project', error: err.message });
  }
};
