import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import ChatRoom from './components/ChatRoom';
import { socketService } from './services/socketService';

export interface User {
  id: string;
  username: string;
  avatar: string;
  joinedAt: Date;
  isOnline: boolean;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user data exists in localStorage
    const savedUser = localStorage.getItem('chatUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      handleLogin(userData.username);
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleLogin = async (username: string) => {
    setIsConnecting(true);
    setConnectionError(null);
    
    const avatarColors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-yellow-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
    ];
    
    const userData = {
      username,
      avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)]
    };

    try {
      // Connect to socket first
      const socket = socketService.connect();
      
      // Set up connection event listeners
      socket.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);
        setIsConnecting(false);
        
        // Join the chat after connection is established
        socketService.emit('join', userData);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setConnectionError('Failed to connect to chat server. Please try again.');
        setIsConnecting(false);
        setIsConnected(false);
      });

      socket.on('user-joined', (userInfo: User) => {
        console.log('User joined successfully:', userInfo);
        setUser(userInfo);
        localStorage.setItem('chatUser', JSON.stringify(userData));
      });

      // If already connected, emit join immediately
      if (socket.connected) {
        setIsConnected(true);
        setIsConnecting(false);
        socketService.emit('join', userData);
      }

    } catch (error) {
      console.error('Login error:', error);
      setConnectionError('Failed to join chat. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('chatUser');
    socketService.disconnect();
    setUser(null);
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
  };

  const handleRetry = () => {
    setConnectionError(null);
    const savedUser = localStorage.getItem('chatUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      handleLogin(userData.username);
    }
  };

  // Show error state
  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-pink-600 to-purple-800 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connection Failed</h2>
          <p className="text-gray-600 mb-6">{connectionError}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              Try Again
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login form if no user or not connected
  if (!user || !isConnected) {
    return <LoginForm onLogin={handleLogin} isConnecting={isConnecting} />;
  }

  return <ChatRoom user={user} onLogout={handleLogout} />;
}

export default App;