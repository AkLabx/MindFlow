import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { App as CapacitorApp } from '@capacitor/app';
import { telemetry } from '@/lib/telemetry/telemetryService';
import { extractAuthHashParams } from '@/features/auth/utils/authRedirect';

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
    // Listen for native Android deep links
    const appUrlListener = CapacitorApp.addListener('appUrlOpen', data => {
        const sanitizedUrl = data.url
            ? data.url.replace(/access_token=[^&]+/g, 'access_token=[REDACTED]').replace(/refresh_token=[^&]+/g, 'refresh_token=[REDACTED]')
            : '';
        console.log('App opened with URL:', sanitizedUrl);
        if (data.url && data.url.includes('mindflow://')) {
            const path = data.url.split('mindflow://')[1];
            if (data.url.includes('access_token=') && data.url.includes('#')) {
                const fragment = data.url.slice(data.url.indexOf('#'));
                const deepParams = extractAuthHashParams(fragment);
                const accessToken = deepParams.get('access_token');
                const refreshToken = deepParams.get('refresh_token');
                const isRecovery = deepParams.get('type') === 'recovery' || data.url.includes('reset-password');
                if (accessToken && refreshToken) {
                    supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    }).catch((err) => console.error('[Bootstrap] Deep-link setSession error:', err));
                }
                window.location.hash = isRecovery ? '#/reset-password' : '#/';
                return;
            }
            if (path) {
                window.location.hash = '#/' + path.replace(/^\/+/, '');
            }
        }
    });
    let isMounted = true;

    const bootstrap = async () => {
      try {
        if (!isMounted) return;

        // --- INSTRUMENTATION FOR OAUTH DEBUGGING (SENSITIVE TOKENS REDACTED) ---
        const isSensitiveHash = window.location.hash && window.location.hash.includes('access_token=');
        console.log('[Bootstrap] Window Location:', isSensitiveHash ? window.location.origin + window.location.pathname + '#[OAUTH_TOKENS_REDACTED]' : window.location.href);
        console.log('[Bootstrap] Hash:', isSensitiveHash ? '#[OAUTH_TOKENS_REDACTED]' : window.location.hash);
        console.log('[Bootstrap] Search:', window.location.search);

        // OAuth / Email Confirmation / Recovery Hash & Query Interception for HashRouter
        const currentHash = window.location.hash;
        const currentSearch = window.location.search;
        const searchParams = new URLSearchParams(currentSearch);
        const pkceCode = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');
        const queryType = searchParams.get('type');
        const hashParams = extractAuthHashParams(currentHash);
        const redirectErrorDesc =
          searchParams.get('error_description') ||
          hashParams.get('error_description') ||
          searchParams.get('error') ||
          hashParams.get('error');

        if (redirectErrorDesc) {
          try {
            sessionStorage.setItem('mindflow_auth_redirect_error', redirectErrorDesc);
          } catch {}
          window.history.replaceState(null, '', window.location.pathname + '#/');
        } else if ((currentHash && currentHash.includes('access_token=')) || pkceCode || tokenHash) {
          try {
            sessionStorage.setItem('mindflow_auth_hydrating', 'true');
          } catch {}
          console.log('[Bootstrap] Detected auth redirect payload. Delaying router to let Supabase process it.');

          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const linkType = hashParams.get('type') || queryType || '';
          const isRecovery = linkType === 'recovery' || currentHash.includes('type=recovery') || currentHash.includes('reset-password');
          const isEmailVerification = linkType === 'signup' || linkType === 'email' || linkType === 'magiclink';

          // Immediately sanitize address bar to protect against live streaming / shoulder-surfing leaks
          sessionStorage.setItem('mindflow_booted', 'true');
          const sanitizedTargetHash = isRecovery ? '#/reset-password' : '#/';
          window.history.replaceState(null, '', window.location.pathname + sanitizedTargetHash);
          console.log('[Bootstrap] Sanitized URL address bar immediately prior to session initialization.');

          let sessionEstablished = false;
          try {
            if (accessToken && refreshToken) {
              console.log('[Bootstrap] Manually setting Supabase session from HashRouter URL parameters.');
              const { data: setData, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              if (error) console.error('[Bootstrap] Manual setSession error:', error);
              else {
                sessionEstablished = Boolean(setData?.session);
                console.log('[Bootstrap] Manual setSession success.');
              }
            } else if (pkceCode && typeof (supabase.auth as any).exchangeCodeForSession === 'function') {
              console.log('[Bootstrap] Exchanging PKCE code for Supabase session.');
              const { data: exData, error } = await (supabase.auth as any).exchangeCodeForSession(pkceCode);
              if (error) console.error('[Bootstrap] PKCE exchangeCodeForSession error:', error);
              else sessionEstablished = Boolean(exData?.session);
            } else if (tokenHash && queryType && typeof (supabase.auth as any).verifyOtp === 'function') {
              console.log('[Bootstrap] Verifying token_hash OTP for Supabase session.');
              const { data: otpData, error } = await (supabase.auth as any).verifyOtp({
                token_hash: tokenHash,
                type: queryType,
              });
              if (error) console.error('[Bootstrap] verifyOtp error:', error);
              else sessionEstablished = Boolean(otpData?.session);
            } else {
              console.log('[Bootstrap] Calling getSession to let Supabase process remaining auth state.');
              const { data: sessData } = await supabase.auth.getSession();
              sessionEstablished = Boolean(sessData?.session);
            }
          } finally {
            try {
              sessionStorage.removeItem('mindflow_auth_hydrating');
            } catch {}
          }

          if (sessionEstablished && isEmailVerification) {
            try {
              sessionStorage.setItem('mindflow_email_verified_notice', 'true');
            } catch {}
            try {
              if (typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('mindflow-auth-sync');
                channel.postMessage({ type: 'AUTH_CONFIRMED' });
                channel.close();
              }
            } catch {}
          }

          console.log('[Bootstrap] Supabase processed auth redirect.');
        }
        // ------------------------------------------

        console.log('[Bootstrap] Finished preliminary steps (hash interception).');
        // 1. Load Config & Feature Flags
        // (Placeholder for fetching remote config via RPC/Supabase)

        // 2. Initialize Supabase & Restore Session
        let hasActiveSession = false;
        try {
          console.log('[Bootstrap] Initializing Supabase & Restoring Session...');
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
              console.error('[Bootstrap] Supabase getSession error:', error);
          } else {
              hasActiveSession = !!session;
              console.log('[Bootstrap] Supabase getSession success. Has session?', !!session);
          }
        } catch (authErr) {
          console.error('[Bootstrap] Auth session restore failed, continuing for potential offline/guest logic:', authErr);
        }

        // 3. Initialize IndexedDB
        // Ensure DB is accessible
        try {
           // We perform a benign query to awake IDB
           // e.g. await db.getConfig()
        } catch (idbErr) {
           console.warn("IDB init warning, proceeding anyway:", idbErr);
        }

        // 4. Hydrate Zustand Stores & Theme
        // Zustand persist handles hydration automatically,
        // but we ensure basic availability here if needed.

        // 5. Initialize Services / AI
        // (Placeholder for preparing Web Workers if needed)

        // 6. Check App Version & Maintenance
        // (Placeholder for future maintenance screen logic)
        // const isMaintenance = false;
        // if (isMaintenance) {
        //    setState({ stage: 'MAINTENANCE', error: null, isReady: false });
        //    return;
        // }

        if (!isMounted) return;
        setState({ stage: 'READY', error: null, isReady: true });

        // Emit telemetry for app startup
        telemetry.emit('app_opened', {
          is_authenticated: hasActiveSession,
        });

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
      appUrlListener.then(l => l.remove());
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
};
