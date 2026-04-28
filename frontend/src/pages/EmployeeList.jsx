import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axiosInstance';
import EmployeeForm from '../components/EmployeeForm';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/employees');
      setEmployees(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch employees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await apiClient.delete(`/employees/${id}`);
      setMessage('Employee deleted successfully');
      fetchEmployees();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      if (editingEmployee) {
        await apiClient.put(`/employees/${editingEmployee.id}`, formData);
        setMessage('Employee updated successfully');
      } else {
        await apiClient.post('/employees', formData);
        setMessage('Employee added successfully');
      }
      setEditingEmployee(null);
      fetchEmployees();
      setSearchQuery('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingEmployee(null);
  };

  // Filter employees based on search query
  const getFilteredEmployees = () => {
    if (!searchQuery.trim()) return employees;

    const query = searchQuery.toLowerCase();
    return employees.filter((emp) =>
      emp.name.toLowerCase().includes(query) ||
      emp.designation.toLowerCase().includes(query) ||
      (emp.primary_skill && emp.primary_skill.toLowerCase().includes(query)) ||
      (emp.secondary_skill && emp.secondary_skill.toLowerCase().includes(query)) ||
      (emp.city && emp.city.toLowerCase().includes(query))
    );
  };

  const filteredEmployees = getFilteredEmployees();

  // Get autocomplete suggestions (for dropdown) - show after 3 characters
  const getSearchSuggestions = () => {
    if (searchQuery.length < 3) return [];
    return filteredEmployees.slice(0, 8);
  };

  const searchSuggestions = getSearchSuggestions();

  // Handle selecting an employee from dropdown
  const handleSelectEmployee = (employee) => {
    setSearchQuery(employee.name);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return <div className="p-6">Loading employees...</div>;
  }

  return (
    <div className="flex gap-6 h-full overflow-hidden p-6">
      {/* Left Panel - Employee List */}
      <div className="w-full md:w-96 flex flex-col bg-white rounded shadow border border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Employees</h2>

          {/* Search Input */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length >= 3) {
                  setShowSuggestions(true);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />

            {/* Autocomplete Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto"
              >
                {searchSuggestions.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition"
                  >
                    <p className="font-semibold text-gray-800 text-sm">{emp.name}</p>
                    <p className="text-xs text-gray-600">{emp.designation}</p>
                  </button>
                ))}
              </div>
            )}

            {showSuggestions && searchQuery.length >= 3 && searchSuggestions.length === 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 p-2"
              >
                <p className="text-xs text-gray-500 text-center">No employees found</p>
              </div>
            )}
          </div>
        </div>

        {/* Employee List */}
        <div className="flex-1 overflow-y-auto">
          {employees.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No employees found
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No match found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{employee.name}</p>
                      <p className="text-xs text-gray-600">{employee.designation}</p>
                      <p className="text-xs text-gray-500">{employee.city || '-'}</p>
                    </div>
                    <div className="flex gap-1 whitespace-nowrap flex-shrink-0">
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="text-orange-500 hover:text-orange-600 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-500 hover:text-red-600 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Form/Content */}
      <div className="flex-1 flex flex-col">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded text-sm">
            {message}
          </div>
        )}

        {editingEmployee ? (
          <div className="bg-white rounded shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Edit Employee</h3>
            <EmployeeForm
              initialData={editingEmployee}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={submitting}
            />
          </div>
        ) : (
          <div className="bg-white rounded shadow overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="border-b border-gray-200 flex">
              <button className="px-6 py-3 font-medium text-blue-600 border-b-2 border-blue-600">
                + Add Employee
              </button>
              <button className="px-6 py-3 font-medium text-gray-600 hover:text-gray-800">
                📤 Bulk Upload
              </button>
            </div>

            {/* Add Employee Form */}
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Add New Employee</h3>
              <EmployeeForm
                initialData={null}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={submitting}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeList;
