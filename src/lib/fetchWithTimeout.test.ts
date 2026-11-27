import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    fetchWithTimeout,
    isSafeToRetry,
    isAuthEmailEndpoint,
    AUTH_EMAIL_TIMEOUT_MS,
} from './fetchWithTimeout';
import { triggerAppRecovery } from './recovery/RecoveryManager';

vi.mock('./recovery/RecoveryManager', () => ({
    triggerAppRecovery: vi.fn()
}));

describe('isSafeToRetry', () => {
    it('allows GET and HEAD requests universally', () => {
        expect(isSafeToRetry('https://example.com/api', { method: 'GET' })).toBe(true);
        expect(isSafeToRetry('https://example.com/api', { method: 'HEAD' })).toBe(true);
        expect(isSafeToRetry('https://example.com/api')).toBe(true); // defaults to GET
    });

    it('allows explicit safe RPCs (POST)', () => {
        expect(isSafeToRetry('https://api.supabase.co/rest/v1/rpc/get_filtered_quiz_metadata', { method: 'POST' })).toBe(true);
        expect(isSafeToRetry('https://api.supabase.co/rest/v1/rpc/submit_quiz_session', { method: 'POST' })).toBe(true);
        expect(isSafeToRetry('https://api.supabase.co/rest/v1/rpc/get_reels_feed', { method: 'POST' })).toBe(true);
    });

    it('allows idempotent PATCH updates to quiz_sessions', () => {
        expect(isSafeToRetry('https://api.supabase.co/rest/v1/quiz_sessions?id=eq.123', { method: 'PATCH' })).toBe(true);
    });

    it('rejects unlisted RPCs and destructive mutations', () => {
        expect(isSafeToRetry('https://api.supabase.co/rest/v1/rpc/delete_content_by_admin', { method: 'POST' })).toBe(false);
        expect(isSafeToRetry('https://api.supabase.co/rest/v1/data', { method: 'POST' })).toBe(false);
        expect(isSafeToRetry('https://api.supabase.co/rest/v1/data', { method: 'DELETE' })).toBe(false);
        expect(isSafeToRetry('https://api.supabase.co/rest/v1/data', { method: 'PATCH' })).toBe(false);
    });
});

describe('fetchWithTimeout', () => {
    let originalTimeout: typeof AbortSignal.timeout;

    beforeEach(() => {
        vi.useFakeTimers();

        // A smarter fetch mock that actually aborts when the signal aborts
        vi.stubGlobal('fetch', vi.fn().mockImplementation((url, init) => {
            return new Promise((resolve, reject) => {
                if (init?.signal) {
                    if (init.signal.aborted) {
                        return reject(init.signal.reason || new Error('AbortError'));
                    }
                    init.signal.addEventListener('abort', () => {
                        reject(init.signal.reason || new Error('AbortError'));
                    });
                }
            });
        }));

        vi.spyOn(performance, 'now').mockReturnValue(0);

        originalTimeout = AbortSignal.timeout;
        Object.defineProperty(AbortSignal, 'timeout', { value: undefined, configurable: true });

        vi.mocked(triggerAppRecovery).mockResolvedValue(true);
        vi.mocked(triggerAppRecovery).mockClear();
    });

    afterEach(() => {
        Object.defineProperty(AbortSignal, 'timeout', { value: originalTimeout, configurable: true });
        vi.restoreAllMocks();
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('Success: fetch resolves', async () => {
        const mockResponse = new Response('ok');
        vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

        const promise = fetchWithTimeout('https://example.com');

        const res = await promise;
        expect(res).toBe(mockResponse);
        expect(fetch).toHaveBeenCalledWith('https://example.com', expect.objectContaining({
            signal: expect.any(AbortSignal)
        }));
    });

    it('Timeout: abort after timeout (no recovery triggered)', async () => {
        const promise = fetchWithTimeout('https://example.com');

        vi.advanceTimersByTime(15001);

        await expect(promise).rejects.toThrow('TimeoutError');

        const callArgs = vi.mocked(fetch).mock.calls[0];
        const signal = callArgs[1]?.signal as AbortSignal;
        expect(signal.aborted).toBe(true);
        expect(triggerAppRecovery).not.toHaveBeenCalled();
    });

    it('Network error (non-safe request): fetch rejects and preserves original error', async () => {
        const networkError = new Error('Failed to fetch');
        networkError.name = 'TypeError';
        vi.mocked(fetch).mockRejectedValueOnce(networkError);

        const promise = fetchWithTimeout('https://example.com/rpc/unsafe', { method: 'POST' });

        await expect(promise).rejects.toThrow('Failed to fetch');
        expect(triggerAppRecovery).not.toHaveBeenCalled();
    });

    it('Network error (safe request): triggers recovery and backoff retry', async () => {
        const networkError = new Error('Failed to fetch');
        networkError.name = 'TypeError';

        const mockResponse = new Response('recovered_ok');

        vi.mocked(fetch)
          .mockRejectedValueOnce(networkError)
          .mockResolvedValueOnce(mockResponse);

        const promise = fetchWithTimeout('https://example.com/rpc/get_reels_feed', { method: 'POST' });

        // Await microtasks so recovery fires
        await Promise.resolve();

        expect(triggerAppRecovery).toHaveBeenCalled();

        // Advance backoff delay (1000ms for first retry)
        await vi.advanceTimersByTimeAsync(1000);

        const res = await promise;
        expect(res).toBe(mockResponse);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('External abort: AbortSignal aborts', async () => {
        const controller = new AbortController();
        const promise = fetchWithTimeout('https://example.com', { signal: controller.signal });

        controller.abort(new Error('User aborted'));

        const callArgs = vi.mocked(fetch).mock.calls[0];
        const signal = callArgs[1]?.signal as AbortSignal;

        expect(signal.aborted).toBe(true);
        await expect(promise).rejects.toThrow('User aborted');
        expect(triggerAppRecovery).not.toHaveBeenCalled();
    });

    it('Auth email endpoints expand timeout to 30s (do not abort at 15s) and never trigger recovery', async () => {
        const promise = fetchWithTimeout('https://example.supabase.co/auth/v1/signup', { method: 'POST' });

        // At 15s (default timeout), signup must still be pending so slow SMTP handshakes can finish
        vi.advanceTimersByTime(15001);
        const callArgs = vi.mocked(fetch).mock.calls[0];
        const signal = callArgs[1]?.signal as AbortSignal;
        expect(signal.aborted).toBe(false);

        // At 30s (AUTH_EMAIL_TIMEOUT_MS), the timeout cleanly aborts without calling triggerAppRecovery
        vi.advanceTimersByTime(AUTH_EMAIL_TIMEOUT_MS - 15000);
        await expect(promise).rejects.toThrow('TimeoutError');
        expect(signal.aborted).toBe(true);
        expect(triggerAppRecovery).not.toHaveBeenCalled();
    });

    it('Native AbortSignal.timeout DOMException ("signal timed out") never triggers recovery', async () => {
        const nativeTimeoutErr = new DOMException('signal timed out', 'TimeoutError');
        vi.mocked(fetch).mockRejectedValueOnce(nativeTimeoutErr);

        const promise = fetchWithTimeout('https://example.supabase.co/auth/v1/signup', { method: 'POST' });

        await expect(promise).rejects.toMatchObject({
            name: 'TimeoutError',
            message: 'signal timed out',
        });
        expect(triggerAppRecovery).not.toHaveBeenCalled();
    });
});

describe('isSafeToRetry (advanced)', () => {
    it('rejects auth paths to prevent telemetry loops and duplicate signup/OTP dispatches', () => {
        expect(isSafeToRetry('https://example.com/auth/v1/user')).toBe(true);
        expect(isSafeToRetry('https://example.com/auth/v1/token')).toBe(false);
        expect(isSafeToRetry('https://example.com/auth/v1/token', { method: 'POST' })).toBe(false);
        expect(isSafeToRetry('https://example.com/auth/v1/signup', { method: 'POST' })).toBe(false);
        expect(isSafeToRetry('https://example.com/auth/v1/otp', { method: 'POST' })).toBe(false);
        expect(isSafeToRetry('https://example.com/auth/v1/recover', { method: 'POST' })).toBe(false);
        expect(isSafeToRetry('https://example.com/auth/v1/resend', { method: 'POST' })).toBe(false);
        expect(isAuthEmailEndpoint('https://example.com/auth/v1/signup?redirect_to=x')).toBe(true);
        expect(isAuthEmailEndpoint('https://example.com/auth/v1/token')).toBe(false);
    });

    it('rejects analytics events path to prevent telemetry loops', () => {
        expect(isSafeToRetry('https://example.com/rest/v1/analytics_events', { method: 'POST' })).toBe(false);
    });
});
