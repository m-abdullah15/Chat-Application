/**
 * Utility functions for error handling across the application
 */

/**
 * Extract a user-friendly error message from an error object
 * @param {Error} error - The error object
 * @param {string} defaultMessage - Default message if no specific error found
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (!error) return defaultMessage;

  // Network errors
  if (error.message && error.message.includes('Network error')) {
    return 'Unable to connect to server. Please check your internet connection.';
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  // API errors with structured response
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  // API errors with simple message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // HTTP status-based messages
  if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication failed. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return defaultMessage;
    }
  }

  // Generic error message
  if (error.message) {
    return error.message;
  }

  return defaultMessage;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {object} Validation result with isValid and message
 */
export const validateUsername = (username) => {
  if (!username || !username.trim()) {
    return { isValid: false, message: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 30) {
    return { isValid: false, message: 'Username must be less than 30 characters' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Check if error is retryable
 * @param {Error} error - The error object
 * @returns {boolean} True if error is retryable
 */
export const isRetryableError = (error) => {
  // Network errors are retryable
  if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
    return true;
  }
  
  // 5xx server errors are retryable
  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }
  
  // 408 Request Timeout is retryable
  if (error.response?.status === 408) {
    return true;
  }
  
  return false;
};
