import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithTimeout } from './fetchWithTimeout';

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

    it('Timeout: abort after timeout', async () => {
        const promise = fetchWithTimeout('https://example.com');

        vi.advanceTimersByTime(15001);

        await expect(promise).rejects.toThrow('TimeoutError');

        const callArgs = vi.mocked(fetch).mock.calls[0];
        const signal = callArgs[1]?.signal as AbortSignal;
        expect(signal.aborted).toBe(true);
    });

    it('Network error: fetch rejects', async () => {
        const networkError = new Error('Network Failure');
        vi.mocked(fetch).mockRejectedValueOnce(networkError);

        const promise = fetchWithTimeout('https://example.com');

        await expect(promise).rejects.toThrow('Network Failure');
    });

    it('External abort: AbortSignal aborts', async () => {
        const controller = new AbortController();
        const promise = fetchWithTimeout('https://example.com', { signal: controller.signal });

        controller.abort(new Error('User aborted'));

        const callArgs = vi.mocked(fetch).mock.calls[0];
        const signal = callArgs[1]?.signal as AbortSignal;

        expect(signal.aborted).toBe(true);
        await expect(promise).rejects.toThrow('User aborted');
    });

    it('Default timeout: normal URL', async () => {
        const promise = fetchWithTimeout('https://example.com'); // Default 15s

        vi.advanceTimersByTime(14000);

        const callArgs = vi.mocked(fetch).mock.calls[0];
        const signal = callArgs[1]?.signal as AbortSignal;
        expect(signal.aborted).toBe(false);

        vi.advanceTimersByTime(1001); // 15001 ms total
        await expect(promise).rejects.toThrow();
        expect(signal.aborted).toBe(true);
    });

    it('AI Tutor timeout: special-case URL', async () => {
        const promise = fetchWithTimeout('https://example.com/functions/v1/ask-ai-tutor'); // 45s

        vi.advanceTimersByTime(16000);

        const callArgs = vi.mocked(fetch).mock.calls[0];
        const signal = callArgs[1]?.signal as AbortSignal;
        expect(signal.aborted).toBe(false);

        vi.advanceTimersByTime(30000); // 46s total
        await expect(promise).rejects.toThrow();
        expect(signal.aborted).toBe(true);
    });

    it('Storage timeout: special-case URL', async () => {
        const promise = fetchWithTimeout('https://example.com/storage/v1/object/upload'); // 5m (300,000ms)

        vi.advanceTimersByTime(46000);

        const callArgs = vi.mocked(fetch).mock.calls[0];
        const signal = callArgs[1]?.signal as AbortSignal;
        expect(signal.aborted).toBe(false);

        vi.advanceTimersByTime(255000); // 301s total
        await expect(promise).rejects.toThrow();
        expect(signal.aborted).toBe(true);
    });

    it('Custom timeout: explicit timeout honored', async () => {
        const promise = fetchWithTimeout('https://example.com', {}, 5000); // 5s custom timeout

        vi.advanceTimersByTime(4000);

        const callArgs = vi.mocked(fetch).mock.calls[0];
        const signal = callArgs[1]?.signal as AbortSignal;
        expect(signal.aborted).toBe(false);

        vi.advanceTimersByTime(1001); // 5001ms total
        await expect(promise).rejects.toThrow();
        expect(signal.aborted).toBe(true);
    });

    it('Timer cleanup after success: no pending timeout', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(new Response('ok'));

        await fetchWithTimeout('https://example.com');

        expect(vi.getTimerCount()).toBe(0);
    });

    it('Timer cleanup after failure: no pending timeout', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network Error'));

        await expect(fetchWithTimeout('https://example.com')).rejects.toThrow('Network Error');

        expect(vi.getTimerCount()).toBe(0);
    });
});
