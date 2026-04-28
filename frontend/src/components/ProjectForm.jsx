import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosInstance';
import {
  Stack,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  CircularProgress,
  Box,
} from '@mui/material';

const ProjectForm = ({ initialData, onSubmit, onCancel, loading, practices = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    projectManagerId: '',
    startDate: '',
    endDate: '',
    practice: 'SSDD',
  });

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        clientName: initialData.client_name || '',
        projectManagerId: initialData.project_manager_id || '',
        startDate: initialData.start_date || '',
        endDate: initialData.end_date || '',
        practice: initialData.practice || 'SSDD',
      });
    }
  }, [initialData]);

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await apiClient.get('/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2.5}>
        <TextField
          fullWidth
          label="Project Name *"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter project name"
        />

        <TextField
          fullWidth
          label="Client Name *"
          name="clientName"
          value={formData.clientName}
          onChange={handleChange}
          required
          placeholder="Enter client name"
        />

        <FormControl fullWidth>
          <InputLabel>Project Manager</InputLabel>
          <Select
            name="projectManagerId"
            value={formData.projectManagerId}
            onChange={handleChange}
            label="Project Manager"
            disabled={employeesLoading}
          >
            <MenuItem value="">Select Project Manager</MenuItem>
            {employees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.name} - {emp.designation}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Start Date *"
          name="startDate"
          type="date"
          value={formData.startDate}
          onChange={handleChange}
          required
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          fullWidth
          label="End Date *"
          name="endDate"
          type="date"
          value={formData.endDate}
          onChange={handleChange}
          required
          InputLabelProps={{ shrink: true }}
        />

        {practices && practices.length > 0 ? (
          <FormControl fullWidth>
            <InputLabel>Practice</InputLabel>
            <Select
              name="practice"
              value={formData.practice}
              onChange={handleChange}
              label="Practice"
            >
              {practices.map((practice) => (
                <MenuItem key={practice.id} value={practice.name}>
                  {practice.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            fullWidth
            label="Practice"
            name="practice"
            value={formData.practice}
            onChange={handleChange}
            placeholder="e.g., SSDD, VSDD, ESDD"
          />
        )}

        <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            endIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Saving...' : initialData ? 'Update Project' : 'Add Project'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Stack>
    </form>
  );
};

export default ProjectForm;
