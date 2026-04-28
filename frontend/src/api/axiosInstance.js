import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,  // Send httpOnly cookies on every request
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login on 401 for protected endpoints (not /auth/ endpoints)
    // /auth/ endpoints (like /auth/profile) return 401 for validation - let AuthContext handle it
    // Other endpoints returning 401 mean session was lost - redirect to login
    if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
