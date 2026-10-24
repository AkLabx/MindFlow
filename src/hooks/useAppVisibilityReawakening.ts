import { useEffect } from 'react';
import { useQueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useRecoveryStore } from '../stores/useRecoveryStore';

const PWA_UPDATE_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes
let lastPwaUpdateCheck = 0;

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

      // Check PWA Update without forcing a reload, with a 5-minute throttle
      if ('serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
          const now = Date.now();
          if (now - lastPwaUpdateCheck > PWA_UPDATE_THROTTLE_MS) {
              lastPwaUpdateCheck = now;
              navigator.serviceWorker.getRegistration().then(reg => {
                  if (reg) {
                      // Ping update() to check for new service worker without interrupting quizzes.
                      // PWAUpdateManager handles the UI prompt when a new SW is waiting.
                      reg.update();
                  }
              }).catch(err => console.warn('SW registration fetch failed', err));
          }
      }

      // Update the state machine.
      if (status === 'HIDDEN') {
         setStatus('RESUMED', 'App returned to foreground');
         // Auto-transition to HEALTHY after a short delay if no recovery was triggered
         setTimeout(() => {
             if (useRecoveryStore.getState().status === 'RESUMED') {
                 setStatus('HEALTHY', 'No staleness detected on resume');
             }
         }, 3000);
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
