import React from 'react';
import { SettingsProvider } from '../context/SettingsContext';

// In a real app, this would compose ThemeProvider, AuthProvider, QueryClientProvider etc.
interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <SettingsProvider>
      {children}
    </SettingsProvider>
  );
};