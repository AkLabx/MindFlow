import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function useAppVisibilityReawakening() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleReawaken = async () => {
      console.log('App woke up! Forcing session refresh and network reconnect...');

      // 1. Force Supabase to check and refresh the auth session
      await supabase.auth.getSession();

      // 2. Tell React Query that the network is back online
      // This forces React Query to retry any stalled "pending" queries
      queryClient.resumePausedMutations();
    };


    const handleOnlineStatus = () => {
        onlineManager.setOnline(navigator.onLine);
        if (navigator.onLine) {
            handleReawaken();
        }
    };

    const handleFocusStatus = () => {
        focusManager.setFocused(document.hasFocus());
        if (document.hasFocus()) {
            handleReawaken();
        }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    window.addEventListener('focus', handleFocusStatus);
    window.addEventListener('blur', handleFocusStatus);

    // Web / PWA listener

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleReawaken();
        // Manually force React Query to recognize the window is focused and online
        focusManager.setFocused(true);
        onlineManager.setOnline(true);
      } else {
        // Tell React Query we are asleep so it pauses background fetching
        focusManager.setFocused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Native App (Capacitor) listener
    let capListener: any = null;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          handleReawaken();
          // Manually force React Query to recognize the window is focused and online in Native WebViews
          focusManager.setFocused(true);
          onlineManager.setOnline(true);
        } else {
          // Tell React Query we are asleep so it pauses background fetching
          focusManager.setFocused(false);
        }
      }).then(listener => {
         capListener = listener;
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      window.removeEventListener('focus', handleFocusStatus);
      window.removeEventListener('blur', handleFocusStatus);
      if (capListener) {
        capListener.remove();
      }
    };
  }, [queryClient]);
}
