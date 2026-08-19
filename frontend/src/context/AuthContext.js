// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('iconic_token');
    if (!token) { setLoading(false); return; }

    // Demo mode
    if (token.startsWith('demo_token_')) {
      try {
        const stored = localStorage.getItem('iconic_demo_user');
        if (stored) { setUser(JSON.parse(stored)); setLoading(false); return; }
      } catch { /* fall through */ }
      localStorage.removeItem('iconic_token');
      localStorage.removeItem('iconic_demo_user');
      setLoading(false);
      return;
    }

    // Real JWT — try to verify with backend, but DON'T log out if network fails
    try {
      const { data } = await authAPI.me();
      setUser(data);
    } catch (err) {
      // Only clear session on 401 (invalid token), not on network/CORS errors
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('iconic_token');
        setUser(null);
      } else {
        // Network error or CORS — keep the stored user from login
        const storedUser = localStorage.getItem('iconic_user');
        if (storedUser) {
          try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('iconic_token', data.token);
    localStorage.setItem('iconic_user', JSON.stringify(data.user));
    localStorage.removeItem('iconic_demo_user');
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('iconic_token');
    localStorage.removeItem('iconic_user');
    localStorage.removeItem('iconic_demo_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);