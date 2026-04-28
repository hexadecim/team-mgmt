const User = require('../models/User');
const Role = require('../models/Role');
const Practice = require('../models/Practice');

// ============ USER MANAGEMENT ============

exports.listUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, fullName, isAdmin, roleId } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'Email, password, and full name are required' });
    }

    const user = await User.create(email, password, fullName, isAdmin || false, roleId || null);
    res.status(201).json(user);
  } catch (err) {
    if (err.constraint === 'users_email_key') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, fullName, isAdmin, roleId, password } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ message: 'Email and full name are required' });
    }

    // Update main user fields
    let user = await User.update(id, { email, fullName, isAdmin: isAdmin || false, roleId: roleId || null });

    // Update password if provided
    if (password) {
      await User.updatePassword(id, password);
    }

    // Fetch updated user with role info
    user = await User.findById(id);
    res.json(user);
  } catch (err) {
    if (err.constraint === 'users_email_key') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error('Error updating user:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.delete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============ ROLE MANAGEMENT ============

exports.listRoles = async (req, res) => {
  try {
    const roles = await Role.getAll();
    res.json(roles);
  } catch (err) {
    console.error('Error listing roles:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name, practiceIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const role = await Role.create(name);

    // Assign practices if provided
    if (practiceIds && practiceIds.length > 0) {
      await Role.setPractices(role.id, practiceIds);
      return res.status(201).json(await Role.getById(role.id));
    }

    res.status(201).json(role);
  } catch (err) {
    if (err.constraint === 'roles_name_key') {
      return res.status(400).json({ message: 'Role name already exists' });
    }
    console.error('Error creating role:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, practiceIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    // Update role name
    await Role.update(id, name);

    // Update practices if provided
    if (practiceIds) {
      await Role.setPractices(id, practiceIds);
    }

    const role = await Role.getById(id);
    res.json(role);
  } catch (err) {
    if (err.constraint === 'roles_name_key') {
      return res.status(400).json({ message: 'Role name already exists' });
    }
    console.error('Error updating role:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    await Role.delete(id);
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Error deleting role:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============ PRACTICE MANAGEMENT ============

exports.listPractices = async (req, res) => {
  try {
    const practices = await Practice.getAll();
    res.json(practices);
  } catch (err) {
    console.error('Error listing practices:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createPractice = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Practice name is required' });
    }

    const practice = await Practice.create(name);
    res.status(201).json(practice);
  } catch (err) {
    if (err.constraint === 'practices_name_key') {
      return res.status(400).json({ message: 'Practice name already exists' });
    }
    console.error('Error creating practice:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deletePractice = async (req, res) => {
  try {
    const { id } = req.params;
    await Practice.delete(id);
    res.json({ message: 'Practice deleted successfully' });
  } catch (err) {
    console.error('Error deleting practice:', err);
    res.status(500).json({ error: err.message });
  }
};
