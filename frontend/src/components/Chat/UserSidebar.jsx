import { useState, useEffect, memo } from 'react';
import { getUsers } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const UserSidebar = memo(({ selectedUser, onSelectUser, isMobileOpen, onCloseMobile }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data.users || []);
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 
                          err.message || 
                          'Failed to load users';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user) => {
    onSelectUser(user);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          bg-white border-r border-gray-200 flex flex-col shadow-lg
          md:w-80 w-full max-w-sm transition-all duration-300 ease-in-out
          md:relative fixed inset-y-0 left-0 z-50
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 via-purple-50 to-white shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Chats</h2>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-white/80 transition-all duration-200 active:scale-95 focus-visible-ring"
              aria-label="Close sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-white to-gray-50">
          {loading ? (
            <div className="flex items-center justify-center p-8 animate-fade-in">
              <div className="text-center">
                <LoadingSpinner size="md" />
                <p className="mt-3 text-sm text-gray-600 font-medium">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center animate-scale-in">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 mb-4 text-sm font-medium">{error}</p>
              <button
                onClick={fetchUsers}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 text-sm font-semibold transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg"
              >
                Try Again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-gray-500 animate-fade-in">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-medium">No users available</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user, index) => (
                <button
                  key={user.id || user._id}
                  onClick={() => handleUserClick(user)}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={`
                    w-full p-4 text-left transition-all duration-200 animate-fade-in
                    hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 active:scale-[0.98]
                    focus-visible-ring
                    ${selectedUser?.id === user.id || selectedUser?._id === user._id
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-600 shadow-sm'
                      : 'border-l-4 border-transparent hover:border-l-4 hover:border-blue-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md hover-lift">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      {/* Online indicator (placeholder for future feature) */}
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Chevron indicator */}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current User Info */}
        {currentUser && (
          <div className="p-4 border-t-2 border-gray-200 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 shadow-inner">
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white/60 backdrop-blur-sm">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg hover-lift">
                  {currentUser.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {currentUser.username}
                </p>
                <p className="text-xs text-green-600 font-semibold flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

UserSidebar.displayName = 'UserSidebar';

export default UserSidebar;
