import { supabase } from '../supabase';
import { useRecoveryStore } from '../../stores/useRecoveryStore';
import { setRecoveryPromise, getRecoveryPromise, setRecoveringState } from './recoveryContext';
import { Capacitor } from '@capacitor/core';

let isInternalRecoveryCall = false;

/**
 * Executes a full session validation and potential refresh.
 */
const performRecovery = async (reason?: string): Promise<boolean> => {
    const store = useRecoveryStore.getState();
    const startTime = performance.now();

    try {
        store.setStatus('CHECKING', 'Validating network and session');

        // 1. We no longer explicitly ping `/`. The network adapter check provides a fast-fail,
        // but the ultimate source of truth (health check) is the actual retried request
        // handled in `fetchWithTimeout`.
        if ('onLine' in navigator && !navigator.onLine) {
             throw new Error('Network offline');
        }

        store.setStatus('RECOVERING', 'Refreshing auth session');

        // Re-entrancy guard: Only wrap the specific auth call that could trigger the interceptor
        isInternalRecoveryCall = true;

        // 2. Validate/Refresh Supabase Session
        const { data, error } = await supabase.auth.getSession();

        isInternalRecoveryCall = false;

        if (error) {
            throw error;
        }

        if (!data.session) {
             throw new Error('No active session found. User may have been logged out.');
        }

        const durationMs = performance.now() - startTime;
        store.logRecoveryAttempt({ success: true, durationMs, reason });

        // Persist to analytics
        supabase.from('analytics_events').insert({
            event_name: 'session_recovery',
            event_data: {
                success: true,
                duration_ms: durationMs,
                reason,
                platform: Capacitor.getPlatform(),
                version: import.meta.env.VITE_APP_VERSION
            }
        }).then(({ error }) => {
            if (error) console.warn('[RecoveryManager] Failed to persist telemetry', error);
        });

        store.setStatus('RECOVERED', 'Session active and network ready');

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
        store.logRecoveryAttempt({
            success: false,
            durationMs,
            error: errorMessage,
            reason: reason || 'Recovery procedure failed'
        });

         // Persist to analytics
         supabase.from('analytics_events').insert({
            event_name: 'session_recovery',
            event_data: {
                success: false,
                duration_ms: durationMs,
                reason,
                error: errorMessage,
                platform: Capacitor.getPlatform(),
                version: import.meta.env.VITE_APP_VERSION
            }
        }).then(({ error }) => {
            if (error) console.warn('[RecoveryManager] Failed to persist telemetry', error);
        });

        store.setStatus('FAILED', errorMessage);
        return false;
    }
};

/**
 * Triggers the recovery flow. If a recovery is already in progress, it returns
 * the existing promise to prevent concurrent identical recovery attempts.
 */
export const triggerAppRecovery = (reason?: string): Promise<boolean> => {
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
        // We defer performRecovery to the microtask queue so that
        // synchronous subsequent calls to triggerAppRecovery don't trip the `isInternalRecoveryCall` flag
        // before they have a chance to hit `existingPromise`.
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
