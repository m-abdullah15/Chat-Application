# Error Handling and Loading States Guide

This document describes the comprehensive error handling and loading state implementation in the chat application.

## Overview

The application now includes robust error handling across all components, with user-friendly error messages, loading indicators, retry logic, and graceful degradation.

## Components

### 1. Error Boundary (`ErrorBoundary.jsx`)

**Purpose**: Catches React component errors and prevents the entire app from crashing.

**Features**:
- Catches all React rendering errors
- Displays user-friendly error page
- Shows detailed error in development mode
- Provides "Go to Home" and "Refresh Page" buttons
- Prevents error propagation to parent components

**Usage**: Wraps the entire application in `App.jsx`

### 2. Loading Spinner (`LoadingSpinner.jsx`)

**Purpose**: Reusable loading indicator component.

**Features**:
- Multiple sizes (sm, md, lg, xl)
- Optional text label
- Consistent styling across the app
- Animated spinner

**Usage**: Used in `ProtectedRoute`, `UserSidebar`, `MessageList`, and other components

### 3. Protected Route Enhancement

**Features**:
- Shows loading state while checking authentication
- Uses `AuthContext` for proper state management
- Redirects to login if not authenticated
- Prevents flash of unauthorized content

## API Error Handling

### Axios Interceptors (`api.js`)

**Request Interceptor**:
- Automatically adds JWT token to requests
- Initializes retry counter

**Response Interceptor**:
- Handles 401 (Unauthorized) errors with automatic logout
- Implements retry logic for network errors and 5xx errors
- Exponential backoff for retries (1s, 2s, 3s)
- Maximum 3 retry attempts
- Enhanced error messages for better UX

**Retryable Errors**:
- Network errors (no response)
- Connection timeouts (ECONNABORTED)
- Server errors (5xx status codes)

**Non-Retryable Errors**:
- Client errors (4xx status codes)
- Authentication errors (401)
- Validation errors (400)

## Form Validation

### Login Component

**Validations**:
- Email format validation
- Required field validation
- Real-time error clearing on input change
- Disabled state during submission

**Error Display**:
- Field-level error messages
- API error banner at top
- Success message from registration

### Signup Component

**Validations**:
- Username length (3-30 characters)
- Email format validation
- Password length (minimum 6 characters)
- Password confirmation match
- Real-time error clearing on input change
- Disabled state during submission

**Error Display**:
- Field-level error messages
- API error banner at top

## Chat Interface Error Handling

### Connection Status

**Features**:
- Visual indicator (green/yellow/red dot)
- Connection status text
- Reconnection notifications
- Auto-reconnect on disconnect

**States**:
- Connected (green): Socket connected and authenticated
- Reconnecting (yellow, pulsing): Attempting to reconnect
- Disconnected (red): No connection to server

### Chat History Loading

**Features**:
- Loading spinner while fetching messages
- Error banner with retry button
- Graceful fallback to empty state
- Error cleared on user selection change

### User List Loading

**Features**:
- Loading spinner while fetching users
- Error state with icon and retry button
- Empty state message
- Automatic retry on error

### Message Sending

**Features**:
- Disabled input when disconnected
- Loading state on send button
- Optimistic UI updates
- Error notification on send failure
- Auto-clear error after 5 seconds

## Error Messages

### User-Friendly Messages

The application provides context-specific error messages:

**Network Errors**:
- "Unable to connect to server. Please check your internet connection."

**Timeout Errors**:
- "Request timeout. Please try again."

**Authentication Errors**:
- "Invalid email or password."
- "Authentication failed. Please log in again."

**Validation Errors**:
- Specific field-level messages (e.g., "Email is required")

**Server Errors**:
- "Server error. Please try again later."

**Conflict Errors**:
- "Email or username already exists."

## Utility Functions (`errorHandling.js`)

### `getErrorMessage(error, defaultMessage)`
Extracts user-friendly error messages from error objects.

### `isValidEmail(email)`
Validates email format.

### `validatePassword(password)`
Validates password strength and returns detailed feedback.

### `validateUsername(username)`
Validates username format and length.

### `isRetryableError(error)`
Determines if an error should trigger a retry.

## Best Practices

### 1. Always Show Loading States
- Use `LoadingSpinner` for consistency
- Disable interactive elements during loading
- Provide visual feedback for all async operations

### 2. Provide Retry Options
- Add retry buttons for failed operations
- Implement automatic retry for transient errors
- Use exponential backoff to avoid overwhelming the server

### 3. Clear Error Messages
- Use specific, actionable error messages
- Avoid technical jargon
- Provide guidance on how to resolve the issue

### 4. Graceful Degradation
- Show empty states instead of broken UI
- Allow partial functionality when possible
- Maintain app stability even with errors

### 5. Error Logging
- Log errors to console for debugging
- Include context (component, operation, user action)
- Consider adding error tracking service in production

## Testing Error Scenarios

### Network Errors
1. Disconnect from internet
2. Verify error messages appear
3. Verify retry logic works
4. Reconnect and verify recovery

### Authentication Errors
1. Use invalid credentials
2. Verify error message
3. Use expired token
4. Verify automatic logout

### Server Errors
1. Stop backend server
2. Verify connection status updates
3. Verify retry attempts
4. Restart server and verify recovery

### Validation Errors
1. Submit empty forms
2. Use invalid email format
3. Use short password
4. Verify field-level errors

## Future Enhancements

- Add error tracking service (e.g., Sentry)
- Implement offline mode with queue
- Add toast notifications for non-critical errors
- Implement progressive retry delays
- Add error analytics and monitoring
