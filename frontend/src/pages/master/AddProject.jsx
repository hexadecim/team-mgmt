import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import ProjectForm from '../../components/ProjectForm';
import {
  Box,
  Container,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

const AddProject = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [practices, setPractices] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPractice, setSelectedPractice] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
    fetchPractices();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/projects');
      setProjects(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch projects');
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

  const handleAddProject = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDeleteProject = async (id) => {
    try {
      await apiClient.delete(`/projects/${id}`);
      setMessage('Project deleted successfully');
      setDeleteConfirm(null);
      fetchProjects();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      if (editingProject) {
        await apiClient.put(`/projects/${editingProject.id}`, formData);
        setMessage('Project updated successfully');
      } else {
        await apiClient.post('/projects', formData);
        setMessage('Project added successfully');
      }

      setShowForm(false);
      setEditingProject(null);
      fetchProjects();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getFilteredProjects = () => {
    let filtered = projects;

    // Filter by search query
    if (searchQuery && searchQuery.length > 0) {
      filtered = filtered.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by practice
    if (selectedPractice) {
      filtered = filtered.filter((project) => project.practice === selectedPractice);
    }

    return filtered;
  };

  const filteredProjects = getFilteredProjects();

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 3fr' }, gap: 3 }}>
        {/* Left Panel - Project List */}
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Projects
          </Typography>

          {/* Search and Filter Inputs */}
          <Stack spacing={2} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by project name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
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
            ) : projects.length === 0 ? (
              <Typography sx={{ color: '#6b7280', textAlign: 'center', py: 2 }}>
                No projects yet. Add one to get started!
              </Typography>
            ) : filteredProjects.length === 0 ? (
              <Typography sx={{ color: '#6b7280', textAlign: 'center', py: 2 }}>
                No projects match your search.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {filteredProjects.map((project) => (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    onEdit={() => handleEditProject(project)}
                    onDelete={() => setDeleteConfirm(project)}
                    formatDate={formatDate}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Paper>

        {/* Right Panel - Forms */}
        <Paper sx={{ p: 2 }}>
          {showForm ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </Typography>
              <ProjectForm
                initialData={editingProject}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={submitting}
                practices={practices}
              />
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ color: '#6b7280', mb: 3 }}>
                Select a project to edit or add a new one
              </Typography>
              <Button variant="contained" onClick={handleAddProject}>
                + Add New Project
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteProject(deleteConfirm.id)}
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

function ProjectListItem({ project, onEdit, onDelete, formatDate }) {
  return (
    <Paper sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {project.name}
        </Typography>
        <Typography variant="caption" sx={{ color: '#6b7280' }}>
          {project.client_name}
        </Typography>
        <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mt: 0.5 }}>
          {formatDate(project.start_date)} to {formatDate(project.end_date)}
        </Typography>
        <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {project.project_manager_name && (
            <Typography variant="caption" sx={{ color: '#1565c0' }}>
              PM: {project.project_manager_name}
            </Typography>
          )}
          {project.practice && <Chip label={project.practice} size="small" />}
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

export default AddProject;
