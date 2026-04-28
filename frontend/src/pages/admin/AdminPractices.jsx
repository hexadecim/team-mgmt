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
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const AdminPractices = () => {
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPractice, setNewPractice] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchPractices();
  }, []);

  const fetchPractices = async () => {
    try {
      const response = await apiClient.get('/admin/practices');
      setPractices(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch practices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newPractice.trim()) return;

    setAdding(true);
    try {
      await apiClient.post('/admin/practices', { name: newPractice });
      setNewPractice('');
      fetchPractices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add practice');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/admin/practices/${id}`);
      fetchPractices();
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete practice');
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Add Practice Form */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Enter practice name"
          value={newPractice}
          onChange={(e) => setNewPractice(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={adding || !newPractice.trim()}
        >
          {adding ? 'Adding...' : '+ Add'}
        </Button>
      </Paper>

      {/* Practices List */}
      {practices.length === 0 ? (
        <Typography sx={{ color: '#6b7280' }}>No practices yet</Typography>
      ) : (
        <Paper>
          <List>
            {practices.map((p, idx) => (
              <ListItem
                key={p.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => setDeleteConfirm(p)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
                sx={{ borderBottom: idx < practices.length - 1 ? '1px solid #e5e7eb' : 'none' }}
              >
                <ListItemText primary={p.name} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Practice</DialogTitle>
        <DialogContent>
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This will remove the practice from all roles.
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

export default AdminPractices;
