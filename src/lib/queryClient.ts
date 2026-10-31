import { QueryClient, onlineManager } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Diagnostic instrumentation for monitoring query and mutation states
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'fetch') {
    if (import.meta.env.DEV) {
      console.log(`[Diagnostic-RQ] Query fetching started: ${event.query.queryHash}`);
    }
  }
  if (event.type === 'updated' && event.action.type === 'pause') {
    if (import.meta.env.DEV) {
      console.log(`[Diagnostic-RQ] Query PAUSED: ${event.query.queryHash}`);
    }
  }
  if (event.type === 'updated' && event.action.type === 'error') {
    console.error(`[Diagnostic-RQ] Query ERROR: ${event.query.queryHash}`, event.query.state.error);
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event.type === 'updated' && event.action?.type === 'pending') {
    if (import.meta.env.DEV) {
      console.log(`[Diagnostic-RQ] Mutation pending:`, event.mutation.options.mutationKey);
    }
  }
  if (event.type === 'updated' && event.action?.type === 'pause') {
    if (import.meta.env.DEV) {
      console.log(`[Diagnostic-RQ] Mutation PAUSED:`, event.mutation.options.mutationKey);
    }
  }
});

onlineManager.subscribe((isOnline) => {
  if (import.meta.env.DEV) {
    console.log(`[Diagnostic-RQ] onlineManager status changed. isOnline: ${isOnline}`);
  }
});

// Attach queryClient to window for diagnostics and recovery
if (typeof window !== 'undefined') {
  (window as any).__queryClient = queryClient;
}
