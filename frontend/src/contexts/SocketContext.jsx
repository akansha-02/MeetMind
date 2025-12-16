import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const auth = useAuth(); // Get the whole auth object first
  const { isAuthenticated } = auth || {}; // Handle undefined gracefully
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only proceed if auth is ready (not loading)
    if (auth?.loading) return;

    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      const newSocket = connectSocket(token);
      setSocket(newSocket);

      return () => {
        disconnectSocket();
        setSocket(null);
      };
    } else {
      disconnectSocket();
      setSocket(null);
    }
  }, [isAuthenticated, auth?.loading]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
