import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [incomingRequest, setIncomingRequest] = useState(null);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = 'http://127.0.0.1:5000';
    const newSocket = io(socketUrl);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      newSocket.emit('register', { userId: user._id, role: user.role });
    });

    newSocket.on('new_blood_request', (data) => {
      console.log('Received new blood request', data);
      setIncomingRequest(data);
      addToast(data.message, 'warning');
    });

    newSocket.on('request_updated', (data) => {
      console.log('Received request update', data);
      addToast(data.message || `Request status updated: ${data.status}`, 'info');
      const event = new CustomEvent('requestUpdated', { detail: data });
      window.dispatchEvent(event);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, toasts, incomingRequest, setIncomingRequest, addToast, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};
