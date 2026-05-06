import React, { useEffect, useState } from 'react';
import apiClient from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { BarChart } from '@mui/x-charts/BarChart';
import * as XLSX from 'xlsx';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SpeedIcon from '@mui/icons-material/Speed';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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

const COLORS = {
  navy:      '#1e3a5f',
  blue:      '#1565c0',
  blueSoft:  '#e3f0ff',
  teal:      '#0891b2',
  tealSoft:  '#e0f7fa',
  green:     '#059669',
  greenSoft: '#d1fae5',
  amber:     '#d97706',
  amberSoft: '#fef3c7',
  purple:    '#7c3aed',
  purpleSoft:'#ede9fe',
  bg:        '#f0f4f8',
  border:    '#e2e8f0',
};

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
  const [selectedBenchEmployee, setSelectedBenchEmployee] = useState(null);
  const [selectedUtilizationData, setSelectedUtilizationData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPractice, setSelectedPractice] = useState('');
  const [exportPractice, setExportPractice] = useState('');
  const [exportReportType, setExportReportType] = useState('');
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
          utilization,
          availability,
          projectDetails,
        };
      });

      // Calculate total FTE capacity and available FTE
      const totalFTECapacity = filteredEmployees.length; // Each employee = 1 FTE
      const totalAvailableFTE = employeeUtilization.reduce((sum, emp) => sum + (emp.availability / 100), 0);
      const availabilityPercent = totalFTECapacity > 0
        ? Math.round((totalAvailableFTE / totalFTECapacity) * 100)
        : 0;

      // Filter employees with available capacity (>= 50%)
      const benchEmployees = employeeUtilization.filter((emp) => emp.availability >= 50);

      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        benchCount: benchEmployees.length,
        availabilityPercent,
        benchEmployees,
        totalAvailableFTE,
      };
    });
  };

  const getUtilizationExportData = (practice) => {
    const rows = [];
    const practiceName = practice === '' ? 'All' : practice;

    const practiceAllocations = practice === ''
      ? filteredAllocations
      : filteredAllocations.filter((alloc) => {
          const emp = filteredEmployees.find((e) => e.id === alloc.employee_id);
          return emp && emp.practice === practice;
        });

    const practiceEmployees = practice === ''
      ? filteredEmployees
      : filteredEmployees.filter((e) => e.practice === practice);

    practiceAllocations.forEach((alloc) => {
      const employee = practiceEmployees.find((e) => e.id === alloc.employee_id);
      const project = filteredProjects.find((p) => p.id === alloc.project_id);

      if (employee && project) {
        rows.push({
          'Employee Name': employee.name,
          'Designation': employee.designation,
          'Practice': employee.practice,
          'Project Name': project.name,
          'Start Date': new Date(alloc.start_date).toLocaleDateString('en-US'),
          'End Date': new Date(alloc.end_date).toLocaleDateString('en-US'),
          'Allocation %': alloc.allocation_percent,
        });
      }
    });

    return rows;
  };

  const getBenchExportData = (practice) => {
    const rows = [];
    const practiceEmployees = practice === ''
      ? filteredEmployees
      : filteredEmployees.filter((e) => e.practice === practice);

    const now = new Date();

    practiceEmployees.forEach((emp) => {
      const empAllocations = filteredAllocations.filter((alloc) => {
        if (alloc.employee_id !== emp.id) return false;
        const allocStart = new Date(alloc.start_date);
        const allocEnd = new Date(alloc.end_date);
        return allocStart <= now && allocEnd >= now;
      });

      const currentUtilization = empAllocations.reduce((sum, alloc) => sum + alloc.allocation_percent, 0);
      const availableFTE = Math.max(0, 100 - currentUtilization);

      // Only include if > 50% available
      if (availableFTE >= 50) {
        if (empAllocations.length > 0) {
          empAllocations.forEach((alloc) => {
            const project = filteredProjects.find((p) => p.id === alloc.project_id);
            rows.push({
              'Employee Name': emp.name,
              'Designation': emp.designation,
              'Practice': emp.practice,
              'Available FTE %': availableFTE.toFixed(1),
              'Project Name': project?.name || 'Unknown',
              'Start Date': new Date(alloc.start_date).toLocaleDateString('en-US'),
              'End Date': new Date(alloc.end_date).toLocaleDateString('en-US'),
              'Allocation %': alloc.allocation_percent,
            });
          });
        } else {
          rows.push({
            'Employee Name': emp.name,
            'Designation': emp.designation,
            'Practice': emp.practice,
            'Available FTE %': '100.0',
            'Project Name': 'No Allocation',
            'Start Date': '',
            'End Date': '',
            'Allocation %': 0,
          });
        }
      }
    });

    return rows;
  };

  const generateAndDownloadXLSX = (practice, reportType) => {
    let rows = [];
    let filename = '';

    if (reportType === 'utilization') {
      rows = getUtilizationExportData(practice);
      filename = `Utilization_Report_${practice || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else if (reportType === 'bench') {
      rows = getBenchExportData(practice);
      filename = `Bench_Report_${practice || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    if (rows.length === 0) {
      alert('No data to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, filename);
  };

  const getExportPreview = () => {
    if (!exportPractice || !exportReportType) return null;

    const rows = exportReportType === 'utilization'
      ? getUtilizationExportData(exportPractice)
      : getBenchExportData(exportPractice);

    const employees = new Set();
    rows.forEach((row) => {
      employees.add(row['Employee Name']);
    });

    return {
      rowCount: rows.length,
      employeeCount: employees.size,
    };
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
    <Container maxWidth="lg" sx={{ py: 3, backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Practice Filter */}
      <Paper sx={{ mb: 3, p: 2, borderLeft: `4px solid ${COLORS.navy}`, backgroundColor: 'white' }}>
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
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3, backgroundColor: COLORS.navy }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="secondary"
          textColor="inherit"
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: '#fff',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: COLORS.teal,
              height: 3,
            },
          }}
        >
          <Tab label="Overview" value="overview" />
          <Tab label="Utilization Report" value="utilization" />
          <Tab label="Bench Report" value="bench" />
          <Tab label="Project Allocation" value="projectAllocation" />
          <Tab label="Export Report" value="export" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: `4px solid ${COLORS.blue}`, backgroundColor: '#fff' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1.5, backgroundColor: COLORS.blueSoft, borderRadius: 2 }}>
                    <PeopleIcon sx={{ color: COLORS.blue, fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography color="textSecondary" variant="body2" gutterBottom>
                      Total Employees
                    </Typography>
                    <Typography variant="h5" sx={{ color: COLORS.blue, fontWeight: 700 }}>
                      {filteredEmployees.length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: `4px solid ${COLORS.teal}`, backgroundColor: '#fff' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1.5, backgroundColor: COLORS.tealSoft, borderRadius: 2 }}>
                    <FolderIcon sx={{ color: COLORS.teal, fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography color="textSecondary" variant="body2" gutterBottom>
                      Total Projects
                    </Typography>
                    <Typography variant="h5" sx={{ color: COLORS.teal, fontWeight: 700 }}>
                      {filteredProjects.length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: `4px solid ${COLORS.amber}`, backgroundColor: '#fff' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1.5, backgroundColor: COLORS.amberSoft, borderRadius: 2 }}>
                    <AssignmentIcon sx={{ color: COLORS.amber, fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography color="textSecondary" variant="body2" gutterBottom>
                      Active Allocations
                    </Typography>
                    <Typography variant="h5" sx={{ color: COLORS.amber, fontWeight: 700 }}>
                      {filteredAllocations.length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: `4px solid ${COLORS.green}`, backgroundColor: '#fff' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1.5, backgroundColor: COLORS.greenSoft, borderRadius: 2 }}>
                    <SpeedIcon sx={{ color: COLORS.green, fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography color="textSecondary" variant="body2" gutterBottom>
                      Avg Utilization
                    </Typography>
                    <Typography variant="h5" sx={{ color: COLORS.green, fontWeight: 700 }}>
                      {averageUtilization}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Capacity Card */}
          <Card sx={{ borderLeft: `4px solid ${COLORS.blue}`, backgroundColor: '#fff' }}>
            <CardContent>
              <Box sx={{ backgroundColor: COLORS.blueSoft, p: 2, mx: -2, mt: -2, mb: 2, borderRadius: '4px 4px 0 0' }}>
                <Typography variant="h6" sx={{ color: COLORS.navy, fontWeight: 700 }}>
                  Team Capacity
                </Typography>
              </Box>
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
          <Card sx={{ mb: 3, borderLeft: `4px solid ${COLORS.blue}`, backgroundColor: '#fff' }}>
            <CardContent>
              <Box sx={{ backgroundColor: COLORS.blueSoft, p: 2, mx: -2, mt: -2, mb: 2, borderRadius: '4px 4px 0 0' }}>
                <Typography variant="h6" sx={{ color: COLORS.navy, fontWeight: 700 }}>
                  Monthly Utilization Trend
                </Typography>
              </Box>
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
            <Card sx={{ borderLeft: `4px solid ${COLORS.blue}`, backgroundColor: '#fff' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: COLORS.navy, fontWeight: 700 }}>
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
                        <TableRow sx={{ backgroundColor: COLORS.blueSoft }}>
                          <TableCell sx={{ fontWeight: 700, color: COLORS.navy }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: COLORS.navy }}>Designation</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: COLORS.navy }}>Utilization</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: COLORS.navy }}>Allocated Projects</TableCell>
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
          <Card sx={{ mb: 3, borderLeft: `4px solid ${COLORS.teal}`, backgroundColor: '#fff' }}>
            <CardContent>
              <Box sx={{ backgroundColor: COLORS.tealSoft, p: 2, mx: -2, mt: -2, mb: 2, borderRadius: '4px 4px 0 0' }}>
                <Typography variant="h6" sx={{ color: COLORS.navy, fontWeight: 700 }}>
                  Bench Employees by Month
                </Typography>
              </Box>
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
                      setSelectedBenchEmployee(null);
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
            <Box>
              <Card sx={{ borderLeft: `4px solid ${COLORS.teal}`, backgroundColor: '#fff' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ color: COLORS.navy, fontWeight: 700 }}>
                        Available Capacity — {selectedBenchData.month}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Total Available FTE: <strong>{selectedBenchData.totalAvailableFTE.toFixed(2)}</strong> FTE ({selectedBenchData.availabilityPercent}%)
                      </Typography>
                    </Box>
                    <Button size="small" onClick={() => {
                      setSelectedBenchData(null);
                      setSelectedBenchEmployee(null);
                    }}>
                      Close
                    </Button>
                  </Box>
                  {selectedBenchData.benchEmployees.length > 0 ? (
                    <TableContainer sx={{ mt: 2 }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: COLORS.tealSoft }}>
                            <TableCell sx={{ fontWeight: 700, color: COLORS.navy }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: COLORS.navy }}>Designation</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: COLORS.navy }}>Utilization</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: COLORS.navy }}>Available FTE %</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: COLORS.navy }}>Available Capacity</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedBenchData.benchEmployees.map((emp) => (
                            <React.Fragment key={emp.id}>
                              <TableRow sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f0fdff' } }} onClick={() => setSelectedBenchEmployee(selectedBenchEmployee?.id === emp.id ? null : emp)}>
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
                              {selectedBenchEmployee?.id === emp.id && (
                                <TableRow sx={{ backgroundColor: '#f0fdff' }}>
                                  <TableCell colSpan={5} sx={{ py: 2 }}>
                                    <Box sx={{ pl: 2 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                        Project Allocations
                                      </Typography>
                                      {emp.projectDetails.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                          {emp.projectDetails.map((proj, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', p: 1.5, borderRadius: 1 }}>
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
                                          No project allocations for this month
                                        </Typography>
                                      )}
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography color="textSecondary" sx={{ mt: 2 }}>No employees available for this month</Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      )}

      {/* Project Allocation Tab */}
      {activeTab === 'projectAllocation' && (
        <Card sx={{ borderLeft: `4px solid ${COLORS.purple}`, backgroundColor: '#fff' }}>
          <CardContent>
            <Box sx={{ backgroundColor: COLORS.purpleSoft, p: 2, mx: -2, mt: -2, mb: 2, borderRadius: '4px 4px 0 0' }}>
              <Typography variant="h6" sx={{ color: COLORS.navy, fontWeight: 700 }}>
                Project-wise Employee Allocation
              </Typography>
            </Box>
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
                      <TableRow sx={{ backgroundColor: COLORS.purpleSoft }}>
                        <TableCell sx={{ fontWeight: 700, color: COLORS.navy }}>Employee</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: COLORS.navy }}>Allocation %</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: COLORS.navy }}>Total %</TableCell>
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

      {/* Export Report Tab */}
      {activeTab === 'export' && (
        <Card sx={{ borderLeft: `4px solid ${COLORS.green}`, backgroundColor: '#fff' }}>
          <CardContent>
            <Box sx={{ backgroundColor: COLORS.greenSoft, p: 2, mx: -2, mt: -2, mb: 3, borderRadius: '4px 4px 0 0' }}>
              <Typography variant="h6" sx={{ color: COLORS.navy, fontWeight: 700 }}>
                Export Report
              </Typography>
            </Box>

            {/* Step 1: Practice Selection */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: exportPractice ? COLORS.green : COLORS.blue,
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}>
                  {exportPractice ? <CheckCircleIcon sx={{ fontSize: 20 }} /> : '1'}
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.navy }}>
                  Select Practice
                </Typography>
              </Box>
              <Paper sx={{ p: 2, backgroundColor: COLORS.blueSoft, border: `2px solid ${COLORS.blue}` }}>
                <FormControl fullWidth>
                  <InputLabel>Practice</InputLabel>
                  <Select
                    value={exportPractice}
                    onChange={(e) => setExportPractice(e.target.value)}
                    label="Practice"
                  >
                    <MenuItem value="">
                      {isAdmin ? 'All Practices' : '-- Select a practice --'}
                    </MenuItem>
                    {practices.map((practice) => (
                      <MenuItem key={practice} value={practice}>
                        {practice}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>
            </Box>

            {/* Step 2: Report Type Selection */}
            {exportPractice && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: exportReportType ? COLORS.green : COLORS.blue,
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 14,
                  }}>
                    {exportReportType ? <CheckCircleIcon sx={{ fontSize: 20 }} /> : '2'}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.navy }}>
                    Choose Report Type
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: `2px solid ${exportReportType === 'utilization' ? COLORS.blue : COLORS.border}`,
                        backgroundColor: exportReportType === 'utilization' ? COLORS.blueSoft : '#fff',
                        transition: 'all 0.3s',
                        '&:hover': { boxShadow: 2 },
                      }}
                      onClick={() => setExportReportType('utilization')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ p: 1.5, backgroundColor: COLORS.blue, borderRadius: 1 }}>
                          <AssignmentIcon sx={{ color: 'white' }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.navy }}>
                            Utilization Report
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            All allocations by employee & project
                          </Typography>
                          {exportReportType === 'utilization' && (
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: COLORS.green }}>
                              <CheckCircleIcon sx={{ fontSize: 18 }} />
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>Selected</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: `2px solid ${exportReportType === 'bench' ? COLORS.teal : COLORS.border}`,
                        backgroundColor: exportReportType === 'bench' ? COLORS.tealSoft : '#fff',
                        transition: 'all 0.3s',
                        '&:hover': { boxShadow: 2 },
                      }}
                      onClick={() => setExportReportType('bench')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ p: 1.5, backgroundColor: COLORS.teal, borderRadius: 1 }}>
                          <PeopleIcon sx={{ color: 'white' }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.navy }}>
                            Bench Report
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Available (≥50%) employees
                          </Typography>
                          {exportReportType === 'bench' && (
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: COLORS.green }}>
                              <CheckCircleIcon sx={{ fontSize: 18 }} />
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>Selected</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 3: Preview & Download */}
            {exportPractice && exportReportType && (() => {
              const preview = getExportPreview();
              return (
                <Box sx={{ mb: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: COLORS.green,
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                    }}>
                      3
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.navy }}>
                      Download Your Report
                    </Typography>
                  </Box>
                  <Paper sx={{ p: 2.5, backgroundColor: COLORS.greenSoft, border: `2px solid ${COLORS.green}` }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Report Ready:</strong> {preview.rowCount} allocation records for {preview.employeeCount} employee(s)
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Practice: <strong>{exportPractice}</strong> • Type: <strong>{exportReportType === 'utilization' ? 'Utilization' : 'Bench'}</strong>
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      endIcon={<DownloadIcon />}
                      onClick={() => generateAndDownloadXLSX(exportPractice, exportReportType)}
                      sx={{
                        backgroundColor: COLORS.green,
                        '&:hover': { backgroundColor: '#047857' },
                        textTransform: 'none',
                        fontSize: 16,
                        fontWeight: 700,
                        py: 1.2,
                        px: 3,
                      }}
                    >
                      Download Excel File
                    </Button>
                  </Paper>
                </Box>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default DashboardAndReports;
