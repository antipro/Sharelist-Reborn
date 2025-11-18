import { User, Project, TodoItem, AuthResponse } from '../types';

// Simulation of a MySQL-backed service
const DB_KEY = 'socketdo_mysql_sim_v1';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Data Structures simulating SQL Tables
interface DbSchema {
  users: (User & { passwordHash: string })[];
  verify_codes: { email: string; code: string; expiresAt: number }[];
  projects: (Project & { userId: string })[];
  items: TodoItem[];
}

const getDb = (): DbSchema => {
  const stored = localStorage.getItem(DB_KEY);
  if (stored) return JSON.parse(stored);
  const initial: DbSchema = {
    users: [],
    verify_codes: [],
    projects: [],
    items: []
  };
  localStorage.setItem(DB_KEY, JSON.stringify(initial));
  return initial;
};

const saveDb = (data: DbSchema) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// Simulating Server-Side API
export const api = {
  // 1. Request Verification Code
  sendVerifyCode: async (email: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Network delay
    const db = getDb();
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    
    // Upsert into verify_codes
    const existingIdx = db.verify_codes.findIndex(v => v.email === email);
    if (existingIdx > -1) {
      db.verify_codes[existingIdx] = { email, code, expiresAt };
    } else {
      db.verify_codes.push({ email, code, expiresAt });
    }
    
    saveDb(db);
    
    // Return the code so the UI can display it for demo purposes
    return code;
  },

  // 2. Register User
  register: async (email: string, code: string, username: string, password: string): Promise<AuthResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const db = getDb();

    // Verify Code Logic
    const verifyRecord = db.verify_codes.find(v => v.email === email && v.code === code);
    if (!verifyRecord) throw new Error("Invalid verification code");
    if (Date.now() > verifyRecord.expiresAt) throw new Error("Verification code expired");

    // Check if user exists
    if (db.users.find(u => u.email === email)) throw new Error("Email already registered");

    // Create User
    const newUser: User & { passwordHash: string } = {
      id: generateId(),
      email,
      username,
      passwordHash: `hashed_${password}`, // Simulated hash
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'en',
      theme: 'dark' // Default theme
    };

    // Create Default Project
    const defaultProject: Project & { userId: string } = {
      id: generateId(),
      userId: newUser.id,
      name: 'Inbox',
      createdAt: Date.now()
    };

    db.users.push(newUser);
    db.projects.push(defaultProject);
    // Clean up verify code
    db.verify_codes = db.verify_codes.filter(v => v.email !== email);
    
    saveDb(db);

    // Strip password hash before returning
    const { passwordHash, ...userProfile } = newUser;
    return { user: userProfile, token: `jwt_${newUser.id}` };
  },

  // 3. Login
  login: async (email: string, password: string): Promise<AuthResponse> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const db = getDb();
    
    const user = db.users.find(u => u.email === email);
    
    // In real app: bcrypt.compare(password, user.passwordHash)
    if (!user || user.passwordHash !== `hashed_${password}`) {
      throw new Error("Invalid email or password");
    }

    const { passwordHash, ...userProfile } = user;
    return { user: userProfile, token: `jwt_${user.id}` };
  },
  
  logout: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return true;
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const db = getDb();
    const index = db.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      const updatedUser = { ...db.users[index], ...updates };
      db.users[index] = updatedUser;
      saveDb(db);
      const { passwordHash, ...safeUser } = updatedUser;
      return safeUser;
    }
    throw new Error("User not found");
  }
};

// Mock Socket.io Client
export class MockSocket {
  private listeners: Record<string, Function[]> = {};
  private userId: string | null = null; // Simulate auth socket

  constructor() {
    // Try to get user ID from stored session for reconnection
    const stored = localStorage.getItem('socketdo_user');
    if (stored) {
      this.userId = JSON.parse(stored).id;
    }
    console.log('[MockSocket] Connected');
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    
    // Always try to refresh auth state when subscribing to events
    // This ensures we pick up the user after a login without needing a reload
    const stored = localStorage.getItem('socketdo_user');
    if (stored) {
      this.userId = JSON.parse(stored).id;
    }
    
    if (event === 'initial-data' && this.userId) {
      const db = getDb();
      // Filter data by user (Simulate "WHERE user_id = ?")
      // Simple join simulation: Get projects for user, get items for those projects
      const userProjects = db.projects.filter(p => p.userId === this.userId);
      const projectIds = userProjects.map(p => p.id);
      const userItems = db.items.filter(i => projectIds.includes(i.projectId));

      setTimeout(() => {
        callback({ projects: userProjects, items: userItems });
      }, 100);
    }
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, data: any) {
    // Simulate Server Logic
    setTimeout(() => this.handleServerLogic(event, data), 100);
  }

  private handleServerLogic(event: string, data: any) {
    const db = getDb();
    // Refresh user ID check
    const stored = localStorage.getItem('socketdo_user');
    this.userId = stored ? JSON.parse(stored).id : null;

    if (!this.userId) {
      console.error("Unauthorized socket event");
      return;
    }

    switch (event) {
      case 'create:project': {
        const newProject: Project & { userId: string } = {
          id: generateId(),
          userId: this.userId,
          name: data.name,
          createdAt: Date.now()
        };
        db.projects.push(newProject);
        saveDb(db);
        this.broadcast('project:created', newProject);
        break;
      }
      case 'create:item': {
        // Verify project belongs to user
        const project = db.projects.find(p => p.id === data.projectId && p.userId === this.userId);
        if (!project) return;

        const newItem: TodoItem = {
          id: generateId(),
          projectId: data.projectId,
          content: data.content,
          completed: false,
          createdAt: Date.now()
        };
        db.items.push(newItem);
        saveDb(db);
        this.broadcast('item:created', newItem);
        break;
      }
      case 'toggle:item': {
        const itemIndex = db.items.findIndex(i => i.id === data.itemId);
        if (itemIndex > -1) {
           // In real SQL: JOIN items i JOIN projects p ON i.project_id = p.id WHERE p.user_id = current_user
           // Here we just trust the mock DB structure for simplicity
           const item = db.items[itemIndex];
           db.items[itemIndex] = { ...item, completed: !item.completed };
           saveDb(db);
           this.broadcast('item:updated', db.items[itemIndex]);
        }
        break;
      }
      case 'delete:item': {
        const initialLength = db.items.length;
        db.items = db.items.filter(i => i.id !== data.itemId);
        if (db.items.length !== initialLength) {
          saveDb(db);
          this.broadcast('item:deleted', { itemId: data.itemId });
        }
        break;
      }
      case 'restore:item': {
        if (!db.items.find(i => i.id === data.item.id)) {
          db.items.push(data.item);
          saveDb(db);
          this.broadcast('item:restored', data.item);
        }
        break;
      }
    }
  }

  private broadcast(event: string, payload: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(payload));
    }
  }
}