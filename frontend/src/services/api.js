import axios from 'axios';

// Create axios instance with base URL from environment
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to determine if error is retryable
const isRetryableError = (error) => {
  // Retry on network errors or 5xx server errors
  return (
    !error.response ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_NETWORK' ||
    (error.response.status >= 500 && error.response.status < 600)
  );
};

// Add token to Authorization header for authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Initialize retry count
    config.retryCount = config.retryCount || 0;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }

    // Retry logic for network errors and server errors
    if (
      isRetryableError(error) &&
      originalRequest.retryCount < MAX_RETRIES &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      originalRequest.retryCount += 1;

      console.log(
        `Retrying request (${originalRequest.retryCount}/${MAX_RETRIES})...`
      );

      // Exponential backoff
      await delay(RETRY_DELAY * originalRequest.retryCount);

      return api(originalRequest);
    }

    // Enhance error message for better user feedback
    if (!error.response) {
      error.message = 'Network error. Please check your internet connection.';
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.';
    }

    return Promise.reject(error);
  }
);

// Authentication endpoints
export const register = async (userData) => {
  const response = await api.post('/api/auth/register', userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

// User endpoints
export const getUsers = async () => {
  const response = await api.get('/api/users');
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await api.get(`/api/users/${userId}`);
  return response.data;
};

// Message endpoints
export const sendMessage = async (messageData) => {
  const response = await api.post('/api/messages', messageData);
  return response.data;
};

export const getChatHistory = async (userId) => {
  const response = await api.get(`/api/messages/chat/${userId}`);
  return response.data;
};

export default api;
