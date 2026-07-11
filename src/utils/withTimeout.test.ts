import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout } from './withTimeout';

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(global, 'clearTimeout');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('resolves when the wrapped promise resolves before the timeout', async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('success'), 100);
    });

    const timeoutPromise = withTimeout(promise, 500);
    vi.advanceTimersByTime(100);

    await expect(timeoutPromise).resolves.toBe('success');
    expect(clearTimeout).toHaveBeenCalled();
  });

  it('rejects with the original error when the wrapped promise rejects before the timeout', async () => {
    const error = new Error('original error');
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(error), 100);
    });

    const timeoutPromise = withTimeout(promise, 500);
    vi.advanceTimersByTime(100);

    await expect(timeoutPromise).rejects.toThrow('original error');
    expect(clearTimeout).toHaveBeenCalled();
  });

  it('supports the default timeout value (10000 ms)', async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('success'), 11000);
    });

    const timeoutPromise = withTimeout(promise);
    vi.advanceTimersByTime(10000);

    await expect(timeoutPromise).rejects.toThrow('Timeout of 10000ms exceeded');
  });

  it('uses a custom timeout value correctly', async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('success'), 500);
    });

    const timeoutPromise = withTimeout(promise, 300);
    vi.advanceTimersByTime(300);

    await expect(timeoutPromise).rejects.toThrow('Timeout of 300ms exceeded');
  });

  it('clears the timeout if the promise settles before the timeout, preventing later rejection', async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('success'), 100);
    });

    const timeoutPromise = withTimeout(promise, 500);

    // Resolve the original promise
    vi.advanceTimersByTime(100);
    await expect(timeoutPromise).resolves.toBe('success');

    // Advance timers past the timeout value
    vi.advanceTimersByTime(400);

    // If timeout wasn't cleared, it would throw an unhandled promise rejection or similar,
    // but we can assert the clearTimeout was actually called.
    expect(clearTimeout).toHaveBeenCalled();
  });
});
