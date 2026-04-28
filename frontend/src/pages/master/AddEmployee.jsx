import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import EmployeeForm from '../../components/EmployeeForm';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Upload as UploadIcon } from '@mui/icons-material';

const AddEmployee = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPractice, setSelectedPractice] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('add');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [practices, setPractices] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchPractices();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/employees');
      setEmployees(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch employees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPractices = async () => {
    try {
      const response = await apiClient.get('/practices');
      setPractices(response.data);
    } catch (err) {
      console.error('Failed to fetch practices:', err);
    }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must contain header and data');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['full name', 'designation'];
    const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));

    if (!hasRequiredHeaders) throw new Error('CSV must contain "Full Name" and "Designation" columns');

    const employees = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;

      const values = lines[i].split(',').map(v => v.trim());
      employees.push({
        name: values[headers.indexOf('full name')] || '',
        designation: values[headers.indexOf('designation')] || '',
        primarySkill: values[headers.indexOf('primary skill')] || '',
        secondarySkill: values[headers.indexOf('secondary skill')] || '',
        city: values[headers.indexOf('city')] || '',
      });
    }

    return employees;
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setMessage('');
      setCsvLoading(true);

      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) throw new Error('No valid employees found in CSV');
      setCsvPreview(parsed);
    } catch (err) {
      setError(err.message);
      setCsvPreview([]);
    } finally {
      setCsvLoading(false);
      e.target.value = '';
    }
  };

  const handleCSVSubmit = async () => {
    if (csvPreview.length === 0) {
      setError('Please select a CSV file');
      return;
    }

    try {
      setCsvLoading(true);
      setError('');
      setMessage('');

      const response = await apiClient.post('/employees/bulk/create', { employees: csvPreview });
      setMessage(`${response.data.createdEmployees.length} employees added successfully!`);
      setCsvPreview([]);
      fetchEmployees();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload CSV');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      if (editingEmployee) {
        await apiClient.put(`/employees/${editingEmployee.id}`, formData);
        setMessage('Employee updated successfully');
      } else {
        await apiClient.post('/employees', formData);
        setMessage('Employee added successfully');
      }

      setEditingEmployee(null);
      setActiveTab('list');
      fetchEmployees();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await apiClient.delete(`/employees/${id}`);
      setMessage('Employee deleted successfully');
      setDeleteConfirm(null);
      fetchEmployees();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const getFilteredEmployees = () => {
    let filtered = employees;

    // Filter by practice first (always apply if selected)
    if (selectedPractice) {
      filtered = filtered.filter((emp) => emp.practice === selectedPractice);
    }

    // Then apply search query filter (if user typed 3+ characters)
    if (searchQuery.length >= 3) {
      filtered = filtered.filter((emp) =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredEmployees = getFilteredEmployees();

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 3fr' }, gap: 3 }}>
        {/* Left Panel - Employee List */}
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Employees
          </Typography>

          <Stack spacing={2} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type at least 3 characters"
            />

            <FormControl fullWidth size="small">
              <InputLabel>Filter by Practice</InputLabel>
              <Select
                value={selectedPractice}
                label="Filter by Practice"
                onChange={(e) => setSelectedPractice(e.target.value)}
              >
                <MenuItem value="">All Practices</MenuItem>
                {practices.map((practice) => (
                  <MenuItem key={practice.id} value={practice.name}>
                    {practice.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : employees.length === 0 ? (
              <Typography sx={{ color: '#6b7280', textAlign: 'center', py: 2 }}>
                No employees yet
              </Typography>
            ) : searchQuery.length > 0 && searchQuery.length < 3 ? (
              <Typography sx={{ color: '#6b7280', textAlign: 'center', py: 2 }}>
                Type at least 3 characters to search
              </Typography>
            ) : filteredEmployees.length === 0 ? (
              <Typography sx={{ color: '#6b7280', textAlign: 'center', py: 2 }}>
                No employees found
              </Typography>
            ) : (
              <Stack spacing={1}>
                {filteredEmployees.map((emp) => (
                  <EmployeeListItem
                    key={emp.id}
                    emp={emp}
                    onEdit={() => {
                      setEditingEmployee(emp);
                      setActiveTab('add');
                    }}
                    onDelete={() => setDeleteConfirm(emp)}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Paper>

        {/* Right Panel - Forms */}
        <Paper sx={{ p: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
            <Tab label="Add Employee" value="add" />
            <Tab label="Bulk Upload" value="upload" />
          </Tabs>

          {activeTab === 'add' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </Typography>
              <EmployeeForm
                initialData={editingEmployee}
                onSubmit={handleSubmit}
                onCancel={() => setEditingEmployee(null)}
                loading={submitting}
                practices={practices}
              />
            </Box>
          )}

          {activeTab === 'upload' && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  📁 Upload CSV File
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Columns: Full Name, Designation, Primary Skill, Secondary Skill, City
                </Alert>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  disabled={csvLoading}
                  fullWidth
                >
                  Choose CSV File
                  <input
                    hidden
                    accept=".csv"
                    type="file"
                    onChange={handleCSVUpload}
                  />
                </Button>
              </Box>

              {csvPreview.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Preview ({csvPreview.length} employees)
                  </Typography>
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Full Name</TableCell>
                          <TableCell>Designation</TableCell>
                          <TableCell>City</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {csvPreview.map((emp, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{emp.name}</TableCell>
                            <TableCell>{emp.designation}</TableCell>
                            <TableCell>{emp.city || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleCSVSubmit}
                    disabled={csvLoading}
                    sx={{ mt: 2 }}
                  >
                    {csvLoading ? 'Uploading...' : `Upload ${csvPreview.length} Employee(s)`}
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Employee</DialogTitle>
        <DialogContent>
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteEmployee(deleteConfirm.id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

function EmployeeListItem({ emp, onEdit, onDelete }) {
  return (
    <Paper sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {emp.name}
        </Typography>
        <Typography variant="caption" sx={{ color: '#6b7280' }}>
          {emp.designation}
        </Typography>
        <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {emp.city && <Typography variant="caption">{emp.city}</Typography>}
          {emp.practice && <Chip label={emp.practice} size="small" />}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton size="small" color="primary" onClick={onEdit}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={onDelete}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
}

export default AddEmployee;
