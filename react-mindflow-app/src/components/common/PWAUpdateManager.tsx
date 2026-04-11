import React, { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useNotification } from '../../stores/useNotificationStore';

export const PWAUpdateManager: React.FC = () => {
  const { showToast } = useNotification();
  const [isIdle, setIsIdle] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_TIME_MS = 5000; // 5 seconds of inactivity
  const intervalMS = 60 * 60 * 1000; // 1 hour for background check

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (!r) return;

      // Periodically check for updates to bypass GitHub Pages cache issues
      setInterval(() => {
        if (!(!r.installing && navigator)) return;
        if (('connection' in navigator) && !navigator.onLine) return;
        r.update();
      }, intervalMS);

      // Force check when app becomes visible again
      document.addEventListener('visibilitychange', () => {
         if (document.visibilityState === 'visible') {
             r.update();
         }
      });
    },
    onNeedRefresh() {
       // Notify user silently that an update is pending
       showToast({
           title: "Update Available",
           message: "Downloading new version...",
           variant: "info",
       });

       // Reset idle timer initially just to be safe
       resetIdleTimer();
    }
  });

  // Smart Idle Detection Logic
  const resetIdleTimer = () => {
      if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
      }
      setIsIdle(false);
      idleTimeoutRef.current = setTimeout(() => {
          setIsIdle(true);
      }, IDLE_TIME_MS);
  };

  useEffect(() => {
      if (!needRefresh) return;

      // Setup event listeners for user activity ONLY when an update is pending
      const events = ['touchstart', 'mousemove', 'keydown', 'scroll', 'click'];

      const handleActivity = () => resetIdleTimer();

      events.forEach(event => {
          window.addEventListener(event, handleActivity);
      });

      // Start initial timer
      resetIdleTimer();

      return () => {
          events.forEach(event => {
              window.removeEventListener(event, handleActivity);
          });
          if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      };
  }, [needRefresh]);


  // Execute the update when Idle
  useEffect(() => {
      if (needRefresh && isIdle) {
          const performSmartReload = async () => {
              try {
                  const quizStateStr = localStorage.getItem('mindflow-quiz-session');
                  if (quizStateStr) {
                     const quizState = JSON.parse(quizStateStr);
                     if (quizState.status === 'quiz') {
                         // Pause and Save to IndexedDB
                         const { db } = await import('../../lib/db');
                         const { supabase } = await import('../../lib/supabase');
                         const { data } = await supabase.auth.getSession();

                         const pausedState = { ...quizState, isPaused: true };
                         localStorage.setItem('mindflow-quiz-session', JSON.stringify(pausedState));

                         if (data.session) {
                             await db.saveActiveSession(data.session.user.id, pausedState);
                         }
                     }
                  }

                  // Set a flag to indicate that we forcefully auto-updated
                  localStorage.setItem('mindflow_auto_updated', 'true');

              } catch (error) {
                  console.error('Failed to save state during auto-update', error);
              } finally {
                  // Force activate new SW and reload
                  updateServiceWorker(true);
              }
          };

          performSmartReload();
      }
  }, [needRefresh, isIdle, updateServiceWorker]);

  return null; // Silent Background Component
};
