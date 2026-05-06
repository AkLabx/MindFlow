import React from 'react';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { ToastContainer } from '../components/ui/Notification/ToastContainer';
import { Popup } from '../components/ui/Notification/Popup';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Global application provider component.
 *
 * This component acts as a wrapper for all global context providers in the application.
 * It ensures that the context hierarchy is structured correctly (e.g., AuthProvider).
 * Centralizing providers here cleans up the main entry point (App.tsx or index.tsx).
 *
 * @param {AppProviderProps} props - The component properties.
 * @param {React.ReactNode} props.children - The child components (the rest of the app).
 * @returns {JSX.Element} The composed provider tree.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      {children}
      <ToastContainer />
      <Popup />
    </AuthProvider>
    </QueryClientProvider>
  );
};
