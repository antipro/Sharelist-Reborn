import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { Menu, Calendar, Hash, Trash2, Undo2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TodoItem } from '../types';

interface ProjectViewProps {
  onMenuClick: () => void;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ onMenuClick }) => {
  const { items, activeProjectId, projects } = useApp();
  const { user } = useAuth();
  const socket = useSocket();
  
  const [lastDeletedItem, setLastDeletedItem] = useState<TodoItem | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectItems = items.filter(item => item.projectId === activeProjectId);
  
  const sortedItems = [...projectItems].sort((a, b) => {
    if (a.completed === b.completed) return b.createdAt - a.createdAt;
    return a.completed ? 1 : -1;
  });

  useEffect(() => {
    if (showUndo) {
      const timer = setTimeout(() => {
        setShowUndo(false);
        setLastDeletedItem(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showUndo]);

  const handleToggle = (itemId: string) => {
    if (!socket) return;
    socket.emit('toggle:item', { itemId });
  };

  const handleDelete = (item: TodoItem) => {
    if (!socket) return;
    setLastDeletedItem(item);
    setShowUndo(true);
    socket.emit('delete:item', { itemId: item.id });
  };

  const handleUndo = () => {
    if (!socket || !lastDeletedItem) return;
    socket.emit('restore:item', { item: lastDeletedItem });
    setShowUndo(false);
    setLastDeletedItem(null);
  };

  if (!activeProject) return <div className="p-8 text-slate-500 dark:text-slate-400">Select a project...</div>;

  return (
    <div className="max-w-3xl mx-auto w-full min-h-full p-4 md:p-8 relative">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg transition-colors">
               <Hash className="w-6 h-6 text-blue-600 dark:text-blue-400" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{activeProject.name}</h2>
               <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date().toLocaleDateString(user?.language || 'en', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
               </div>
             </div>
          </div>
        </div>
      </header>

      {/* List */}
      <div className="space-y-1">
        {sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
            <div className="w-16 h-16 border-2 border-gray-200 dark:border-slate-800 rounded-full flex items-center justify-center mb-4">
               <span className="text-2xl grayscale opacity-50">✨</span>
            </div>
            <p>No items yet.</p>
            <p className="text-sm mt-2">Type <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">task name</code> below to add one.</p>
          </div>
        ) : (
          sortedItems.map(item => (
            <div 
              key={item.id}
              className={`group relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200 ${
                item.completed 
                  ? 'bg-gray-100/50 dark:bg-slate-900/30 opacity-60' 
                  : 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm border border-gray-200/50 dark:border-slate-800/50'
              }`}
            >
              <button
                onClick={() => handleToggle(item.id)}
                className={`mt-1 flex-shrink-0 w-5 h-5 rounded-md border transition-colors flex items-center justify-center ${
                  item.completed
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 dark:border-slate-600 hover:border-blue-500 bg-transparent'
                }`}
              >
                {item.completed && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </button>
              <div className="flex-1 pt-0.5 pr-8">
                 <span className={`text-base transition-colors ${item.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                   {item.content}
                 </span>
                 <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-600 font-mono">
                   {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
                title="Delete Item"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Undo Toast */}
      {showUndo && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-slate-800 dark:bg-slate-900 border border-slate-700 shadow-2xl text-slate-200 px-4 py-3 rounded-full flex items-center gap-4">
            <span className="text-sm font-medium pl-1">Item deleted</span>
            <div className="w-px h-4 bg-slate-600"></div>
            <button 
              onClick={handleUndo}
              className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};