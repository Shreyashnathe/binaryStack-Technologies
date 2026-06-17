/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react';
import { login as apiLogin, register as apiRegister } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiLogin({ email, password });
      const userData = res.data;
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const res = await apiRegister(payload);
      const userData = res.data;
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin   = () => user?.role === 'ADMIN';
  const isStudent = () => user?.role === 'STUDENT';

  const syncUserProfile = useCallback((profile) => {
    setUser((prev) => {
      if (!prev) return prev;
      const nextUser = {
        ...prev,
        name: profile?.name ?? prev.name,
        email: profile?.email ?? prev.email,
        role: profile?.role ?? prev.role,
        phoneNumber: profile?.phoneNumber ?? prev.phoneNumber,
        city: profile?.city ?? prev.city,
        educationLevel: profile?.educationLevel ?? prev.educationLevel,
        targetRole: profile?.targetRole ?? prev.targetRole,
        bio: profile?.bio ?? prev.bio,
        dateOfBirth: profile?.dateOfBirth ?? prev.dateOfBirth,
      };
      localStorage.setItem('user', JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isStudent, syncUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
