import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rmsm_token');
    const saved = localStorage.getItem('rmsm_admin');
    if (token && saved) {
      try {
        setAdmin(JSON.parse(saved));
        // Verify token is still valid
        authAPI.me().then(res => {
          setAdmin(res.data.admin);
        }).catch(() => {
          localStorage.removeItem('rmsm_token');
          localStorage.removeItem('rmsm_admin');
          setAdmin(null);
        }).finally(() => setLoading(false));
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await authAPI.login({ username, password });
    const { token, admin: adminData } = res.data;
    localStorage.setItem('rmsm_token', token);
    localStorage.setItem('rmsm_admin', JSON.stringify(adminData));
    setAdmin(adminData);
    return adminData;
  };

  const logout = () => {
    localStorage.removeItem('rmsm_token');
    localStorage.removeItem('rmsm_admin');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
