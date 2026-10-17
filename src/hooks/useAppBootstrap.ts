import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { useSettingsStore } from '@/stores/useSettingsStore';

export type BootstrapStage =
  | 'BOOTSTRAPPING'
  | 'READY'
  | 'FAILED'
  | 'MAINTENANCE'
  | 'UPDATE_REQUIRED'
  | 'OFFLINE_INITIALIZATION';

export interface BootstrapState {
  stage: BootstrapStage;
  error: Error | null;
  isReady: boolean;
}

export const useAppBootstrap = (): BootstrapState => {
  const [state, setState] = useState<BootstrapState>({
    stage: 'BOOTSTRAPPING',
    error: null,
    isReady: false
  });

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        if (!isMounted) return;

        // --- INSTRUMENTATION FOR OAUTH DEBUGGING ---
        console.log('[Bootstrap] Window Location:', window.location.href);
        console.log('[Bootstrap] Hash:', window.location.hash);
        console.log('[Bootstrap] Search:', window.location.search);

        // OAuth Hash Interception & Cleanup for HashRouter
        const currentHash = window.location.hash;
        if (currentHash && currentHash.includes('access_token=')) {
          console.log('[Bootstrap] Detected OAuth hash. Delaying router to let Supabase process it.');

          // Manually parse HashRouter format (e.g. #/#access_token=... or #/access_token=...)
          const hashString = currentHash.replace(/^#\/?#?\/?/, ''); // Removes #/, #/#, etc.
          const params = new URLSearchParams(hashString);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('[Bootstrap] Manually setting Supabase session from HashRouter URL parameters.');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (error) console.error('[Bootstrap] Manual setSession error:', error);
            else console.log('[Bootstrap] Manual setSession success.');
          }

          console.log('[Bootstrap] Supabase processed hash. Cleaning up URL.');
          // Remove the hash cleanly to prevent HashRouter from treating it as a route
          sessionStorage.setItem('mindflow_booted', 'true');
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        // ------------------------------------------

        console.log('[Bootstrap] Finished preliminary steps (hash interception).');
        // 1. Load Config & Feature Flags
        // (Placeholder for fetching remote config via RPC/Supabase)

        // 2. Initialize IndexedDB
        // Ensure DB is accessible
        try {
           // We perform a benign query to awake IDB
           // e.g. await db.getConfig()
        } catch (idbErr) {
           console.warn("IDB init warning, proceeding anyway:", idbErr);
        }

        // 3. Hydrate Zustand Stores & Theme
        // Zustand persist handles hydration automatically,
        // but we ensure basic availability here if needed.

        // 4. Initialize Services / AI
        // (Placeholder for preparing Web Workers if needed)

        // 5. Check App Version & Maintenance
        // (Placeholder for future maintenance screen logic)
        // const isMaintenance = false;
        // if (isMaintenance) {
        //    setState({ stage: 'MAINTENANCE', error: null, isReady: false });
        //    return;
        // }

        if (!isMounted) return;
        setState({ stage: 'READY', error: null, isReady: true });

      } catch (err: any) {
        console.error('[Bootstrap] Fatal error:', err);
        if (isMounted) {
          // Check if offline to potentially fall back to OFFLINE_INITIALIZATION
          if (!navigator.onLine) {
            setState({ stage: 'OFFLINE_INITIALIZATION', error: err, isReady: true });
          } else {
            setState({ stage: 'FAILED', error: err, isReady: false });
          }
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
};
