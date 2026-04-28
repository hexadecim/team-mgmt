import React, { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from '../components/Navbar';
import Sidebar, { DRAWER_WIDTH } from '../components/Sidebar';

const Home = () => {
  const location = useLocation();

  const getModuleName = useMemo(() => {
    const path = location.pathname;

    if (path === '/' || path === '') {
      return 'Dashboard';
    } else if (path === '/employees') {
      return 'Employee Management';
    } else if (path === '/projects') {
      return 'Project Management';
    } else if (path === '/resource-planner') {
      return 'Team Planner';
    } else if (path.startsWith('/admin')) {
      return 'Admin';
    }

    return 'Dashboard';
  }, [location.pathname]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <Navbar moduleName={getModuleName} />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            marginTop: '64px',
            backgroundColor: '#f9fafb',
            width: '100%',
            p: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
