import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { markAsRead, markAllAsRead } from '../services/notifications.service';
import type { Notification } from '../services/notifications.service';
import { useNotifications } from '../context/NotificationContext';

interface NotificationDropdownProps {
  onNotificationClick?: (notification: Notification) => void;
}

export default function NotificationDropdown({ onNotificationClick }: NotificationDropdownProps) {
  const { notifications, unreadCount, refreshNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      refreshNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      refreshNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    onNotificationClick?.(notification);
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application_accepted':
        return '✅';
      case 'application_rejected':
        return '❌';
      case 'submission_approved':
        return '🎉';
      case 'new_application':
        return '👥';
      case 'submission_received':
        return '📄';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-violet-600 transition-all duration-200 group"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                >
                  <CheckIcon className="h-4 w-4" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                <div className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                  Loading notifications...
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BellIcon className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-600">No notifications yet</p>
                <p className="text-sm text-slate-500 mt-1">We'll notify you when something arrives</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition-all duration-200 hover:bg-slate-50 group ${
                    !notification.read ? 'bg-blue-50/50 hover:bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-violet-100 to-purple-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${!notification.read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-2 font-medium">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-sm font-medium text-slate-600 hover:text-slate-800 py-2 rounded-lg hover:bg-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}