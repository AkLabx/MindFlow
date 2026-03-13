import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'offline' | 'sync' | 'loading' | 'promotional';

export interface ToastOptions {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number; // 0 for persistent
}

export type PopupVariant = 'success' | 'error' | 'warning' | 'info' | 'promotional';

export interface PopupAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface PopupOptions {
  variant: PopupVariant;
  title: string;
  message: ReactNode;
  actions?: PopupAction[];
  onClose?: () => void;
  dismissible?: boolean;
}

interface NotificationContextType {
  toasts: ToastOptions[];
  activePopup: PopupOptions | null;
  showToast: (options: Omit<ToastOptions, 'id'>) => void;
  removeToast: (id: string) => void;
  showPopup: (options: PopupOptions) => void;
  closePopup: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);
  const [activePopup, setActivePopup] = useState<PopupOptions | null>(null);

  const showToast = useCallback((options: Omit<ToastOptions, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      // Limit to 3-5 toasts (we'll enforce 3 in the UI/stack logic or here)
      const newToasts = [...prev, { ...options, id }];
      if (newToasts.length > 5) {
        return newToasts.slice(newToasts.length - 5);
      }
      return newToasts;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showPopup = useCallback((options: PopupOptions) => {
    setActivePopup(options);
  }, []);

  const closePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ toasts, activePopup, showToast, removeToast, showPopup, closePopup }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
