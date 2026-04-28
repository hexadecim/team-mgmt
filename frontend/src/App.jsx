import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import DashboardAndReports from './pages/DashboardAndReports';
import AddEmployee from './pages/master/AddEmployee';
import AddProject from './pages/master/AddProject';
import ResourcePlanner from './pages/ResourcePlanner';
import AdminLayout from './pages/admin/AdminLayout';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRoles from './pages/admin/AdminRoles';
import AdminPractices from './pages/admin/AdminPractices';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardAndReports />} />
            <Route path="employees" element={<AddEmployee />} />
            <Route path="projects" element={<AddProject />} />
            <Route path="resource-planner" element={<ResourcePlanner />} />
          </Route>
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <AdminLayout>
                    <Outlet />
                  </AdminLayout>
                </AdminRoute>
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/admin/users" />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="practices" element={<AdminPractices />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
