import React, { useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useApp } from '../context/AppContext';
import { Plus, ArrowUp, Hash } from 'lucide-react';

export const InputBar: React.FC = () => {
  const [value, setValue] = useState('');
  const socket = useSocket();
  const { activeProjectId } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);

  const isProjectMode = value.startsWith('#');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim() || !socket) return;

    if (isProjectMode) {
      const name = value.substring(1).trim();
      if (name) {
        socket.emit('create:project', { name });
      }
    } else {
      socket.emit('create:item', {
        projectId: activeProjectId,
        content: value.trim()
      });
    }

    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  return (
    <div className="relative group">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isProjectMode ? 'text-purple-500' : 'text-blue-500'}`}>
        {isProjectMode ? <Hash className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`w-full pl-12 pr-12 py-4 rounded-2xl border shadow-lg text-lg outline-none transition-all duration-200 
          ${isProjectMode 
            ? 'bg-purple-50/90 dark:bg-slate-900/90 border-purple-200 dark:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-purple-900 dark:text-purple-100 placeholder-purple-300' 
            : 'bg-white/90 dark:bg-slate-900/90 border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
        } backdrop-blur-md`}
        placeholder={isProjectMode ? "New Project Name..." : "Add a new task..."}
      />
      
      <button
        onClick={() => handleSubmit()}
        disabled={!value.trim()}
        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-200 ${
            value.trim() 
            ? isProjectMode ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-blue-600 text-white hover:bg-blue-500'
            : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600'
        }`}
      >
        <ArrowUp className="w-4 h-4" />
      </button>
      
      {/* Helper Tooltip */}
      <div className="absolute -top-8 left-4 text-xs text-slate-500 opacity-0 group-focus-within:opacity-100 transition-opacity">
        Type <span className="text-purple-500 dark:text-purple-400 font-mono">#name</span> to create a project
      </div>
    </div>
  );
};