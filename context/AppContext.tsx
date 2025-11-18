import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, TodoItem } from '../types';
import { useSocket } from './SocketContext';
import { DEFAULT_PROJECT_ID } from '../constants';

interface AppContextType {
  projects: Project[];
  items: TodoItem[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useSocket();
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<TodoItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>(DEFAULT_PROJECT_ID);

  useEffect(() => {
    if (!socket) return;

    // Define handlers so we can pass the exact same reference to .off()
    const handleInitialData = (data: { projects: Project[], items: TodoItem[] }) => {
      setProjects(data.projects);
      
      // Deduplicate items by ID just in case the DB has corrupted data
      const uniqueItems = Array.from(new Map(data.items.map(item => [item.id, item])).values());
      setItems(uniqueItems);
      
      // Ensure active project still exists, else default
      // Note: relying on the closure 'activeProjectId' is safe because 
      // it is listed in the dependency array.
      if (!data.projects.find(p => p.id === activeProjectId)) {
        setActiveProjectId(data.projects[0]?.id || DEFAULT_PROJECT_ID);
      }
    };

    const handleProjectCreated = (project: Project) => {
      setProjects(prev => {
        if (prev.find(p => p.id === project.id)) return prev;
        return [...prev, project];
      });
      // Optionally auto-switch to new project
      setActiveProjectId(project.id);
    };

    const handleItemCreated = (item: TodoItem) => {
      setItems(prev => {
        // Guard against duplicates
        if (prev.find(i => i.id === item.id)) return prev;
        return [...prev, item];
      });
    };

    const handleItemUpdated = (updatedItem: TodoItem) => {
      setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    };

    const handleItemDeleted = (data: { itemId: string }) => {
      setItems(prev => prev.filter(item => item.id !== data.itemId));
    };

    const handleItemRestored = (restoredItem: TodoItem) => {
      setItems(prev => {
        if (prev.find(i => i.id === restoredItem.id)) return prev;
        return [...prev, restoredItem];
      });
    };

    // Attach Listeners
    socket.on('initial-data', handleInitialData);
    socket.on('project:created', handleProjectCreated);
    socket.on('item:created', handleItemCreated);
    socket.on('item:updated', handleItemUpdated);
    socket.on('item:deleted', handleItemDeleted);
    socket.on('item:restored', handleItemRestored);
    
    // Cleanup: Remove the exact same listeners
    return () => {
      socket.off('initial-data', handleInitialData);
      socket.off('project:created', handleProjectCreated);
      socket.off('item:created', handleItemCreated);
      socket.off('item:updated', handleItemUpdated);
      socket.off('item:deleted', handleItemDeleted);
      socket.off('item:restored', handleItemRestored);
    };
  }, [socket, activeProjectId]);

  return (
    <AppContext.Provider value={{ projects, items, activeProjectId, setActiveProjectId }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};