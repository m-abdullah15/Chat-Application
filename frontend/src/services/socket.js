import { io } from 'socket.io-client';

// Initialize Socket.io client with URL from environment
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

// Initialize socket connection with JWT authentication
export const initializeSocket = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found. Cannot initialize socket.');
    return null;
  }

  // Don't create a new socket if one already exists and is connected
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    // Authenticate socket connection with JWT token
    socket.emit('authenticate', token);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts');
    // Re-authenticate on reconnection
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      socket.emit('authenticate', currentToken);
    }
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('Socket reconnection attempt:', attemptNumber);
  });

  socket.on('reconnect_error', (error) => {
    console.error('Socket reconnection error:', error);
  });

  socket.on('reconnect_failed', () => {
    console.error('Socket reconnection failed after all attempts');
  });

  return socket;
};

// Get the current socket instance
export const getSocket = () => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket() first.');
  }
  return socket;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Emit sendMessage event
export const emitSendMessage = (messageData) => {
  if (socket && socket.connected) {
    socket.emit('sendMessage', messageData);
  } else {
    console.error('Socket not connected. Cannot send message.');
  }
};

// Listen for receiveMessage event
export const onReceiveMessage = (callback) => {
  if (socket) {
    socket.on('receiveMessage', callback);
  }
};

// Remove receiveMessage listener
export const offReceiveMessage = (callback) => {
  if (socket) {
    socket.off('receiveMessage', callback);
  }
};

// Listen for authenticated event
export const onAuthenticated = (callback) => {
  if (socket) {
    socket.on('authenticated', callback);
  }
};

// Listen for error event
export const onError = (callback) => {
  if (socket) {
    socket.on('error', callback);
  }
};

// Listen for messageSent event (confirmation from server)
export const onMessageSent = (callback) => {
  if (socket) {
    socket.on('messageSent', callback);
  }
};

// Remove messageSent listener
export const offMessageSent = (callback) => {
  if (socket) {
    socket.off('messageSent', callback);
  }
};

// Check if socket is connected
export const isSocketConnected = () => {
  return socket && socket.connected;
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  emitSendMessage,
  onReceiveMessage,
  offReceiveMessage,
  onAuthenticated,
  onError,
  onMessageSent,
  offMessageSent,
  isSocketConnected,
};
