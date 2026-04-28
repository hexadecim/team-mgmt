import React, { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiClient from '../api/axiosInstance';
import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material';

const AllocationForm = ({ initialData, onSubmit, onCancel, loading, filteredEmployees = null, filteredProjects = null }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    projectId: '',
    allocationPercent: 100,
    startDate: null,
    endDate: null,
  });

  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        employeeId: initialData.employee_id || '',
        projectId: initialData.project_id || '',
        allocationPercent: initialData.allocation_percent || 100,
        startDate: initialData.start_date ? dayjs(initialData.start_date) : null,
        endDate: initialData.end_date ? dayjs(initialData.end_date) : null,
      });
    }
  }, [initialData]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [empRes, projRes] = await Promise.all([
        apiClient.get('/employees'),
        apiClient.get('/projects'),
      ]);
      setEmployees(empRes.data);
      setProjects(projRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'allocationPercent' ? parseInt(value) : value,
    }));
  };

  const handleSliderChange = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      allocationPercent: newValue,
    }));
  };

  const handleDateChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      employeeId: formData.employeeId,
      projectId: formData.projectId,
      allocationPercent: formData.allocationPercent,
      startDate: formData.startDate ? formData.startDate.format('YYYY-MM-DD') : '',
      endDate: formData.endDate ? formData.endDate.format('YYYY-MM-DD') : '',
    };
    onSubmit(submitData);
  };

  const employeeList = filteredEmployees || employees;
  const projectList = filteredProjects || projects;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Employee *</InputLabel>
            <Select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              required
              disabled={loadingData}
              label="Employee *"
            >
              <MenuItem value="">Select Employee</MenuItem>
              {employeeList.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name} - {emp.designation}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Project *</InputLabel>
            <Select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              required
              disabled={loadingData}
              label="Project *"
            >
              <MenuItem value="">Select Project</MenuItem>
              {projectList.map((proj) => (
                <MenuItem key={proj.id} value={proj.id}>
                  {proj.name} ({proj.client_name})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Allocation Percentage *
              </Typography>
              <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 600 }}>
                {formData.allocationPercent}%
              </Typography>
            </Box>
            <Slider
              value={formData.allocationPercent}
              onChange={handleSliderChange}
              min={0}
              max={100}
              step={5}
              marks={[
                { value: 0, label: '0%' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date *"
                value={formData.startDate}
                onChange={(value) => handleDateChange('startDate', value)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date *"
                value={formData.endDate}
                onChange={(value) => handleDateChange('endDate', value)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              endIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Saving...' : initialData ? 'Update Allocation' : 'Add Allocation'}
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
    </LocalizationProvider>
  );
};

export default AllocationForm;
