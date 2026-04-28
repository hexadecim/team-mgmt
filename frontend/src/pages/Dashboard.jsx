import React, { useEffect, useState } from 'react';
import apiClient from '../api/axiosInstance';

const Dashboard = () => {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, projRes] = await Promise.all([
          apiClient.get('/employees'),
          apiClient.get('/projects'),
        ]);

        setEmployeeCount(empRes.data.length);
        setProjectCount(projRes.data.length);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded shadow">
          <h2 className="text-gray-600 font-semibold mb-2">Total Employees</h2>
          <p className="text-4xl font-bold text-blue-600">{employeeCount}</p>
        </div>

        <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded shadow">
          <h2 className="text-gray-600 font-semibold mb-2">Total Projects</h2>
          <p className="text-4xl font-bold text-green-600">{projectCount}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
