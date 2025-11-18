import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ProjectView } from './ProjectView';
import { InputBar } from './InputBar';

export const Dashboard: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden transition-colors duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 shadow-xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 overflow-y-auto pb-24">
          <ProjectView onMenuClick={() => setSidebarOpen(true)} />
        </div>
        
        {/* Input Bar (Sticky Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 dark:from-slate-950 dark:via-slate-950 to-transparent">
           <div className="max-w-3xl mx-auto">
             <InputBar />
           </div>
        </div>
      </div>
    </div>
  );
};