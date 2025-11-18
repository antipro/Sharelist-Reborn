import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { LogOut, Settings, Hash, CheckSquare, Moon, Sun } from 'lucide-react';
import { TIMEZONES, LANGUAGES } from '../constants';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout, updateSettings } = useAuth();
  const { projects, activeProjectId, setActiveProjectId } = useApp();
  const [showSettings, setShowSettings] = useState(false);

  if (!user) return null;

  const handleProjectClick = (id: string) => {
    setActiveProjectId(id);
    if (onClose) onClose();
  };
  
  const toggleTheme = () => {
      const newTheme = user.theme === 'dark' ? 'light' : 'dark';
      updateSettings(user.timezone, user.language, newTheme);
  };

  return (
    <div className="flex flex-col h-full">
      {/* App Header - Draggable Region for Tauri */}
      <div 
        data-tauri-drag-region
        className="p-6 flex items-center gap-3 border-b border-gray-200 dark:border-slate-800/50 transition-colors select-none cursor-default"
      >
        <div className="bg-blue-600 p-1.5 rounded-lg pointer-events-none">
          <CheckSquare className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100 pointer-events-none">SocketDo</span>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
          Projects
        </div>
        <div className="space-y-1">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                activeProjectId === project.id
                  ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Hash className="w-4 h-4 opacity-70" />
              <span className="truncate">{project.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User & Settings Area */}
      <div className="border-t border-gray-200 dark:border-slate-800/50 bg-gray-50 dark:bg-slate-900/50 transition-colors">
        {showSettings ? (
          <div className="p-4 space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Settings</span>
              <button onClick={() => setShowSettings(false)} className="text-xs text-blue-500 hover:text-blue-400">Done</button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Theme</label>
                 <button 
                   onClick={toggleTheme}
                   className="w-full flex items-center justify-between px-3 py-2 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                 >
                   <span>{user.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                   {user.theme === 'dark' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                 </button>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Timezone</label>
                <select
                  value={user.timezone}
                  onChange={(e) => updateSettings(e.target.value, user.language, user.theme)}
                  className="w-full bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 rounded border border-gray-200 dark:border-slate-700 px-2 py-1.5 outline-none focus:border-blue-500"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Language</label>
                <select
                  value={user.language}
                  onChange={(e) => updateSettings(user.timezone, e.target.value, user.theme)}
                  className="w-full bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 rounded border border-gray-200 dark:border-slate-700 px-2 py-1.5 outline-none focus:border-blue-500"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.username}</span>
                  <span className="text-xs text-slate-500">Online</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setShowSettings(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded text-xs text-slate-600 dark:text-slate-300 transition-colors"
              >
                <Settings className="w-3 h-3" /> Settings
              </button>
              <button 
                onClick={logout}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 border border-gray-200 dark:border-slate-700 rounded text-xs text-slate-600 dark:text-slate-300 transition-colors"
              >
                <LogOut className="w-3 h-3" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};