import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../types';
import { api } from '../services/api';

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
      // Handle potential structure diffs between mock/real
      const userObj = parsedUser.user || parsedUser; 
      setUser(userObj);
      applyTheme(userObj.theme || 'dark');
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
    const userData = response.user;
    setUser(userData);
    applyTheme(userData.theme);
    // Store entire response to keep token if present
    localStorage.setItem('socketdo_user', JSON.stringify(response));
    
    // Force socket reconnection to pick up new auth token if using real server
    window.location.reload(); 
  };

  const register = async (email: string, code: string, username: string, pass: string) => {
    const response = await api.register(email, code, username, pass);
    const userData = response.user;
    setUser(userData);
    applyTheme(userData.theme);
    localStorage.setItem('socketdo_user', JSON.stringify(response));
    window.location.reload();
  };

  const sendCode = async (email: string) => {
    return await api.sendVerifyCode(email);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    localStorage.removeItem('socketdo_user');
    applyTheme('dark');
    window.location.reload();
  };

  const updateSettings = async (timezone: string, language: any, theme: 'light' | 'dark') => {
    if (!user) return;
    const updatedUser = await api.updateUser(user.id, { timezone, language, theme });
    setUser(updatedUser);
    applyTheme(theme);
    
    // Update local storage while preserving token
    const stored = localStorage.getItem('socketdo_user');
    if (stored) {
        const parsed = JSON.parse(stored);
        parsed.user = updatedUser;
        localStorage.setItem('socketdo_user', JSON.stringify(parsed));
    }
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