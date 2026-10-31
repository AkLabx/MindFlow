import { supabase } from '../supabase';
import { useRecoveryStore } from '../../stores/useRecoveryStore';
import { setRecoveryPromise, getRecoveryPromise, setRecoveringState } from './recoveryContext';
import { Capacitor } from '@capacitor/core';
import { queryClient } from '../queryClient';


export const RECOVERY_ENABLED = true;

// Circuit Breaker State
let recoveryFailures = 0;
let lastFailureTime = 0;
const MAX_FAILURES = 3;
const COOLDOWN_MS = 60 * 1000; // 1 minute cooldown

let isInternalRecoveryCall = false;

// We need a ref to the global queryClient to invalidate queries after a successful recovery
// It's attached to the window in AppProvider.tsx
const getQueryClient = () => queryClient;

/**
 * Executes a full session validation and potential refresh.
 */
const performRecovery = async (reason?: string): Promise<boolean> => {
    const store = useRecoveryStore.getState();
    const startTime = performance.now();

    try {
        store.setStatus('CHECKING', 'Validating network and session');

        // 1. If navigator says offline, wait up to 5 seconds for the 'online' event before failing immediately.
        // Phones waking up from deep sleep take time to re-establish Wi-Fi/LTE connections.
        if ('onLine' in navigator && !navigator.onLine) {
             console.log('[RecoveryManager] Navigator reports offline. Waiting briefly for online event...');
             await new Promise<void>((resolve) => {
                 const onOnline = () => {
                     window.removeEventListener('online', onOnline);
                     clearTimeout(timeout);
                     resolve();
                 };
                 const timeout = setTimeout(() => {
                     window.removeEventListener('online', onOnline);
                     resolve(); // Proceed anyway, let the retried fetch be the final judge
                 }, 5000);
                 window.addEventListener('online', onOnline);
             });
        }

        store.setStatus('RECOVERING', 'Refreshing auth session');

        // Re-entrancy guard
        isInternalRecoveryCall = true;

        // 2. Validate/Refresh Supabase Session
        const { data, error } = await supabase.auth.getSession();

        isInternalRecoveryCall = false;

        if (error) {
            throw error;
        }

        if (!data.session) {
             // If there is no session but also no error, the user is likely a guest/logged out.
             // This is a normal state, not a failure. We reset state and return successfully.
             store.setStatus('HEALTHY', 'No session found (guest state)');
             return true;
        }

        const durationMs = performance.now() - startTime;
        store.logRecoveryAttempt({ success: true, durationMs, reason });

        // Persist to analytics (fire-and-forget, bypassing recovery on fail via the `isSafeToRetry` allowlist)
        supabase.from('analytics_events').insert({
            event_name: 'session_recovery',
            event_data: {
                success: true,
                duration_ms: durationMs,
                reason,
                platform: Capacitor.getPlatform(),
                version: import.meta.env.VITE_APP_VERSION,
            }
        }).then(({ error }) => {
            if (error) console.warn('[RecoveryManager] Failed to persist telemetry', error);
        });

        store.setStatus('RECOVERED', 'Session active and network ready');

        // 3. Post-Recovery Global Refetch
        // We explicitly invalidate all errored or active queries to ensure the UI
        // repaints correctly without needing a hard refresh.
        const queryClient = getQueryClient();
        if (queryClient) {
             console.log('[RecoveryManager] Invalidating queries to refresh UI state...');
             queryClient.invalidateQueries({
                 predicate: (query) => query.state.status === 'error' || query.isActive()
             });
        }

        // Hide banner after 2 seconds and return to healthy
        setTimeout(() => {
            if (useRecoveryStore.getState().status === 'RECOVERED') {
                 useRecoveryStore.getState().resetStatus();
            }
        }, 2000);

        return true;

    } catch (error: any) {
        isInternalRecoveryCall = false;
        const durationMs = performance.now() - startTime;
        console.error('[RecoveryManager] Recovery failed:', error);

        const errorMessage = error?.message || 'Unknown error';
        const errorClass = error?.name || 'Error';
        const errorCode = error?.code || 'unknown'; // AuthApiError codes like 'invalid_grant'

        store.logRecoveryAttempt({
            success: false,
            durationMs,
            error: errorMessage,
            reason: reason || 'Recovery procedure failed',
            errorCode
        });

         // Persist to analytics
         supabase.from('analytics_events').insert({
            event_name: 'session_recovery',
            event_data: {
                success: false,
                duration_ms: durationMs,
                reason,
                error: errorMessage,
                error_class: errorClass,
                error_code: errorCode,
                platform: Capacitor.getPlatform(),
                version: import.meta.env.VITE_APP_VERSION
            }
        }).then(({ error }) => {
            if (error) console.warn('[RecoveryManager] Failed to persist telemetry', error);
        });

        recoveryFailures++;
        lastFailureTime = Date.now();
        store.setStatus('FAILED', errorMessage);
        return false;
    }
};

/**
 * Triggers the recovery flow. If a recovery is already in progress, it returns
 * the existing promise to prevent concurrent identical recovery attempts.
 */
export const triggerAppRecovery = (reason?: string): Promise<boolean> => {
    if (!RECOVERY_ENABLED) return Promise.resolve(false);

    // Circuit Breaker Check
    const now = Date.now();
    if (now - lastFailureTime > COOLDOWN_MS) {
        recoveryFailures = 0; // Reset if cooldown period passed
    }
    if (recoveryFailures >= MAX_FAILURES) {
        console.warn(`[RecoveryManager] Circuit breaker open. Too many recent failures. Skipping recovery for: ${reason}`);
        return Promise.resolve(false);
    }

    // If an internal recovery call is already active, we shouldn't trigger another one
    // to prevent infinite loops (re-entrancy guard)
    if (isInternalRecoveryCall) {
        console.warn(`[RecoveryManager] Re-entrant recovery call detected. Aborting to prevent loop.`);
        return Promise.resolve(false);
    }

    const existingPromise = getRecoveryPromise();
    if (existingPromise) {
        console.log(`[RecoveryManager] Joining existing recovery in progress... (Triggered by: ${reason})`);
        return existingPromise;
    }

    setRecoveringState(true);

    // Create the promise and store it BEFORE calling performRecovery to ensure
    // synchronous lock acquisition for the single-flight check.
    const recoveryPromise = new Promise<boolean>((resolve) => {
        Promise.resolve().then(() => {
            performRecovery(reason).then(resolve).finally(() => {
                setRecoveryPromise(null);
                setRecoveringState(false);
            });
        });
    });

    setRecoveryPromise(recoveryPromise);

    return recoveryPromise;
};

export const getIsInternalRecoveryCall = () => isInternalRecoveryCall;

// For testing purposes
export const _resetInternalRecoveryCall = () => { isInternalRecoveryCall = false; };
export const resetCircuitBreaker = () => { recoveryFailures = 0; lastFailureTime = 0; };
