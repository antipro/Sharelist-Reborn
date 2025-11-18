import React, { createContext, useContext, useEffect, useState } from 'react';
import { MockSocket } from '../services/mockService';

const SocketContext = createContext<MockSocket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize synchronously so the socket instance is ready immediately.
  // Passing a function to useState ensures this only runs once.
  const [socket] = useState(() => new MockSocket());

  useEffect(() => {
    // In a real implementation, you might handle connection events here.
    // const newSocket = io(SERVER_URL);
    // setSocket(newSocket);
    
    return () => {
      // socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};