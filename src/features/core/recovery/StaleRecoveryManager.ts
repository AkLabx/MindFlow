import { supabase } from '../../../lib/supabase';
import { useNotificationStore } from '../../../stores/useNotificationStore';

class StaleRecoveryManager {
    private isRecovering = false;
    private recoveryPromise: Promise<void> | null = null;

    /**
     * Checks if the error matches typical stale-session or restored-tab failure signatures.
     */
    public isStaleSessionError(error: any): boolean {
        if (!error) return false;
        const msg = error.message || String(error);
        const name = error.name || '';
        return (
            msg.includes('Failed to fetch') ||
            msg.includes('AbortError') ||
            name.includes('AbortError') ||
            msg.includes('Lock broken by another request') ||
            msg.includes('steal') ||
            msg.includes('NetworkError')
        );
    }

    /**
     * Attempts a friendly recovery (Layer 2).
     * Ensures only one recovery runs at a time.
     */
    public async attemptRecovery(): Promise<void> {
        if (this.isRecovering && this.recoveryPromise) {
            return this.recoveryPromise;
        }

        this.isRecovering = true;

        this.recoveryPromise = new Promise<void>(async (resolve, reject) => {
            try {
                console.log('[StaleRecoveryManager] Initiating friendly auto-recovery...');

                // Show friendly notification
                useNotificationStore.getState().showToast({
                    variant: 'info',
                    title: 'Restoring Connection',
                    message: "This page has been open for a while. We're refreshing it for you...",
                    duration: 4000
                });

                // Force a session refresh
                const { error } = await supabase.auth.refreshSession();
                if (error) {
                    console.warn('[StaleRecoveryManager] Session refresh returned error, continuing anyway:', error);
                }

                // Small buffer to allow realtime and other states to settle
                await new Promise(r => setTimeout(r, 1000));

                console.log('[StaleRecoveryManager] Recovery complete.');
                resolve();
            } catch (err) {
                console.error('[StaleRecoveryManager] Recovery failed:', err);
                reject(err);
            } finally {
                this.isRecovering = false;
                this.recoveryPromise = null;
            }
        });

        return this.recoveryPromise;
    }
}

export const staleRecoveryManager = new StaleRecoveryManager();
