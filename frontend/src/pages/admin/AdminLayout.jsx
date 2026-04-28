import { useLocation, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const AdminLayout = ({ children }) => {
  const location = useLocation();

  const tabs = [
    { label: 'Users', path: '/admin/users' },
    { label: 'Roles', path: '/admin/roles' },
    { label: 'Practices', path: '/admin/practices' },
  ];

  const currentPath = location.pathname;
  const currentTabIndex = tabs.findIndex((tab) => tab.path === currentPath);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f3f4f6' }}>
      {/* Header */}
      <Paper sx={{ mb: 3, boxShadow: 'none', borderRadius: 0 }}>
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Admin Panel
            </Typography>
            <Button
              component={Link}
              to="/"
              startIcon={<ArrowBackIcon />}
              variant="text"
              size="small"
            >
              Back to Dashboard
            </Button>
          </Box>

          {/* Tabs */}
          <Tabs value={currentTabIndex >= 0 ? currentTabIndex : 0}>
            {tabs.map((tab, idx) => (
              <Tab
                key={tab.path}
                label={tab.label}
                component={Link}
                to={tab.path}
                sx={{ textTransform: 'none' }}
              />
            ))}
          </Tabs>
        </Container>
      </Paper>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default AdminLayout;
