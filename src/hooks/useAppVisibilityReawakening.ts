import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useNotificationStore } from '../stores/useNotificationStore';

export function useAppVisibilityReawakening() {
  const queryClient = useQueryClient();
  const lastRecoverAtRef = useRef(0);

  useEffect(() => {
    const recoverApp = async (source: string) => {
      const now = Date.now();
      // Throttle recovery to prevent event storms
      if (now - lastRecoverAtRef.current < 1500) return;
      lastRecoverAtRef.current = now;

      console.log(`App woke up (source: ${source})! Forcing session refresh and network reconnect...`);

      // 1. Force Supabase to check and refresh the auth session
      await supabase.auth.getSession();

      // 2. Resume paused mutations
      await queryClient.resumePausedMutations();

      // 3. Invalidate queries to ensure no stale data
      await queryClient.invalidateQueries();

      // 4. Force refetch active queries
      await queryClient.refetchQueries({ type: 'active' });
    };

    // Web / PWA listener
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      focusManager.setFocused(isVisible);

      if (isVisible) {
        onlineManager.setOnline(navigator.onLine);
        recoverApp('visibilitychange');
      }
    };

    const handleOnline = () => {
      onlineManager.setOnline(true);
      useNotificationStore.getState().showToast({
        title: "Back Online",
        message: "Connection restored. Syncing...",
        variant: "sync" // Assuming 'sync' is a valid variant, fallback to 'success' if needed
      });
      recoverApp('online');
    };

    const handleOffline = () => {
      onlineManager.setOnline(false);
      useNotificationStore.getState().showToast({
        title: "You are Offline",
        message: "Changes will be saved locally and synced when you reconnect.",
        variant: "offline" // Assuming 'offline' is a valid variant, fallback to 'error' if needed
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Native App (Capacitor) listener
    let capListener: any = null;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        focusManager.setFocused(isActive);
        if (isActive) {
          onlineManager.setOnline(true);
          recoverApp('capacitor-appStateChange');
        }
      }).then(listener => {
         capListener = listener;
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (capListener) {
        capListener.remove();
      }
    };
  }, [queryClient]);
}
