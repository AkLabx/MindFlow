import { createClient } from '@supabase/supabase-js';
import { fetchWithTimeout } from './fetchWithTimeout';
import { triggerAppRecovery, getIsInternalRecoveryCall } from './recovery/RecoveryManager';

export const SUPABASE_URL = 'https://sjcfagpjstbfxuiwhlps.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqY2ZhZ3Bqc3RiZnh1aXdobHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDQ5OTUsImV4cCI6MjA3NjUyMDk5NX0.8p6tIdBum2uhi0mRYENtF81WryaVlZFCwukwAAwJwJA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: fetchWithTimeout }
});

// --- AUTH RUNTIME STABILIZATION: HARD MUTEX TIMEOUTS & RECOVERY ---
// The gotrue-js client uses an internal promise queue (mutex).
// If an operation (like a background refresh during network transition) silently hangs,
// it permanently poisons the singleton, blocking all future auth calls (getSession, signOut).
// We wrap all critical auth methods in a strict Promise.race to force them to reject,
// preventing the mutex from locking the entire app runtime.
// Furthermore, we intercept 'AbortError' from broken locks and trigger our RecoveryManager.

const AUTH_TIMEOUT_MS = 2500; // 2.5 seconds max for any auth operation (fast-fail on Web Locks contention)

export const hasStoredAuthToken = (): boolean => {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = window.localStorage.getItem(key);
        if (val && val !== 'null' && val !== 'undefined') return true;
      }
    }
  } catch {
    return false;
  }
  return false;
};

export const hasOAuthHash = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  return hash.includes('access_token=') || hash.includes('refresh_token=');
};

const withAuthTimeout = async <T>(
    operationName: string,
    operation: () => Promise<T>,
    retryCount: number = 0
): Promise<T> => {
    // Determine timeout: guest cold-start without token gets a swift 1500ms timeout
    const effectiveTimeout = (!hasStoredAuthToken() && !hasOAuthHash() && operationName === 'getSession')
      ? 1500
      : AUTH_TIMEOUT_MS;

    try {
        const result = await new Promise<T>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                console.error(`[AuthStabilization] ${operationName} exceeded ${effectiveTimeout}ms timeout. Forcing rejection to unblock mutex.`);
                reject(new Error(`AuthTimeout: ${operationName} hung permanently.`));
            }, effectiveTimeout);

            operation()
                .then((res) => {
                    clearTimeout(timeoutId);
                    resolve(res);
                })
                .catch((err) => {
                    clearTimeout(timeoutId);
                    reject(err);
                });
        });

        return result;
    } catch (err: any) {
        // Internal gotrue-js lock breaks throw AbortError with 'Lock broken'
        const isLockBroken = err.name === 'AbortError' && err.message?.includes('Lock broken');

        // If the auth operation failed due to a stolen/broken lock caused by rapid wake cycles,
        // and we haven't already retried this specific call, trigger a centralized recovery.
        // We ensure we don't trigger recovery if the call was initiated BY the RecoveryManager itself.
        if (retryCount === 0 && isLockBroken && !getIsInternalRecoveryCall()) {
             console.warn(`[Auth Interceptor] Caught lock broken error in ${operationName}. Triggering auto-recovery...`);
             const recovered = await triggerAppRecovery(`Auth Lock broken in ${operationName}`);

             if (recovered) {
                 const backoffDelay = 1000;
                 console.log(`[Auth Interceptor] Auto-recovery successful. Retrying ${operationName} in ${backoffDelay}ms...`);
                 await new Promise(r => setTimeout(r, backoffDelay));
                 return withAuthTimeout(operationName, operation, retryCount + 1);
             } else {
                 console.error(`[Auth Interceptor] Auto-recovery failed. Propagating original error.`);
             }
        }

        throw err;
    }
};

const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
supabase.auth.getSession = async (...args) => {
    return withAuthTimeout('getSession', () => originalGetSession(...args));
};

const originalSignOut = supabase.auth.signOut.bind(supabase.auth);
supabase.auth.signOut = async (...args) => {
    return withAuthTimeout('signOut', () => originalSignOut(...args));
};

const originalRefreshSession = supabase.auth.refreshSession.bind(supabase.auth);
supabase.auth.refreshSession = async (...args) => {
    return withAuthTimeout('refreshSession', () => originalRefreshSession(...args));
};

const originalGetUser = supabase.auth.getUser.bind(supabase.auth);
supabase.auth.getUser = async (...args) => {
    return withAuthTimeout('getUser', () => originalGetUser(...args));
};
// -------------------------------------------------------
