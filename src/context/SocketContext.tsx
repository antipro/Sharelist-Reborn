import React, { createContext, useContext, useEffect, useState } from 'react';
import { createSocket } from '../services/api';
import { useAuth } from './AuthContext';

// Allow any type here as it could be MockSocket or real Socket.io Socket
const SocketContext = createContext<any | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Create socket connection
    const newSocket = createSocket();
    setSocket(newSocket);

    if (user) {
        // If it's the real socket, we might need to emit join:user here or via connection logic
        // The mock socket handles 'join:project' via client-side logic, 
        // but real server expects 'join:user' on connection for this specific implementation
        if (newSocket.emit) {
             newSocket.emit('join:user', user.id);
        }
    }

    return () => {
      if (newSocket.disconnect) newSocket.disconnect();
    };
  }, [user?.id]); // Reconnect when user changes (login/logout)

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  // It's okay if socket is null briefly during init
  return context;
};