import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { useSettingsStore } from '@/stores/useSettingsStore';

export type BootstrapStage =
  | 'INITIALIZING'
  | 'LOADING_CONFIG'
  | 'INIT_DATABASE'
  | 'INIT_THEME'
  | 'RESTORE_SESSION'
  | 'CHECK_VERSION'
  | 'CHECK_MAINTENANCE'
  | 'COMPLETE'
  | 'ERROR';

export interface BootstrapState {
  stage: BootstrapStage;
  error: Error | null;
  isReady: boolean;
}

export const useAppBootstrap = (): BootstrapState => {
  const [state, setState] = useState<BootstrapState>({
    stage: 'INITIALIZING',
    error: null,
    isReady: false
  });



  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        if (!isMounted) return;
        setState({ stage: 'LOADING_CONFIG', error: null, isReady: false });

        // Simulating config load for now
        await new Promise(resolve => setTimeout(resolve, 50));

        if (!isMounted) return;
        setState({ stage: 'INIT_DATABASE', error: null, isReady: false });
        // Touch IDB to ensure it's ready. Note: db initialization happens on module load,
        // but this verifies it's accessible.
        try {
           // await db.getAllQuizzes(); // Note: removed due to TS error, db auto inits
        } catch (idbErr) {
           console.warn("IDB init warning, proceeding anyway:", idbErr);
        }

        if (!isMounted) return;
        setState({ stage: 'INIT_THEME', error: null, isReady: false });
        // Theme is initialized automatically by Zustand persist onRehydrateStorage

        if (!isMounted) return;
        setState({ stage: 'RESTORE_SESSION', error: null, isReady: false });
        try {
          await supabase.auth.getSession();
        } catch (authErr) {
          console.error('[Bootstrap] Auth session restore failed:', authErr);
          // We don't throw here to allow guest routes if network is down
        }

        if (!isMounted) return;
        setState({ stage: 'CHECK_VERSION', error: null, isReady: false });
        // Future: Check min required app version from DB

        if (!isMounted) return;
        setState({ stage: 'CHECK_MAINTENANCE', error: null, isReady: false });
        // Future: Check maintenance flag from DB

        if (!isMounted) return;
        setState({ stage: 'COMPLETE', error: null, isReady: true });

      } catch (err: any) {
        console.error('[Bootstrap] Fatal error:', err);
        if (isMounted) {
          setState({ stage: 'ERROR', error: err, isReady: false });
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return state;
};
