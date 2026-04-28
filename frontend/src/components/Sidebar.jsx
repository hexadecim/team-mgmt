import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  EventNote as EventNoteIcon,
  People as PeopleIcon,
  Folder as FolderIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    { label: 'Dashboard', path: '/', icon: DashboardIcon },
    { label: 'Team Planner', path: '/resource-planner', icon: EventNoteIcon },
    { label: 'Employee Management', path: '/employees', icon: PeopleIcon },
    { label: 'Project Management', path: '/projects', icon: FolderIcon },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          marginTop: '64px',
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <List disablePadding>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <ListItemButton
                key={item.path}
                onClick={() => navigate(item.path)}
                selected={isActive(item.path)}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(21, 101, 192, 0.2)',
                    color: '#42a5f5',
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'rgba(21, 101, 192, 0.3)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>

        {user?.isAdmin && (
          <>
            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            <List disablePadding>
              <ListItemButton
                onClick={() => navigate('/admin/users')}
                selected={location.pathname.startsWith('/admin')}
                sx={{
                  borderRadius: 1,
                  backgroundColor: location.pathname.startsWith('/admin')
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'transparent',
                  color: location.pathname.startsWith('/admin') ? '#fbbf24' : 'inherit',
                  '&:hover': {
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  <AdminPanelSettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Admin" />
              </ListItemButton>
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
export { DRAWER_WIDTH };
