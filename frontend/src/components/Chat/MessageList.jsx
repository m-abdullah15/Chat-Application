import { useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const MessageList = memo(({ messages, loading }) => {
  const { user: currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      // Show time for messages within 24 hours
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffInHours < 168) {
      // Show day and time for messages within a week
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      // Show full date for older messages
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  const isCurrentUserMessage = useCallback((message) => {
    const senderId = message.sender?.id || message.sender?._id || message.sender;
    const currentUserId = currentUser?.id || currentUser?._id;
    return senderId === currentUserId;
  }, [currentUser]);

  // Group messages by date for better organization
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp || message.createdAt);
      const dateString = messageDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (dateString !== currentDate) {
        currentDate = dateString;
        groups.push({ type: 'date', date: dateString });
      }

      groups.push({ type: 'message', data: message });
    });

    return groups;
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 animate-fade-in">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium animate-pulse">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 animate-fade-in">
        <div className="text-center text-gray-500 animate-scale-in">
          <div className="relative inline-block mb-6">
            <svg
              className="w-20 h-20 mx-auto text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-bounce-slow">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No messages yet</h3>
          <p className="text-sm text-gray-500">Start the conversation by sending a message below</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50 p-4 space-y-3 custom-scrollbar">
      {groupedMessages.map((item, index) => {
        if (item.type === 'date') {
          return (
            <div key={`date-${index}`} className="flex justify-center my-4 animate-fade-in">
              <div className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-gray-200">
                <span className="text-xs font-medium text-gray-600">{item.date}</span>
              </div>
            </div>
          );
        }

        const message = item.data;
        const isSent = isCurrentUserMessage(message);
        const senderName = message.sender?.username || 'Unknown';
        const timestamp = message.timestamp || message.createdAt;

        return (
          <div
            key={message.id || message._id || index}
            style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
            className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div className={`flex max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              {!isSent && (
                <div className="flex-shrink-0 mr-2 sm:mr-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-md hover-lift">
                    {senderName.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
                {/* Sender Name (only for received messages) */}
                {!isSent && (
                  <span className="text-xs text-gray-600 font-semibold mb-1 px-1">
                    {senderName}
                  </span>
                )}

                {/* Message Bubble */}
                <div
                  className={`
                    rounded-2xl px-4 py-2.5 break-words shadow-sm transition-all duration-200 hover:shadow-md
                    ${isSent
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md hover:border-gray-300'
                    }
                  `}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Timestamp */}
                <span className="text-xs text-gray-500 mt-1.5 px-1 font-medium">
                  {formatTimestamp(timestamp)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default MessageList;
