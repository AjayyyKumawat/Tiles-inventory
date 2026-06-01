import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';

// ── Role definitions ──────────────────────────────────────────────────────────
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  STAFF: 'staff',
};

// Routes each role can access (staff has restricted access)
export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: [
    '/',
    '/inventory',
    '/sales-orders',
    '/customers',
    '/suppliers',
    '/reports',
    '/settings',
    '/billing',
    '/staff',
  ],
  [ROLES.ADMIN]: [
    '/',
    '/inventory',
    '/sales-orders',
    '/customers',
    '/suppliers',
    '/reports',
    '/settings',
    '/billing',
    '/staff',
  ],
  [ROLES.STAFF]: [
    '/',
    '/inventory',
    '/sales-orders',
  ],
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Synchronous initial load to prevent login flash on app reload
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');
      return (stored && token) ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });


  const [usersList, setUsersList] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch all users from backend (Admins and Owners only)
  const fetchUsersList = useCallback(async () => {
    if (!user || (user.role !== ROLES.OWNER && user.role !== ROLES.ADMIN)) return;
    try {
      const response = await api.get('/users');
      setUsersList(response.data);
    } catch (err) {
      console.error('Failed to fetch user directory', err);
    }
  }, [user]);

  // Login via backend API
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: loggedUser } = response.data;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(loggedUser));
      
      setUser(loggedUser);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
      setLoading(false);
      return false;
    }
  }, []);

  // Clear session on logout
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  }, []);

  const canAccess = useCallback(
    (path) => {
      if (!user) return false;
      const allowed = ROLE_PERMISSIONS[user.role] || [];
      return allowed.includes(path);
    },
    [user]
  );

  // Create user in MongoDB
  const addUser = useCallback(async (newUser) => {
    try {
      await api.post('/users', newUser);
      await fetchUsersList();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign account access.');
    }
  }, [fetchUsersList]);

  // Delete user in MongoDB
  const removeUser = useCallback(async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      await fetchUsersList();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke account access.');
    }
  }, [fetchUsersList]);

  // Re-fetch current user from backend (used after self-profile edits)
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/users/me');
      const freshUser = res.data.user;
      setUser(freshUser);
      localStorage.setItem('auth_user', JSON.stringify(freshUser));
    } catch (err) {
      console.error('Failed to refresh user session', err);
    }
  }, []);

  // Edit details/password in MongoDB
  const updateUser = useCallback(async (userId, updatedFields) => {
    try {
      await api.put(`/users/${userId}`, updatedFields);
      await fetchUsersList();
      
      // Sync active session if the edited user is the current active session
      if (user && user.id === userId) {
        const res = await api.get('/users/me');
        const freshUser = res.data.user;
        setUser(freshUser);
        localStorage.setItem('auth_user', JSON.stringify(freshUser));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save account modifications.');
    }
  }, [user, fetchUsersList]);

  // Load directory on boot or user change
  useEffect(() => {
    if (user && (user.role === ROLES.OWNER || user.role === ROLES.ADMIN)) {
      fetchUsersList();
    } else {
      setUsersList([]);
    }
  }, [user, fetchUsersList]);

  // Background token verification check
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');
      if (token) {
        try {
          const res = await api.get('/users/me');
          setUser(res.data.user);
          localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        } catch {
          console.warn('Session verification failed, logging out.');
          logout();
        }
      } else if (storedUser) {
        console.warn('User session exists but token is missing, logging out.');
        logout();
      }
    };
    checkSession();
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        usersList,
        login,
        logout,
        canAccess,
        addUser,
        removeUser,
        updateUser,
        refreshUser,
        error,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

