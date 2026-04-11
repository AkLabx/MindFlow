import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../hooks/useNotifications';
import { cn } from '../../../utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
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

  if (!user) return null;

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    setIsOpen(false);

    if (notification.link) {
      if (notification.link.startsWith('http')) {
        window.open(notification.link, '_blank');
      } else {
        navigate(notification.link);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) refresh();
        }}
        className={cn(
          "relative p-2 rounded-full transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          isOpen ? "bg-gray-100 dark:bg-gray-800" : ""
        )}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50 origin-top-right"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto overscroll-contain">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full text-left p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-start gap-3",
                        !notification.is_read ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                      )}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                        !notification.is_read ? "bg-indigo-500" : "bg-transparent"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate mb-0.5",
                          !notification.is_read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Open settings modal - would need to hook into the main layout's state
                    document.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'notifications' } }));
                  }}
                  className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Notification Settings
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
