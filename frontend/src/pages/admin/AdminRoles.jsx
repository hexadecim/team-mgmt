import { useEffect, useState } from 'react';
import apiClient from '../../api/axiosInstance';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Alert,
  CircularProgress,
  Stack,
  Typography,
  Chip,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

const AdminRoles = () => {
  const [roles, setRoles] = useState([]);
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    practiceIds: [],
  });

  useEffect(() => {
    fetchRoles();
    fetchPractices();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get('/admin/roles');
      setRoles(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch roles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPractices = async () => {
    try {
      const response = await apiClient.get('/admin/practices');
      setPractices(response.data);
    } catch (err) {
      console.error('Failed to fetch practices:', err);
    }
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({ name: '', practiceIds: [] });
    setShowForm(true);
  };

  const handleEditClick = (r) => {
    setEditingId(r.id);
    setFormData({
      name: r.name,
      practiceIds: r.practices.map(p => p.id),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/admin/roles/${editingId}`, formData);
      } else {
        await apiClient.post('/admin/roles', formData);
      }
      fetchRoles();
      setShowForm(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save role');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/admin/roles/${id}`);
      fetchRoles();
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete role');
    }
  };

  const togglePractice = (practiceId) => {
    setFormData({
      ...formData,
      practiceIds: formData.practiceIds.includes(practiceId)
        ? formData.practiceIds.filter(id => id !== practiceId)
        : [...formData.practiceIds, practiceId]
    });
  };

  if (loading) return <CircularProgress />;

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Button variant="contained" onClick={handleAddClick}>
          + Add Role
        </Button>
      </Box>

      {/* Role Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Role' : 'Add Role'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Role Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Assign Practices:
            </Typography>
            <FormGroup row>
              {practices.map((p) => (
                <FormControlLabel
                  key={p.id}
                  control={
                    <Checkbox
                      checked={formData.practiceIds.includes(p.id)}
                      onChange={() => togglePractice(p.id)}
                    />
                  }
                  label={p.name}
                  sx={{ flex: '0 1 calc(50% - 8px)', mr: 1 }}
                />
              ))}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Roles List */}
      <Stack spacing={2}>
        {roles.map((r) => (
          <Paper key={r.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {r.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {r.practices && r.practices.length > 0 ? (
                  r.practices.map((p) => (
                    <Chip key={p.id} label={p.name} size="small" />
                  ))
                ) : (
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                    No practices assigned
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleEditClick(r)}
                variant="outlined"
              >
                Edit
              </Button>
              <Button
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteConfirm(r)}
                color="error"
                variant="outlined"
              >
                Delete
              </Button>
            </Box>
          </Paper>
        ))}
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm?.id)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminRoles;
