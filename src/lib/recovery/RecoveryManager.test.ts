import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerAppRecovery, getIsInternalRecoveryCall, _resetInternalRecoveryCall, resetCircuitBreaker } from './RecoveryManager';
import { useRecoveryStore } from '../../stores/useRecoveryStore';
import { supabase } from '../supabase';

vi.mock('../supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
        },
        from: vi.fn(() => ({
            insert: vi.fn().mockResolvedValue({ error: null })
        }))
    }
}));

describe('RecoveryManager', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        useRecoveryStore.setState({ status: 'HEALTHY', telemetry: [] });
        _resetInternalRecoveryCall();
        resetCircuitBreaker();
        vi.clearAllMocks();

        Object.defineProperty(navigator, 'onLine', {
            value: true,
            writable: true
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('single-flight: prevents concurrent recovery attempts', async () => {
        vi.mocked(supabase.auth.getSession).mockImplementation(async () => {
            await new Promise(r => setTimeout(r, 100)); // Simulate network delay
            return { data: { session: { user: { id: '1' } } }, error: null } as any;
        });

        // Trigger two recoveries simultaneously
        const promise1 = triggerAppRecovery('Test 1');
        const promise2 = triggerAppRecovery('Test 2');

        expect(promise1).toBe(promise2); // They should literally be the same promise object

        await vi.runAllTimersAsync();
        const results = await Promise.all([promise1, promise2]);

        expect(results[0]).toBe(true);
        expect(results[1]).toBe(true);
        expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    });

    it('re-entrancy: prevents infinite loops from interceptors', async () => {
        vi.mocked(supabase.auth.getSession).mockImplementation(async () => {
            // Simulate an interceptor triggering recovery DURING getSession
            const reentrantPromise = triggerAppRecovery('Re-entrant Call');
            expect(await reentrantPromise).toBe(false); // Should abort immediately
            return { data: { session: { user: { id: '1' } } }, error: null } as any;
        });

        const mainPromise = triggerAppRecovery('Main Call');
        await vi.runAllTimersAsync();

        const result = await mainPromise;
        expect(result).toBe(true);
        expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    });

    it('state transitions: HEALTHY -> CHECKING -> RECOVERING -> RECOVERED -> HEALTHY', async () => {
        vi.mocked(supabase.auth.getSession).mockImplementation(async () => {
            await new Promise(r => setTimeout(r, 100)); // Simulate network delay to check states
            return { data: { session: { user: { id: '1' } } }, error: null } as any;
        });

        const promise = triggerAppRecovery('State Test');

        // Let it advance past the initial setup into RECOVERING
        await vi.advanceTimersByTimeAsync(1);
        const stateInitial = useRecoveryStore.getState().status;
        // CHECKING transitions to RECOVERING synchronously inside performRecovery
        expect(stateInitial).toBe('RECOVERING');

        await vi.advanceTimersByTimeAsync(100);
        await promise;

        const state1 = useRecoveryStore.getState().status;
        expect(state1).toBe('RECOVERED');

        // Fast-forward 2 seconds for the auto-reset
        await vi.advanceTimersByTimeAsync(2500);

        const state2 = useRecoveryStore.getState().status;
        expect(state2).toBe('HEALTHY');
    });

    it('session expired logic: resolves true for guest users without error', async () => {
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: { session: null },
            error: null
        } as any);

        const result = await triggerAppRecovery('Guest Test');
        expect(result).toBe(true);

        const store = useRecoveryStore.getState();
        expect(store.status).toBe('HEALTHY'); // resets cleanly
    });

    it('session expired logic: identifies session expired when explicit error returned', async () => {
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: { session: null },
            error: {
                message: 'Invalid refresh token',
                code: 'refresh_token_not_found',
                name: 'AuthApiError'
            }
        } as any);

        const result = await triggerAppRecovery('Session Expired Test');
        expect(result).toBe(false);

        const store = useRecoveryStore.getState();
        expect(store.status).toBe('FAILED');

        const lastLog = store.telemetry[0];
        expect(lastLog.success).toBe(false);
        expect(lastLog.errorCode).toBe('refresh_token_not_found');
    });

    it('circuit breaker: stops recovery after multiple failures', async () => {
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: { session: null },
            error: { message: 'Network error', name: 'TypeError' }
        } as any);

        // First 3 should execute performRecovery and fail
        expect(await triggerAppRecovery('Fail 1')).toBe(false);

        // Fast-forward so they don't count as re-entrant/single-flight
        await vi.advanceTimersByTimeAsync(1);
        expect(await triggerAppRecovery('Fail 2')).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        expect(await triggerAppRecovery('Fail 3')).toBe(false);

        expect(supabase.auth.getSession).toHaveBeenCalledTimes(3);

        // 4th should be blocked by circuit breaker
        await vi.advanceTimersByTimeAsync(1);
        expect(await triggerAppRecovery('Fail 4 (Blocked)')).toBe(false);
        expect(supabase.auth.getSession).toHaveBeenCalledTimes(3); // count should not increase
    });

    it('navigator offline logic: waits up to 5s for online event', async () => {
        Object.defineProperty(navigator, 'onLine', { value: false });

        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: { session: { user: { id: '1' } } },
            error: null
        } as any);

        const promise = triggerAppRecovery('Offline Test');

        // Fast-forward 2 seconds, simulate coming online
        await vi.advanceTimersByTimeAsync(2000);
        window.dispatchEvent(new Event('online'));

        await vi.runAllTimersAsync();
        const result = await promise;

        expect(result).toBe(true);
    });
});
