export interface User {
  id: string;
  email: string;
  username: string;
  timezone: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'zh';
  theme: 'light' | 'dark';
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

export interface TodoItem {
  id: string;
  projectId: string;
  content: string;
  completed: boolean;
  createdAt: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Mock Event Types
export interface ServerToClientEvents {
  'project:created': (project: Project) => void;
  'item:created': (item: TodoItem) => void;
  'item:updated': (item: TodoItem) => void;
  'item:deleted': (data: { itemId: string }) => void;
  'item:restored': (item: TodoItem) => void;
  'initial-data': (data: { projects: Project[]; items: TodoItem[] }) => void;
}

export interface ClientToServerEvents {
  'create:project': (data: { name: string }) => void;
  'create:item': (data: { projectId: string; content: string }) => void;
  'toggle:item': (data: { itemId: string }) => void;
  'delete:item': (data: { itemId: string }) => void;
  'restore:item': (data: { item: TodoItem }) => void;
  'join:project': (projectId: string) => void;
}