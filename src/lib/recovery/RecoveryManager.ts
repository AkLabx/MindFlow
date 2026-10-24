import { supabase } from '../supabase';
import { useRecoveryStore } from '../../stores/useRecoveryStore';
import { setRecoveryPromise, getRecoveryPromise, setRecoveringState } from './recoveryContext';

/**
 * Checks if the browser thinks it's online.
 */
const checkNetwork = async (): Promise<boolean> => {
    if (!navigator.onLine) return false;

    // Fallback: ping a lightweight internal endpoint (e.g. root) to verify real connectivity
    // beyond just the network adapter state.
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        // Using no-cache to avoid false positive from service worker
        await fetch('/', { method: 'HEAD', cache: 'no-cache', signal: controller.signal });
        clearTimeout(timeoutId);
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Executes a full session validation and potential refresh.
 */
const performRecovery = async (): Promise<boolean> => {
    const store = useRecoveryStore.getState();
    const startTime = performance.now();

    try {
        store.setStatus('CHECKING', 'Validating network and session');

        // 1. Wait for network to stabilize (up to 5 seconds)
        let isOnline = await checkNetwork();
        let retries = 0;
        while (!isOnline && retries < 5) {
            await new Promise(r => setTimeout(r, 1000));
            isOnline = await checkNetwork();
            retries++;
        }

        if (!isOnline) {
            throw new Error('Network unavailable after retries');
        }

        store.setStatus('RECOVERING', 'Refreshing auth session');

        // 2. Validate/Refresh Supabase Session
        // Use a clean getSession call. The auth mutex might be locked or broken,
        // but we rely on the fetch timeout wrapper we added earlier.
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        if (!data.session) {
             throw new Error('No active session found. User may have been logged out.');
        }

        const durationMs = performance.now() - startTime;
        store.logRecoveryAttempt({ success: true, durationMs });
        store.setStatus('RECOVERED', 'Session active and network ready');

        // Hide banner after 2 seconds
        setTimeout(() => {
            if (useRecoveryStore.getState().status === 'RECOVERED') {
                 useRecoveryStore.getState().resetStatus();
            }
        }, 2000);

        return true;

    } catch (error: any) {
        const durationMs = performance.now() - startTime;
        console.error('[RecoveryManager] Recovery failed:', error);

        store.logRecoveryAttempt({
            success: false,
            durationMs,
            error: error?.message || 'Unknown error',
            reason: 'Recovery procedure failed'
        });

        store.setStatus('FAILED', error?.message || 'Failed to reconnect');
        return false;
    }
};

/**
 * Triggers the recovery flow. If a recovery is already in progress, it returns
 * the existing promise to prevent concurrent identical recovery attempts.
 */
export const triggerAppRecovery = async (reason?: string): Promise<boolean> => {
    const existingPromise = getRecoveryPromise();
    if (existingPromise) {
        console.log(`[RecoveryManager] Joining existing recovery in progress... (Triggered by: ${reason})`);
        return existingPromise;
    }

    setRecoveringState(true);

    const recoveryPromise = performRecovery().finally(() => {
        setRecoveryPromise(null);
        setRecoveringState(false);
    });

    setRecoveryPromise(recoveryPromise);

    return recoveryPromise;
};
