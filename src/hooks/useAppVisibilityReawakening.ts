import { useEffect } from 'react';
import { useQueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useRecoveryStore } from '../stores/useRecoveryStore';

export function useAppVisibilityReawakening() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleReawaken = () => {
      // 1. Tell React Query that the network is back online IMMEDIATELY.
      // This forces React Query to retry any stalled "pending" queries.
      queryClient.resumePausedMutations();
      focusManager.setFocused(true);
      onlineManager.setOnline(true);

      const { setStatus, status } = useRecoveryStore.getState();

      // Update the state machine. We do NOT forcefully refresh the session here anymore.
      // We lazily rely on the Fetch and Auth Interceptors to trigger RecoveryManager
      // only if the first outgoing request actually fails due to staleness.
      if (status === 'HIDDEN') {
         setStatus('RESUMED', 'App returned to foreground');
      }
    };

    const handleSuspend = () => {
        focusManager.setFocused(false);
        const { setStatus, status } = useRecoveryStore.getState();
        if (status === 'HEALTHY' || status === 'RECOVERED' || status === 'RESUMED') {
            setStatus('HIDDEN', 'App went to background');
        }
    };

    // Web / PWA listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleReawaken();
      } else {
        handleSuspend();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Native App (Capacitor) listener
    let capListener: any = null;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          handleReawaken();
        } else {
          handleSuspend();
        }
      }).then(listener => {
         capListener = listener;
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (capListener) {
        capListener.remove();
      }
    };
  }, [queryClient]);
}
