import React from 'react';
import { User } from '../App';
import { Crown, Circle } from 'lucide-react';

interface UserListProps {
  users: User[];
  currentUser: User;
}

const UserList: React.FC<UserListProps> = ({ users, currentUser }) => {
  const sortedUsers = [...users].sort((a, b) => {
    if (a.id === currentUser.id) return -1;
    if (b.id === currentUser.id) return 1;
    return a.username.localeCompare(b.username);
  });

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Online Users ({users.length})
        </h3>
      </div>
      
      <div className="space-y-2">
        {sortedUsers.map((user) => {
          const isCurrentUser = user.id === currentUser.id;
          
          return (
            <div
              key={user.id}
              className={`
                flex items-center space-x-3 p-3 rounded-xl transition-all duration-200
                ${isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
              `}
            >
              <div className="relative">
                <div className={`w-10 h-10 ${user.avatar} rounded-xl flex items-center justify-center text-white font-medium`}>
                  {user.username[0].toUpperCase()}
                </div>
                
                {/* Online Status */}
                <div className="absolute -bottom-1 -right-1">
                  <Circle className="w-4 h-4 text-green-500 fill-current" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className={`font-medium truncate ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}>
                    {user.username}
                  </p>
                  {isCurrentUser && (
                    <Crown className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-xs text-gray-500">
                  {isCurrentUser ? 'You' : 'Online'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No other users online</p>
          <p className="text-gray-400 text-xs mt-1">Be the first to start chatting!</p>
        </div>
      )}
    </div>
  );
};

export default UserList;