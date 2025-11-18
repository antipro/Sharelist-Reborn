import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/mockService';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, code: string, username: string, pass: string) => Promise<void>;
  sendCode: (email: string) => Promise<string>;
  logout: () => Promise<void>;
  updateSettings: (timezone: string, language: any, theme: 'light' | 'dark') => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('socketdo_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      applyTheme(parsedUser.theme);
    } else {
      applyTheme('dark'); // Default
    }
    setIsLoading(false);
  }, []);

  const applyTheme = (theme: 'light' | 'dark') => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  };

  const login = async (email: string, pass: string) => {
    const response = await api.login(email, pass);
    setUser(response.user);
    applyTheme(response.user.theme);
    localStorage.setItem('socketdo_user', JSON.stringify(response.user));
    // Removed reload() for SPA capability
  };

  const register = async (email: string, code: string, username: string, pass: string) => {
    const response = await api.register(email, code, username, pass);
    setUser(response.user);
    applyTheme(response.user.theme);
    localStorage.setItem('socketdo_user', JSON.stringify(response.user));
    // Removed reload() for SPA capability
  };

  const sendCode = async (email: string) => {
    return await api.sendVerifyCode(email);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    localStorage.removeItem('socketdo_user');
    applyTheme('dark');
  };

  const updateSettings = async (timezone: string, language: any, theme: 'light' | 'dark') => {
    if (!user) return;
    const updatedUser = await api.updateUser(user.id, { timezone, language, theme });
    setUser(updatedUser);
    applyTheme(theme);
    localStorage.setItem('socketdo_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, sendCode, logout, updateSettings, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};