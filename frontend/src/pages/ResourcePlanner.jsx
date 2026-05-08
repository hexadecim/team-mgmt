import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import AllocationForm from '../components/AllocationForm';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  Chip,
  Typography,
  CircularProgress,
  TextField,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

const ResourcePlanner = () => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [warningModal, setWarningModal] = useState(null);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [selectedPractice, setSelectedPractice] = useState('');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [allowedPractices, setAllowedPractices] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(() => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    // Fiscal year Apr-Mar: if month < 3 (Jan-Mar), fiscal year started in previous year
    return month < 3 ? year - 1 : year;
  });

  const projectColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A9DFBF',
  ];

  useEffect(() => {
    fetchData();
    fetchAllowedPractices();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allocRes, empRes, projRes] = await Promise.all([
        apiClient.get('/allocations'),
        apiClient.get('/employees'),
        apiClient.get('/projects'),
      ]);
      setAllocations(allocRes.data);
      setEmployees(empRes.data);
      setProjects(projRes.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllowedPractices = async () => {
    try {
      const response = await apiClient.get('/auth/me/practices');
      setIsAdmin(response.data.isAdmin);
      setAllowedPractices(response.data.practices);
    } catch (err) {
      console.error('Failed to fetch allowed practices:', err);
      setAllowedPractices(null);
    }
  };

  const handleAddAllocation = () => {
    setEditingAllocation(null);
    setShowForm(true);
  };

  const handleEditAllocation = (allocation) => {
    setEditingAllocation(allocation);
    setShowForm(true);
  };

  const handleDeleteAllocation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this allocation?')) {
      return;
    }
    try {
      await apiClient.delete(`/allocations/${id}`);
      setMessage('Allocation deleted successfully');
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete allocation');
    }
  };

  const handleSubmit = async (formData, forceAllocate = false) => {
    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      const payload = forceAllocate ? { ...formData, forceAllocate: true } : formData;

      if (editingAllocation?.id) {
        await apiClient.put(`/allocations/${editingAllocation.id}`, payload);
        setMessage('Allocation updated successfully');
      } else {
        await apiClient.post('/allocations', payload);
        setMessage('Allocation added successfully');
      }

      setShowForm(false);
      setEditingAllocation(null);
      setWarningModal(null);
      setPendingFormData(null);
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      const errCode = err.response?.data?.code;
      const errData = err.response?.data;

      if (errCode === 'UTILIZATION_EXCEEDED' && !forceAllocate) {
        setPendingFormData(formData);
        setWarningModal(errData);
        setError('');
      } else {
        setError(errData?.message || 'Failed to save allocation');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceAllocate = () => {
    if (pendingFormData) {
      handleSubmit(pendingFormData, true);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAllocation(null);
  };

  const handleAddFromCell = (employeeId, monthDate) => {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const initialAllocation = {
      employee_id: employeeId,
      project_id: '',
      allocation_percent: 100,
      start_date: monthStart.toISOString().split('T')[0],
      end_date: monthEnd.toISOString().split('T')[0],
    };

    setEditingAllocation(initialAllocation);
    setShowForm(true);
  };

  const getPractices = () => {
    if (allowedPractices !== null) {
      return allowedPractices;
    }
    const empPractices = employees.map((e) => e.practice).filter(Boolean);
    const projPractices = projects.map((p) => p.practice).filter(Boolean);
    return [...new Set([...empPractices, ...projPractices])].sort();
  };

  const getFilteredEmployees = () => {
    let filtered = employees;

    // Filter by practice
    if (selectedPractice) {
      filtered = filtered.filter((emp) => emp.practice === selectedPractice);
    }

    // Filter by name (minimum 3 characters)
    if (employeeSearchQuery.length >= 3) {
      filtered = filtered.filter((emp) =>
        emp.name.toLowerCase().includes(employeeSearchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getFilteredProjects = () => {
    if (!selectedPractice) return projects;
    return projects.filter((proj) => proj.practice === selectedPractice);
  };

  const getFilteredAllocations = () => {
    if (!selectedPractice) return allocations;
    const filteredEmpIds = getFilteredEmployees().map((e) => e.id);
    // Filter by employee practice only - allows cross-practice project allocations to be visible
    return allocations.filter((alloc) => filteredEmpIds.includes(alloc.employee_id));
  };

  const getMonthsRange = () => {
    const months = [];
    // Fiscal year starts in April (month 3)
    for (let i = 0; i < 12; i++) {
      const date = new Date(selectedFiscalYear, 3 + i, 1); // month 3 = April
      months.push(date);
    }
    return months;
  };

  const getEmployeeMonthUtilization = (employeeId, monthDate) => {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const monthAllocations = getFilteredAllocations().filter((alloc) => {
      const allocStart = new Date(alloc.start_date);
      const allocEnd = new Date(alloc.end_date);
      return (
        alloc.employee_id === employeeId &&
        allocStart <= monthEnd &&
        allocEnd >= monthStart
      );
    });

    const totalPercent = monthAllocations.reduce((sum, alloc) => sum + alloc.allocation_percent, 0);
    return { total: totalPercent, allocations: monthAllocations };
  };

  const getColor = (projectId) => {
    return projectColors[projectId % projectColors.length];
  };

  const getAvailableFiscalYears = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const months = today.getMonth();
    const currentFY = months < 3 ? currentYear - 1 : currentYear;

    const years = [];
    // Show current year and next 2 years (no past years)
    for (let i = 0; i <= 2; i++) {
      years.push(currentFY + i);
    }
    return years.sort((a, b) => b - a); // Descending order
  };

  const practices = getPractices();
  const filteredEmployees = getFilteredEmployees();
  const months = getMonthsRange();

  if (loading) {
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading allocations...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ py: 3, px: 3, width: '100%', m: 0 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      {/* Toolbar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={handleAddAllocation} sx={{ height: 56 }}>
          + Add Allocation
        </Button>

        <FormControl sx={{ minWidth: 180, height: 56 }}>
          <InputLabel>Fiscal Year</InputLabel>
          <Select
            value={selectedFiscalYear}
            onChange={(e) => setSelectedFiscalYear(e.target.value)}
            label="Fiscal Year"
          >
            {getAvailableFiscalYears().map((year) => (
              <MenuItem key={year} value={year}>
                {year}-{String(year + 1).slice(-2)} (Apr-Mar)
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200, height: 56 }}>
          <InputLabel>Filter by Practice</InputLabel>
          <Select
            value={selectedPractice}
            onChange={(e) => setSelectedPractice(e.target.value)}
            label="Filter by Practice"
          >
            {isAdmin && <MenuItem value="">All Practices</MenuItem>}
            {practices.map((practice) => (
              <MenuItem key={practice} value={practice}>
                {practice}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          placeholder="Search employee (min 3 chars)"
          value={employeeSearchQuery}
          onChange={(e) => setEmployeeSearchQuery(e.target.value)}
          variant="outlined"
          sx={{
            minWidth: 250,
            height: 56,
            '& .MuiOutlinedInput-root': {
              height: 56,
            },
          }}
        />

        {(selectedPractice || employeeSearchQuery.length >= 3) && (
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            ({filteredEmployees.length} employees {selectedPractice && '- showing cross-practice allocations'})
          </Typography>
        )}
      </Box>

      {/* Allocation Form Dialog */}
      <Dialog open={showForm} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAllocation?.id ? 'Edit Allocation' : 'Add New Allocation'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <AllocationForm
            initialData={editingAllocation}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={submitting}
            filteredEmployees={selectedPractice ? filteredEmployees : null}
            filteredProjects={selectedPractice ? projects : null}
          />
        </DialogContent>
      </Dialog>

      {/* Calendar Table */}
      <TableContainer component={Paper} sx={{ width: '100%' }}>
        <Table stickyHeader sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
              <TableCell sx={{ fontWeight: 600, width: '150px', padding: '8px 4px' }}>Employee</TableCell>
              {months.map((month, idx) => (
                <TableCell
                  key={idx}
                  align="center"
                  sx={{ fontWeight: 600, width: `${(100 - 13) / months.length}%`, backgroundColor: '#f9fafb', padding: '8px 4px', fontSize: '0.875rem' }}
                >
                  {month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                <TableCell sx={{ fontWeight: 500, width: '150px', padding: '8px 4px', fontSize: '0.875rem' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.25 }}>
                      {employee.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem', display: 'block' }}>
                      {employee.designation}
                    </Typography>
                    {employee.practice && (
                      <Chip label={employee.practice} size="small" sx={{ mt: 0.25, height: '20px', fontSize: '0.7rem' }} />
                    )}
                  </Box>
                </TableCell>
                {months.map((month, idx) => {
                  const { total, allocations: monthAllocs } = getEmployeeMonthUtilization(employee.id, month);

                  return (
                    <TableCell
                      key={idx}
                      align="center"
                      sx={{ padding: '6px 4px', backgroundColor: '#f9fafb', verticalAlign: 'top', width: `${(100 - 13) / months.length}%` }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minHeight: 70 }}>
                        {monthAllocs.length > 0 ? (
                          <>
                            {monthAllocs.map((alloc, i) => (
                              <Box
                                key={i}
                                sx={{
                                  p: 0.5,
                                  borderRadius: 0.75,
                                  backgroundColor: getColor(alloc.project_id),
                                  color: '#ffffff',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: 0.25,
                                  '&:hover': { opacity: 0.9 },
                                }}
                                onClick={() => handleEditAllocation(alloc)}
                              >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Box sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{alloc.allocation_percent}%</Box>
                                  <Box sx={{ opacity: 0.9, fontSize: '0.6rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {alloc.project_name}
                                  </Box>
                                </Box>
                                <Button
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAllocation(alloc.id);
                                  }}
                                  sx={{
                                    color: '#ffffff',
                                    minWidth: 'auto',
                                    padding: '0px 2px',
                                    fontSize: '0.7rem',
                                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.2)' },
                                  }}
                                >
                                  ✕
                                </Button>
                              </Box>
                            ))}
                            <Box
                              sx={{
                                p: 0.5,
                                borderRadius: 0.75,
                                backgroundColor: total > 100 ? '#fee2e2' : '#dcfce7',
                                color: total > 100 ? '#991b1b' : '#166534',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                textAlign: 'center',
                              }}
                            >
                              T: {total}%
                            </Box>
                          </>
                        ) : (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleAddFromCell(employee.id, month)}
                            sx={{ color: '#1565c0', fontSize: '0.7rem', minHeight: 70, padding: '4px' }}
                          >
                            + Add
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Warning Modal */}
      <Dialog open={Boolean(warningModal)} onClose={() => setWarningModal(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#dc2626', fontWeight: 600 }}>
          ⚠️ Utilization Exceeds 100%
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 2, maxHeight: 300, overflowY: 'auto' }}>
            {warningModal?.exceedance?.map((item, idx) => (
              <Alert key={idx} severity="warning" sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.month}
                </Typography>
                <Typography variant="caption">
                  Current: {item.current}% + Requested: {item.requested}% = <strong>{item.total}%</strong>
                </Typography>
              </Alert>
            ))}
          </Box>
          <Typography variant="body2">
            This allocation would exceed 100% capacity. Do you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWarningModal(null)}>Cancel</Button>
          <Button
            onClick={handleForceAllocate}
            variant="contained"
            color="warning"
            disabled={submitting}
          >
            {submitting ? 'Processing...' : 'Allow 100%+'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourcePlanner;
