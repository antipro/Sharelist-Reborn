import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AppProvider } from './context/AppContext';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </SocketProvider>
    </AuthProvider>
  );
}