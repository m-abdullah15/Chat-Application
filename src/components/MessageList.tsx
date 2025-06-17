import React, { useEffect, useRef } from 'react';
import { User } from '../App';

interface Message {
  id: string;
  text: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  timestamp: Date;
  reactions: { [emoji: string]: { userId: string; username: string }[] };
}

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  typingUsers: string[];
  onAddReaction: (messageId: string, emoji: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser, typingUsers, onAddReaction }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwn = message.user.id === currentUser.id;
        
        return (
          <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
            <div className={`max-w-xs sm:max-w-md lg:max-w-lg flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
              {/* Avatar */}
              {!isOwn && (
                <div className={`w-8 h-8 ${message.user.avatar} rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0`}>
                  {message.user.username[0].toUpperCase()}
                </div>
              )}
              
              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {/* Username and Time */}
                {!isOwn && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-700">{message.user.username}</span>
                    <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                  </div>
                )}
                
                {/* Message Bubble */}
                <div className="relative">
                  <div className={`
                    px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 
                    ${isOwn 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md' 
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                    }
                    group-hover:shadow-md transform group-hover:scale-[1.02]
                  `}>
                    <p className="text-sm leading-relaxed break-words">{message.text}</p>
                    
                    {isOwn && (
                      <div className="text-xs text-blue-100 mt-1 text-right">
                        {formatTime(message.timestamp)}
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Reactions */}
                  <div className={`
                    absolute top-0 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10
                    ${isOwn ? 'right-full mr-2' : 'left-full ml-2'}
                  `}>
                    <div className="flex space-x-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
                      {quickReactions.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => onAddReaction(message.id, emoji)}
                          className="hover:bg-gray-100 rounded p-1 text-sm transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Reactions */}
                {Object.keys(message.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(message.reactions).map(([emoji, users]) => (
                      users.length > 0 && (
                        <button
                          key={emoji}
                          onClick={() => onAddReaction(message.id, emoji)}
                          className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 text-xs transition-colors"
                          title={users.map(u => u.username).join(', ')}
                        >
                          <span>{emoji}</span>
                          <span className="text-gray-600">{users.length}</span>
                        </button>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="flex justify-start">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2">
              <p className="text-sm text-gray-600">
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ` and ${typingUsers.length - 2} others` : ''} are typing...`
                }
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;