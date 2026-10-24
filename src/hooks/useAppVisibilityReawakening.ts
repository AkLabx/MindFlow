import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function useAppVisibilityReawakening() {
  const queryClient = useQueryClient();
  const isRefreshing = useRef(false);
  const lastHiddenTime = useRef<number | null>(null);

  useEffect(() => {
    const handleReawaken = async () => {
      // 1. Tell React Query that the network is back online IMMEDIATELY.
      // This forces React Query to retry any stalled "pending" queries.
      queryClient.resumePausedMutations();
      focusManager.setFocused(true);
      onlineManager.setOnline(true);

      // Layer 1 - Silent Recovery
      // Check how long the app was hidden
      let wasHiddenLongTime = false;
      if (lastHiddenTime.current) {
        const hiddenDuration = Date.now() - lastHiddenTime.current;
        const FIFTEEN_MINUTES = 15 * 60 * 1000;
        if (hiddenDuration > FIFTEEN_MINUTES) {
          wasHiddenLongTime = true;
          console.log('[VisibilityReawakening] App resumed after long inactivity, performing silent recovery.');
        }
      }

      // Reset hidden time now that we're awake
      lastHiddenTime.current = null;

      // 2. Prevent overlapping/concurrent getSession calls during rapid wake cycles.
      if (isRefreshing.current) {
          console.warn('[AuthStabilization] handleReawaken aborted: auth refresh already in progress.');
          return;
      }

      isRefreshing.current = true;
      try {
          if (wasHiddenLongTime) {
              // Force refresh the session
              await supabase.auth.refreshSession();
              // Invalidate queries to ensure fresh data
              queryClient.invalidateQueries();
          } else {
              // Await the strictly-timeout-wrapped getSession
              await supabase.auth.getSession();
          }
      } catch (error: any) {
          console.error('[AuthStabilization] Background session refresh failed or timed out:', error);
      } finally {
          // Small debounce buffer to prevent spamming
          setTimeout(() => {
              isRefreshing.current = false;
          }, 2000);
      }
    };

    const handleSleep = () => {
        lastHiddenTime.current = Date.now();
        focusManager.setFocused(false);
    };

    // Web / PWA listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleReawaken();
      } else {
        handleSleep();
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
          handleSleep();
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
