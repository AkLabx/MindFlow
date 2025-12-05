import React from 'react';
import { SettingsProvider } from '../context/SettingsContext';
import { AuthProvider } from '../features/auth/context/AuthContext';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Global application provider component.
 *
 * This component acts as a wrapper for all global context providers in the application.
 * It ensures that the context hierarchy is structured correctly (e.g., SettingsProvider wraps AuthProvider).
 * Centralizing providers here cleans up the main entry point (App.tsx or index.tsx).
 *
 * @param {AppProviderProps} props - The component properties.
 * @param {React.ReactNode} props.children - The child components (the rest of the app).
 * @returns {JSX.Element} The composed provider tree.
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <SettingsProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SettingsProvider>
  );
};
