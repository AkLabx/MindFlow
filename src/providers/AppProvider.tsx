import React from 'react';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { ThemeAndBrandingInjector } from './ThemeAndBrandingInjector';
import { ToastContainer } from '../components/ui/Notification/ToastContainer';
import { Popup } from '../components/ui/Notification/Popup';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeAndBrandingInjector>
        <AuthProvider>
          {children}
          <ToastContainer />
          <Popup />
        </AuthProvider>
      </ThemeAndBrandingInjector>
    </QueryClientProvider>
  );
};
