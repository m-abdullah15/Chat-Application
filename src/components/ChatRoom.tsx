import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Users, LogOut, Wifi, WifiOff } from 'lucide-react';
import { User } from '../App';
import { socketService } from '../services/socketService';
import MessageList from './MessageList';
import UserList from './UserList';
import EmojiPicker from './EmojiPicker';

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

interface ChatRoomProps {
  user: User;
  onLogout: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ user, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Socket event listeners
    socketService.on('connect', () => setIsConnected(true));
    socketService.on('disconnect', () => setIsConnected(false));

    socketService.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socketService.on('message-history', (history: Message[]) => {
      setMessages(history);
    });

    socketService.on('online-users', (users: User[]) => {
      setOnlineUsers(users);
    });

    socketService.on('user-connected', (newUser: User) => {
      setOnlineUsers(prev => [...prev, newUser]);
    });

    socketService.on('user-disconnected', (disconnectedUser: User) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== disconnectedUser.id));
    });

    socketService.on('user-typing', ({ user: typingUser, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(typingUser.username) 
            ? prev 
            : [...prev, typingUser.username];
        } else {
          return prev.filter(username => username !== typingUser.username);
        }
      });

      if (isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(username => username !== typingUser.username));
        }, 3000);
      }
    });

    socketService.on('reaction-added', ({ messageId, emoji, user: reactUser }) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions };
          if (!reactions[emoji]) reactions[emoji] = [];
          
          const existingReaction = reactions[emoji].find(r => r.userId === reactUser.id);
          if (!existingReaction) {
            reactions[emoji].push({ userId: reactUser.id, username: reactUser.username });
          }
          
          return { ...msg, reactions };
        }
        return msg;
      }));
    });

    return () => {
      socketService.off('new-message');
      socketService.off('message-history');
      socketService.off('online-users');
      socketService.off('user-connected');
      socketService.off('user-disconnected');
      socketService.off('user-typing');
      socketService.off('reaction-added');
    };
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && isConnected) {
      socketService.emit('send-message', { text: newMessage.trim() });
      setNewMessage('');
      socketService.emit('typing-stop');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim()) {
      socketService.emit('typing-start');
      
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socketService.emit('typing-stop');
      }, 1000);
    } else {
      socketService.emit('typing-stop');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    socketService.emit('add-reaction', { messageId, emoji });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col lg:flex-row">
      {/* Header - Mobile */}
      <div className="lg:hidden bg-white/95 backdrop-blur-lg border-b border-gray-200/50 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${user.avatar} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">ChatFlow</h1>
            <div className="flex items-center space-x-1 text-xs">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-500" />
                  <span className="text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowUserList(true)}
            className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Users className="w-5 h-5" />
            {onlineUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {onlineUsers.length}
              </span>
            )}
          </button>
          
          <button
            onClick={onLogout}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:w-80 bg-white/95 backdrop-blur-lg border-r border-gray-200/50 flex-col">
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 ${user.avatar} rounded-xl flex items-center justify-center text-white font-bold`}>
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{user.username}</h2>
              <div className="flex items-center space-x-1 text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Chat</span>
          </button>
        </div>
        
        <UserList users={onlineUsers} currentUser={user} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList 
            messages={messages} 
            currentUser={user} 
            typingUsers={typingUsers}
            onAddReaction={handleAddReaction}
          />
        </div>

        {/* Message Input */}
        <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200/50 p-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-50">
                  <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
                </div>
              )}
            </div>
            
            <div className="flex-1 relative">
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder={isConnected ? "Type your message..." : "Reconnecting..."}
                disabled={!isConnected}
                className="w-full py-3 px-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         bg-gray-50/50 transition-all duration-200 disabled:opacity-50"
                maxLength={500}
              />
              
              <button
                type="submit"
                disabled={!newMessage.trim() || !isConnected}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-blue-500 to-purple-600 
                         text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile User List Overlay */}
      {showUserList && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowUserList(false)}>
          <div className="absolute right-0 top-0 h-full w-80 max-w-[80vw] bg-white/95 backdrop-blur-lg" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200/50">
              <h3 className="font-semibold text-gray-900">Online Users ({onlineUsers.length})</h3>
            </div>
            <UserList users={onlineUsers} currentUser={user} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;