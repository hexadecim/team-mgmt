import React, { useState, useEffect } from 'react';
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

const EmployeeForm = ({ initialData, onSubmit, onCancel, loading, practices = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    primarySkill: '',
    secondarySkill: '',
    city: '',
    practice: 'SSDD',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        designation: initialData.designation || '',
        primarySkill: initialData.primary_skill || '',
        secondarySkill: initialData.secondary_skill || '',
        city: initialData.city || '',
        practice: initialData.practice || 'SSDD',
      });
    }
  }, [initialData]);

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
          label="Full Name *"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter full name"
        />

        <TextField
          fullWidth
          label="Designation *"
          name="designation"
          value={formData.designation}
          onChange={handleChange}
          required
          placeholder="e.g., Senior Developer, Manager"
        />

        <TextField
          fullWidth
          label="Primary Skill"
          name="primarySkill"
          value={formData.primarySkill}
          onChange={handleChange}
          placeholder="e.g., React, Python, JavaScript"
        />

        <TextField
          fullWidth
          label="Secondary Skill"
          name="secondarySkill"
          value={formData.secondarySkill}
          onChange={handleChange}
          placeholder="e.g., Node.js, SQL, Docker"
        />

        <TextField
          fullWidth
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="e.g., New York, San Francisco, Bangalore"
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
            {loading ? 'Saving...' : initialData ? 'Update Employee' : 'Add Employee'}
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

export default EmployeeForm;
