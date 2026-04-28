import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosInstance';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('utilization');
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allocRes, empRes] = await Promise.all([
        apiClient.get('/allocations'),
        apiClient.get('/employees'),
      ]);
      setAllocations(allocRes.data);
      setEmployees(empRes.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate 12 months from current date
  const getMonthsRange = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push(date);
    }
    return months;
  };

  // Calculate average monthly utilization across all employees
  const getAverageMonthlyUtilization = () => {
    const months = getMonthsRange();

    return months.map((month) => {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      let totalUtilization = 0;

      employees.forEach((emp) => {
        const empAllocations = allocations.filter((alloc) => {
          if (alloc.employee_id !== emp.id) return false;
          const allocStart = new Date(alloc.start_date);
          const allocEnd = new Date(alloc.end_date);
          return allocStart <= monthEnd && allocEnd >= monthStart;
        });

        const empUtilization = empAllocations.reduce((sum, alloc) => sum + alloc.allocation_percent, 0);
        totalUtilization += empUtilization;
      });

      const averageUtilization = employees.length > 0 ? Math.round((totalUtilization / employees.length) * 100) / 100 : 0;

      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        monthDate: month,
        average: averageUtilization,
        total: totalUtilization,
        employeeCount: employees.length,
      };
    });
  };

  // Get employee availability
  const getEmployeeAvailability = () => {
    const availability = [];

    employees.forEach((emp) => {
      const monthStart = new Date(filterMonth + '-01');
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      const monthAllocations = allocations.filter((alloc) => {
        if (alloc.employee_id !== emp.id) return false;
        const allocStart = new Date(alloc.start_date);
        const allocEnd = new Date(alloc.end_date);
        return allocStart <= monthEnd && allocEnd >= monthStart;
      });

      const totalUtilization = monthAllocations.reduce((sum, alloc) => sum + alloc.allocation_percent, 0);
      const availableCapacity = 100 - totalUtilization;

      availability.push({
        employee: emp,
        totalUtilization,
        availableCapacity,
        allocations: monthAllocations,
      });
    });

    return availability.sort((a, b) => b.availableCapacity - a.availableCapacity);
  };

  const chartData = getAverageMonthlyUtilization();
  const employeeAvailability = getEmployeeAvailability();
  const averageUtilization = chartData.length > 0
    ? Math.round((chartData.reduce((sum, item) => sum + item.average, 0) / chartData.length) * 100) / 100
    : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold text-gray-800">{data.month}</p>
          <p className="text-blue-600">Average: <span className="font-bold">{data.average}%</span></p>
          <p className="text-gray-600 text-sm">Total: {data.total}% ({data.employeeCount} employees)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports</h1>
        <p className="text-gray-600">View resource utilization and availability reports</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('utilization')}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'utilization'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📊 Average Utilization
        </button>
        <button
          onClick={() => setActiveTab('availability')}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'availability'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          ✅ Employee Availability
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading reports...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* Average Utilization Report */}
          {activeTab === 'utilization' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-600">Average Utilization</p>
                    <p className="text-3xl font-bold text-blue-600">{averageUtilization}%</p>
                    <p className="text-xs text-gray-500">12-month average</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-gray-600">Total Employees</p>
                    <p className="text-3xl font-bold text-green-600">{employees.length}</p>
                    <p className="text-xs text-gray-500">Active resources</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-gray-600">Peak Utilization</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {chartData.length > 0 ? Math.max(...chartData.map(d => d.average)) : 0}%
                    </p>
                    <p className="text-xs text-gray-500">Highest month</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Utilization Trend</h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="month"
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          domain={[0, 100]}
                          label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="line"
                        />
                        <Line
                          type="monotone"
                          dataKey="average"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{ fill: '#2563eb', r: 6 }}
                          activeDot={{ r: 8 }}
                          name="Average Utilization (%)"
                          isAnimationActive={true}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No allocation data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Employee Availability Report */}
          {activeTab === 'availability' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  View Availability for
                </label>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-4">
                {employeeAvailability.map((item) => (
                  <div key={item.employee.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">{item.employee.name}</h3>
                        <p className="text-sm text-gray-600">{item.employee.designation}</p>
                        {item.employee.city && (
                          <p className="text-xs text-gray-500">{item.employee.city}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{item.availableCapacity}%</div>
                        <p className="text-xs text-gray-600">Available</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Utilization</span>
                        <span className="font-semibold">{item.totalUtilization}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full ${
                            item.totalUtilization === 0
                              ? 'bg-gray-300'
                              : item.totalUtilization < 50
                              ? 'bg-green-500'
                              : item.totalUtilization < 80
                              ? 'bg-yellow-500'
                              : item.totalUtilization <= 100
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(item.totalUtilization, 100)}%` }}
                        />
                      </div>
                    </div>

                    {item.allocations.length > 0 && (
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <p className="font-semibold text-gray-700 mb-2">Current Projects ({item.allocations.length})</p>
                        <div className="space-y-1">
                          {item.allocations.map((alloc, idx) => (
                            <div key={idx} className="flex justify-between text-gray-600">
                              <span>{alloc.project_name}</span>
                              <span className="font-semibold">{alloc.allocation_percent}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.allocations.length === 0 && (
                      <div className="bg-green-50 rounded p-3 text-sm text-green-700">
                        ✓ Fully available for new projects
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
