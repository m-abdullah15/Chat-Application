import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getChatHistory } from '../../services/api';
import {
  initializeSocket,
  disconnectSocket,
  emitSendMessage,
  onReceiveMessage,
  offReceiveMessage,
  onMessageSent,
  offMessageSent,
  getSocket,
} from '../../services/socket';
import UserSidebar from './UserSidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatInterface = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionNotification, setConnectionNotification] = useState(null);
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Initialize socket connection on mount
  useEffect(() => {
    const socket = initializeSocket();
    
    if (socket) {
      // Handle connection
      const handleConnect = () => {
        console.log('Socket connected');
        setSocketConnected(true);
        setIsReconnecting(false);
      };

      // Handle disconnection
      const handleDisconnect = (reason) => {
        console.log('Socket disconnected:', reason);
        setSocketConnected(false);
        
        // If disconnected due to server or transport issues, show reconnecting status
        if (reason === 'io server disconnect' || reason === 'transport close') {
          setIsReconnecting(true);
          setConnectionNotification({
            type: 'warning',
            message: 'Connection lost. Attempting to reconnect...',
          });
        }
      };

      // Handle authentication success
      const handleAuthenticated = () => {
        console.log('Socket authenticated successfully');
      };

      // Handle errors
      const handleError = (error) => {
        console.error('Socket error:', error);
        // If authentication fails, redirect to login
        if (error.message && error.message.includes('Authentication')) {
          console.error('Authentication failed, logging out');
          handleLogout();
        }
      };

      // Handle reconnection
      const handleReconnect = (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setSocketConnected(true);
        setIsReconnecting(false);
        setConnectionNotification({
          type: 'success',
          message: 'Connection restored!',
        });
        // Clear notification after 3 seconds
        setTimeout(() => setConnectionNotification(null), 3000);
      };

      // Handle reconnection attempts
      const handleReconnectAttempt = (attemptNumber) => {
        console.log('Attempting to reconnect...', attemptNumber);
        setIsReconnecting(true);
      };

      // Handle reconnection failure
      const handleReconnectFailed = () => {
        console.error('Failed to reconnect to server');
        setIsReconnecting(false);
        setSocketConnected(false);
        setConnectionNotification({
          type: 'error',
          message: 'Unable to connect to server. Please check your connection.',
        });
      };

      // Register event listeners
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('authenticated', handleAuthenticated);
      socket.on('error', handleError);
      socket.on('reconnect', handleReconnect);
      socket.on('reconnect_attempt', handleReconnectAttempt);
      socket.on('reconnect_failed', handleReconnectFailed);

      // Set initial connection state
      setSocketConnected(socket.connected);
    }

    // Cleanup on unmount
    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('authenticated');
        socket.off('error');
        socket.off('reconnect');
        socket.off('reconnect_attempt');
        socket.off('reconnect_failed');
      }
      disconnectSocket();
    };
  }, []);

  // Listen for incoming messages
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      console.log('Received message:', message);
      
      // Add message to list if it's from or to the selected user
      if (selectedUser) {
        const senderId = message.sender?.id || message.sender?._id || message.sender;
        const receiverId = message.receiver?.id || message.receiver?._id || message.receiver;
        const selectedUserId = selectedUser.id || selectedUser._id;
        const currentUserId = currentUser?.id || currentUser?._id;

        if (
          (senderId === selectedUserId && receiverId === currentUserId) ||
          (senderId === currentUserId && receiverId === selectedUserId)
        ) {
          setMessages((prevMessages) => {
            // Check if message already exists to avoid duplicates
            const messageExists = prevMessages.some(
              (msg) => msg.id === message.id || msg._id === message.id
            );
            if (messageExists) {
              return prevMessages;
            }
            return [...prevMessages, message];
          });
        }
      }
    };

    // Handle message sent confirmation from server
    const handleMessageSent = (message) => {
      console.log('Message sent confirmation:', message);
      // Update the optimistic message with the server response
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        // If the last message is an optimistic one (has a timestamp-based ID), replace it
        if (lastMessage && typeof lastMessage.id === 'string' && lastMessage.id.length < 20) {
          return [...prevMessages.slice(0, -1), message];
        }
        return prevMessages;
      });
    };

    onReceiveMessage(handleReceiveMessage);
    onMessageSent(handleMessageSent);

    return () => {
      offReceiveMessage(handleReceiveMessage);
      offMessageSent(handleMessageSent);
    };
  }, [selectedUser, currentUser]);

  // Fetch chat history when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchChatHistory();
    }
  }, [selectedUser]);

  const fetchChatHistory = useCallback(async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      setError(null);
      const userId = selectedUser.id || selectedUser._id;
      const data = await getChatHistory(userId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      const errorMessage = error.response?.data?.error?.message || 
                          error.message || 
                          'Failed to load chat history';
      setError(errorMessage);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUser]);

  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
    setMessages([]);
    setError(null);
    setIsMobileSidebarOpen(false);
  }, []);

  const handleSendMessage = useCallback(async (content) => {
    if (!selectedUser || !content.trim()) {
      return;
    }

    const receiverId = selectedUser.id || selectedUser._id;
    const messageData = {
      receiverId,
      content: content.trim(),
    };

    // Emit message via Socket.io
    emitSendMessage(messageData);

    // Optimistically add message to UI
    const optimisticMessage = {
      id: Date.now().toString(),
      sender: currentUser,
      receiver: selectedUser,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
  }, [selectedUser, currentUser]);

  const handleLogout = useCallback(() => {
    disconnectSocket();
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 animate-fade-in">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 px-4 py-3 flex items-center justify-between shadow-md animate-slide-down">
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 active:scale-95 focus-visible-ring"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md hover-scale">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Chat App
            </h1>
          </div>

          {/* Connection Status */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 animate-fade-in">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                socketConnected
                  ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse'
                  : isReconnecting
                  ? 'bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50'
                  : 'bg-red-500 shadow-lg shadow-red-500/50'
              }`}
            />
            <span className="text-xs text-gray-700 font-semibold">
              {socketConnected
                ? 'Connected'
                : isReconnecting
                ? 'Reconnecting...'
                : 'Disconnected'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 rounded-lg transition-all duration-200 active:scale-95 focus-visible-ring border border-transparent hover:border-red-200"
        >
          <span className="hidden sm:inline">Logout</span>
          <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* User Sidebar */}
        <UserSidebar
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3 shadow-sm animate-slide-down">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md hover-lift">
                  {selectedUser.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {selectedUser.username}
                  </h2>
                  <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-b border-red-200 px-4 py-3 animate-slide-down">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                    <button
                      onClick={fetchChatHistory}
                      className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors duration-200 px-3 py-1 rounded hover:bg-red-100 active:scale-95"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <MessageList messages={messages} loading={loading} />

              {/* Message Input */}
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!socketConnected}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 animate-fade-in">
              <div className="text-center text-gray-500 animate-scale-in">
                <svg
                  className="w-20 h-20 mx-auto mb-4 text-gray-400 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
                <h3 className="text-xl font-medium mb-2 text-gray-700">Welcome to Chat App</h3>
                <p className="text-sm text-gray-500">Select a user from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Notification */}
      {connectionNotification && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-up ${
            connectionNotification.type === 'success'
              ? 'bg-green-500 text-white'
              : connectionNotification.type === 'warning'
              ? 'bg-yellow-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {connectionNotification.type === 'success' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {connectionNotification.type === 'warning' && (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
          {connectionNotification.type === 'error' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
          <span className="font-medium">{connectionNotification.message}</span>
          <button
            onClick={() => setConnectionNotification(null)}
            className="ml-2 hover:opacity-80"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
