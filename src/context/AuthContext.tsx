import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, RoleName, PermissionCode } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  hasPermission: (permission: PermissionCode) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: { email: string; password: string; first_name: string; last_name: string; phone?: string }) => Promise<void>;
  logout: () => void;
  switchDemoUser: (role: 'super_admin' | 'catalog_manager' | 'customer') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('spinel_auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch (err) {
      console.error('Session expired or invalid:', err);
      localStorage.removeItem('spinel_auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password });
    localStorage.setItem('spinel_auth_token', data.token);
    setUser(data.user);
  };

  const register = async (params: { email: string; password: string; first_name: string; last_name: string; phone?: string }) => {
    const data = await api.register(params);
    localStorage.setItem('spinel_auth_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('spinel_auth_token');
    setUser(null);
  };

  const switchDemoUser = async (role: 'super_admin' | 'catalog_manager' | 'customer') => {
    setLoading(true);
    let email = 'spineldistribution@gmail.com';
    if (role === 'catalog_manager') email = 'catalog@spineldistribution.com';
    if (role === 'customer') email = 'customer@example.com';

    try {
      await login(email, 'SpinelAdmin2026!');
    } catch (err) {
      console.error('Failed to switch demo user:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = Boolean(
    user && (
      user.roles.includes('super_admin') ||
      user.roles.includes('admin') ||
      user.roles.includes('catalog_manager') ||
      user.roles.includes('order_manager')
    )
  );

  const hasPermission = (permission: PermissionCode): boolean => {
    if (!user) return false;
    if (user.roles.includes('super_admin')) return true;
    return user.permissions ? user.permissions.includes(permission) : false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, hasPermission, login, register, logout, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
