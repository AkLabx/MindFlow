import React from 'react';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { ThemeAndBrandingInjector } from './ThemeAndBrandingInjector';
import { ToastContainer } from '../components/ui/Notification/ToastContainer';
import { Popup } from '../components/ui/Notification/Popup';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { staleRecoveryManager } from '../features/core/recovery/StaleRecoveryManager';

interface AppProviderProps {
  children: React.ReactNode;
}

const handleGlobalRetry = (failureCount: number, error: Error) => {
    // Only intercept and auto-recover on the very first failure of a stale network signature
    if (failureCount === 0 && staleRecoveryManager.isStaleSessionError(error)) {
        // Trigger a background recovery, which will resolve before the retry triggers.
        // Return true to tell React Query to definitely retry this.
        console.warn(`[ReactQuery Auto-Recovery] Intercepted stale error: ${error.message}. Attempting recovery before retry...`);
        // We trigger the promise but don't await it here;
        // React Query's delay function will ensure time passes before the next attempt,
        // giving the recovery attempt time to complete.
        staleRecoveryManager.attemptRecovery().catch(console.error);
        return true;
    }

    // Default retry logic for subsequent failures
    return failureCount < 1;
};

const globalRetryDelay = (attemptIndex: number) => {
    // If it's the first attempt (index 0 implies failureCount 0 before returning true for retry 1)
    // we want a longer delay to give StaleRecoveryManager time to refresh the session.
    return attemptIndex === 0 ? 3000 : Math.min(1000 * 2 ** attemptIndex, 30000);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: handleGlobalRetry,
      retryDelay: globalRetryDelay,
    },
    mutations: {
      retry: handleGlobalRetry,
      retryDelay: globalRetryDelay,
    }
  },
});

// --- DIAGNOSTIC INSTRUMENTATION ---
queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'fetch') {
        console.log(`[Diagnostic-RQ] Query fetching started: ${event.query.queryHash}`);
    }
    if (event.type === 'updated' && event.action.type === 'pause') {
        console.log(`[Diagnostic-RQ] Query PAUSED: ${event.query.queryHash}`);
    }
    if (event.type === 'updated' && event.action.type === 'error') {
        console.log(`[Diagnostic-RQ] Query ERROR: ${event.query.queryHash}`);
    }
});

queryClient.getMutationCache().subscribe((event) => {
    if (event.type === 'updated' && event.action?.type === 'pending') {
        console.log(`[Diagnostic-RQ] Mutation pending:`, event.mutation.options.mutationKey);
    }
    if (event.type === 'updated' && event.action?.type === 'pause') {
        console.log(`[Diagnostic-RQ] Mutation PAUSED:`, event.mutation.options.mutationKey);
    }
});

onlineManager.subscribe((isOnline) => {
    console.log(`[Diagnostic-RQ] onlineManager status changed. isOnline: ${isOnline}`);
});

// Attach queryClient to window for diagnostics
(window as any).__queryClient = queryClient;
// -----------------------------------

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeAndBrandingInjector><AuthProvider>
      {children}
      <ToastContainer />
      <Popup />
    </AuthProvider></ThemeAndBrandingInjector>
    </QueryClientProvider>
  );
};
