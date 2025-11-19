// frontend/src/context/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getNotifications } from '../services/notifications.service';
import type { Notification } from '../services/notifications.service';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  socket: Socket | null;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth() as any;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const data = await getNotifications(50, false);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      refreshNotifications();

      // Initialize socket connection
      const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000', {
        auth: {
          token: localStorage.getItem('ow_token')
        }
      });

      newSocket.on('notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      refreshNotifications,
      socket
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
