import { io } from 'socket.io-client';
import { User, AuthResponse } from '../types';
import { config } from '../config';

const API_URL = config.apiUrl;

// Helper for HTTP requests
const request = async (endpoint: string, method: string, body?: any, token?: string) => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API request failed');
  return data;
};

export const api = {
  sendVerifyCode: async (email: string): Promise<string> => {
    await request('/auth/code', 'POST', { email });
    // Real service doesn't return the code for security
    return ''; 
  },

  register: async (email: string, code: string, username: string, password: string): Promise<AuthResponse> => {
    return request('/auth/register', 'POST', { email, code, username, password });
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    return request('/auth/login', 'POST', { email, password });
  },

  logout: async (): Promise<void> => {
    // Client-side only cleanup needed usually
    return;
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User> => {
    // In a real app, we'd use the stored token
    const storedUser = localStorage.getItem('socketdo_user');
    const token = storedUser ? JSON.parse(storedUser).token : ''; // This logic would be better in AuthContext, but simplifed here
    
    // For now, we assume the backend handles the update and returns the user
    return request(`/users/${userId}`, 'PUT', updates, token); 
  }
};

export const createSocket = () => {
  // Pass the token in auth handshake if available
  const storedUser = localStorage.getItem('socketdo_user');
  const token = storedUser ? JSON.parse(storedUser).token : null;
  
  const socket = io(API_URL, {
    auth: { token },
    transports: ['websocket']
  });
  
  return socket;
};