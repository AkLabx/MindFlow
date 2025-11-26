import React from 'react';
import { SettingsProvider } from '../context/SettingsContext';
import { AuthProvider } from '../features/auth/context/AuthContext';

// In a real app, this would compose ThemeProvider, AuthProvider, QueryClientProvider etc.
interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <SettingsProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SettingsProvider>
  );
};