import React, { useEffect, useState } from 'react';
import apiClient from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { BarChart } from '@mui/x-charts/BarChart';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
} from '@mui/material';

const DashboardAndReports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [employeeCount, setEmployeeCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [projects, setProjects] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBenchData, setSelectedBenchData] = useState(null);
  const [selectedUtilizationData, setSelectedUtilizationData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPractice, setSelectedPractice] = useState('');
  const [allowedPractices, setAllowedPractices] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchData();
    fetchAllowedPractices();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, projRes, allocRes] = await Promise.all([
        apiClient.get('/employees'),
        apiClient.get('/projects'),
        apiClient.get('/allocations'),
      ]);
      setEmployeeCount(empRes.data.length);
      setProjectCount(projRes.data.length);
      setProjects(projRes.data);
      setAllocations(allocRes.data);
      setEmployees(empRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
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

  const getMonthsRange = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push(date);
    }
    return months;
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
    if (!selectedPractice) return employees;
    return employees.filter((emp) => emp.practice === selectedPractice);
  };

  const getFilteredProjects = () => {
    if (!selectedPractice) return projects;
    return projects.filter((proj) => proj.practice === selectedPractice);
  };

  const getFilteredAllocations = () => {
    if (!selectedPractice) return allocations;
    const filteredEmpIds = getFilteredEmployees().map((e) => e.id);
    const filteredProjIds = getFilteredProjects().map((p) => p.id);
    return allocations.filter(
      (alloc) => filteredEmpIds.includes(alloc.employee_id) && filteredProjIds.includes(alloc.project_id)
    );
  };

  const practices = getPractices();
  const filteredEmployees = getFilteredEmployees();
  const filteredProjects = getFilteredProjects();
  const filteredAllocations = getFilteredAllocations();

  const getAverageMonthlyUtilization = () => {
    const months = getMonthsRange();
    return months.map((month) => {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      let totalUtilization = 0;

      filteredEmployees.forEach((emp) => {
        const empAllocations = filteredAllocations.filter((alloc) => {
          if (alloc.employee_id !== emp.id) return false;
          const allocStart = new Date(alloc.start_date);
          const allocEnd = new Date(alloc.end_date);
          return allocStart <= monthEnd && allocEnd >= monthStart;
        });
        const empUtilization = empAllocations.reduce((sum, alloc) => sum + alloc.allocation_percent, 0);
        totalUtilization += empUtilization;
      });

      const average = filteredEmployees.length > 0 ? Math.round((totalUtilization / filteredEmployees.length) * 100) / 100 : 0;
      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        average,
      };
    });
  };

  const getEmployeeUtilizationForMonth = (monthDate) => {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const employeeData = filteredEmployees.map((emp) => {
      const empAllocations = filteredAllocations.filter((alloc) => {
        if (alloc.employee_id !== emp.id) return false;
        const allocStart = new Date(alloc.start_date);
        const allocEnd = new Date(alloc.end_date);
        return allocStart <= monthEnd && allocEnd >= monthStart;
      });

      const utilization = empAllocations.reduce((sum, alloc) => sum + alloc.allocation_percent, 0);

      // Get project details for this employee's allocations
      const projectDetails = empAllocations.map((alloc) => {
        const project = filteredProjects.find((p) => p.id === alloc.project_id);
        return {
          project_name: project?.name || 'Unknown Project',
          allocation_percent: alloc.allocation_percent,
        };
      });

      return {
        ...emp,
        utilization: Math.min(utilization, 100),
        totalUtilization: utilization,
        projectDetails,
      };
    });

    // Sort by utilization (highest first)
    return employeeData.sort((a, b) => b.utilization - a.utilization);
  };

  const getBenchData = () => {
    const months = getMonthsRange();
    return months.map((month) => {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      // Calculate FTE availability for each employee
      const employeeUtilization = filteredEmployees.map((emp) => {
        const empAllocations = filteredAllocations.filter((alloc) => {
          if (alloc.employee_id !== emp.id) return false;
          const allocStart = new Date(alloc.start_date);
          const allocEnd = new Date(alloc.end_date);
          return allocStart <= monthEnd && allocEnd >= monthStart;
        });

        const utilization = empAllocations.reduce((sum, alloc) => sum + alloc.allocation_percent, 0);
        const availability = Math.max(0, 100 - utilization); // FTE% available

        return {
          ...emp,
          utilization,
          availability,
        };
      });

      // Calculate total FTE capacity and available FTE
      const totalFTECapacity = filteredEmployees.length; // Each employee = 1 FTE
      const totalAvailableFTE = employeeUtilization.reduce((sum, emp) => sum + (emp.availability / 100), 0);
      const availabilityPercent = totalFTECapacity > 0
        ? Math.round((totalAvailableFTE / totalFTECapacity) * 100)
        : 0;

      // Filter employees with available capacity (> 0%)
      const benchEmployees = employeeUtilization.filter((emp) => emp.availability > 0);

      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        benchCount: benchEmployees.length,
        availabilityPercent,
        benchEmployees,
        totalAvailableFTE,
      };
    });
  };

  const chartData = getAverageMonthlyUtilization();
  const benchData = getBenchData();
  const averageUtilization = chartData.length > 0
    ? Math.round((chartData.reduce((sum, item) => sum + item.average, 0) / chartData.length) * 100) / 100
    : 0;

  const getUtilizationColor = (value) => {
    if (value > 70) return '#15803d';
    if (value >= 50) return '#86efac';
    return '#fbbf24';
  };

  const getBenchColor = (availabilityPercent) => {
    if (availabilityPercent > 50) return '#ef4444';
    if (availabilityPercent >= 10) return '#f59e0b';
    return '#10b981';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Practice Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Practice</InputLabel>
          <Select
            value={selectedPractice}
            onChange={(e) => {
              setSelectedPractice(e.target.value);
              setSelectedBenchData(null);
              setSelectedUtilizationData(null);
              setSelectedProject(null);
            }}
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
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" value="overview" />
          <Tab label="Utilization Report" value="utilization" />
          <Tab label="Bench Report" value="bench" />
          <Tab label="Project Allocation" value="projectAllocation" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Employees
                  </Typography>
                  <Typography variant="h5">{filteredEmployees.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Projects
                  </Typography>
                  <Typography variant="h5">{filteredProjects.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Allocations
                  </Typography>
                  <Typography variant="h5">{filteredAllocations.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Utilization
                  </Typography>
                  <Typography variant="h5">{averageUtilization}%</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Capacity Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Capacity
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Average Utilization</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {averageUtilization}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(averageUtilization, 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Utilization Report Tab */}
      {activeTab === 'utilization' && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Utilization Trend
              </Typography>
              {chartData.length > 0 && (
                <Box
                  sx={{ width: '100%', height: 350, mt: 2, cursor: 'pointer' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const barWidth = rect.width / chartData.length;
                    const barIndex = Math.floor(x / barWidth);

                    if (barIndex >= 0 && barIndex < chartData.length) {
                      const months = getMonthsRange();
                      setSelectedUtilizationData({
                        month: chartData[barIndex].month,
                        average: chartData[barIndex].average,
                        monthDate: months[barIndex],
                        employees: getEmployeeUtilizationForMonth(months[barIndex]),
                      });
                    }
                  }}
                >
                  <BarChart
                    dataset={chartData}
                    xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
                    series={[
                      {
                        dataKey: 'average',
                        label: 'Utilization %',
                        color: '#1565c0',
                      },
                    ]}
                    margin={{ top: 10, bottom: 30, left: 60, right: 10 }}
                    slotProps={{ legend: { hidden: false } }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>

          {selectedUtilizationData && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      Employee Utilization — {selectedUtilizationData.month}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Average Utilization: <strong>{selectedUtilizationData.average}%</strong>
                    </Typography>
                  </Box>
                  <Button size="small" onClick={() => setSelectedUtilizationData(null)}>
                    Close
                  </Button>
                </Box>
                {selectedUtilizationData.employees.length > 0 ? (
                  <TableContainer sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Utilization</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Allocated Projects</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedUtilizationData.employees.map((emp) => (
                          <TableRow key={emp.id} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                            <TableCell sx={{ fontWeight: 500 }}>{emp.name}</TableCell>
                            <TableCell>{emp.designation}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <Box sx={{ width: 100 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(emp.utilization, 100)}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      backgroundColor: '#e5e7eb',
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: emp.totalUtilization > 100 ? '#ef4444' : '#1565c0',
                                      },
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2" sx={{ minWidth: 45 }}>
                                  {emp.utilization}%
                                </Typography>
                                {emp.totalUtilization > 100 && (
                                  <Chip
                                    label="Over-allocated"
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {emp.projectDetails.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  {emp.projectDetails.map((proj, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                      <Typography variant="body2">{proj.project_name}</Typography>
                                      <Chip
                                        label={`${proj.allocation_percent}%`}
                                        size="small"
                                        variant="outlined"
                                      />
                                    </Box>
                                  ))}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  No allocations
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary" sx={{ mt: 2 }}>
                    No employee utilization data for this month
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Bench Report Tab */}
      {activeTab === 'bench' && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bench Employees by Month
              </Typography>
              {benchData && benchData.length > 0 ? (
                <Box
                  sx={{ width: '100%', height: 350, mt: 2, cursor: 'pointer' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const barWidth = rect.width / benchData.length;
                    const barIndex = Math.floor(x / barWidth);

                    if (barIndex >= 0 && barIndex < benchData.length) {
                      setSelectedBenchData(benchData[barIndex]);
                    }
                  }}
                >
                  <BarChart
                    dataset={benchData}
                    xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
                    series={[
                      {
                        dataKey: 'availabilityPercent',
                        label: 'Bench Availability %',
                        colorMap: {
                          type: 'piecewise',
                          thresholds: [10, 50],
                          colors: ['#10b981', '#f59e0b', '#ef4444'],
                        },
                      },
                    ]}
                    margin={{ top: 10, bottom: 30, left: 60, right: 10 }}
                    slotProps={{
                      legend: { hidden: false },
                    }}
                  />
                </Box>
              ) : (
                <Typography color="textSecondary">No bench data available</Typography>
              )}
            </CardContent>
          </Card>

          {selectedBenchData && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      Available Capacity — {selectedBenchData.month}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Total Available FTE: <strong>{selectedBenchData.totalAvailableFTE.toFixed(2)}</strong> FTE ({selectedBenchData.availabilityPercent}%)
                    </Typography>
                  </Box>
                  <Button size="small" onClick={() => setSelectedBenchData(null)}>
                    Close
                  </Button>
                </Box>
                {selectedBenchData.benchEmployees.length > 0 ? (
                  <TableContainer sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Utilization</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Available FTE %</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Available Capacity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedBenchData.benchEmployees.map((emp) => (
                          <TableRow key={emp.id} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                            <TableCell>{emp.name}</TableCell>
                            <TableCell>{emp.designation}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <Box sx={{ width: 100 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(emp.utilization, 100)}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      backgroundColor: '#e5e7eb',
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: emp.utilization > 100 ? '#ef4444' : '#1565c0',
                                      },
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2" sx={{ minWidth: 45 }}>{emp.utilization}%</Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${emp.availability.toFixed(0)}%`}
                                size="small"
                                color={emp.availability > 50 ? 'success' : emp.availability > 25 ? 'warning' : 'default'}
                                variant="filled"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {(emp.availability / 100).toFixed(2)} FTE
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary" sx={{ mt: 2 }}>No employees available for this month</Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Project Allocation Tab */}
      {activeTab === 'projectAllocation' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Project-wise Employee Allocation
            </Typography>
            <FormControl fullWidth sx={{ mb: 3, maxWidth: 300 }}>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProject ? selectedProject.id : ''}
                onChange={(e) => {
                  const projectId = parseInt(e.target.value);
                  const project = filteredProjects.find((p) => p.id === projectId);
                  setSelectedProject(project || null);
                }}
                label="Select Project"
              >
                <MenuItem value="">-- Select a project --</MenuItem>
                {filteredProjects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedProject && (() => {
              const projectAllocations = filteredAllocations.filter((alloc) => alloc.project_id === selectedProject.id);
              const allocByEmployee = projectAllocations.reduce((acc, alloc) => {
                const existingEmp = acc.find((e) => e.employee_id === alloc.employee_id);
                if (existingEmp) {
                  existingEmp.allocation_percent += alloc.allocation_percent;
                } else {
                  acc.push({ ...alloc });
                }
                return acc;
              }, []);

              return (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Allocation %</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Total %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allocByEmployee.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3, color: '#9ca3af' }}>
                            No employees allocated to this project
                          </TableCell>
                        </TableRow>
                      ) : (
                        allocByEmployee.map((alloc) => {
                          const employee = filteredEmployees.find((e) => e.id === alloc.employee_id);
                          const totalPercent = filteredAllocations
                            .filter((a) => a.employee_id === alloc.employee_id)
                            .reduce((sum, a) => sum + a.allocation_percent, 0);

                          return (
                            <TableRow key={alloc.employee_id}>
                              <TableCell>{employee?.name || 'Unknown'}</TableCell>
                              <TableCell align="center">{alloc.allocation_percent}%</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={`${totalPercent}%`}
                                  size="small"
                                  color={totalPercent > 100 ? 'error' : 'default'}
                                  variant={totalPercent > 100 ? 'filled' : 'outlined'}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default DashboardAndReports;
