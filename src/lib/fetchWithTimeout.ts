/**
 * A hardened fetch wrapper that enforces a strict timeout (default 15s) on HTTP requests.
 * This guarantees that requests resolve or reject, preventing the "Sleep Coma" infinite pending state
 * caused by dropped TCP sockets when the app is backgrounded.
 *
 * It also acts as the Layer 1 Global Interceptor for stale session recovery, intercepting
 * 'Failed to fetch' network drops and 'AbortError' lock steals, triggering the RecoveryManager.
 */

import { triggerAppRecovery } from './recovery/RecoveryManager';

// Diagnostic counter to track requests
let requestIdCounter = 0;

// Maximum retries per request via the automatic recovery mechanism
const MAX_AUTO_RETRIES = 1;

export const fetchWithTimeout = async (url: RequestInfo | URL, options?: RequestInit, timeoutMs: number = 15000, retryCount: number = 0): Promise<Response> => {
  const reqId = `req_${++requestIdCounter}`;
  const urlStr = url.toString();

  // Conditionally expand timeout for AI Tutor generation which involves long-running Google Search grounding.
  if (urlStr.includes('/functions/v1/ask-ai-tutor')) {
      timeoutMs = 45000;
  }

  // Extend timeout significantly for Supabase Storage uploads (e.g. large PDFs in Admin)
  if (urlStr.includes('/storage/v1/object/')) {
      timeoutMs = 300000; // 5 minutes
  }

  // Combine an existing signal (if any) with our timeout signal
  const existingSignal = options?.signal;

  let timeoutSignal: AbortSignal;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (typeof AbortSignal.timeout === 'function') {
      timeoutSignal = AbortSignal.timeout(timeoutMs);
  } else {
      const controller = new AbortController();
      timeoutId = setTimeout(() => {
          controller.abort(new Error('TimeoutError'));
      }, timeoutMs);
      timeoutSignal = controller.signal;
  }

  let finalSignal = timeoutSignal;
  if (existingSignal) {
      if (typeof (AbortSignal as any).any === 'function') {
          finalSignal = (AbortSignal as any).any([existingSignal, timeoutSignal]);
      } else {
          // Manual fallback if (AbortSignal as any).any is missing (unlikely if .timeout exists, but safe)
          const combinedController = new AbortController();

          const onAbort = () => {
              combinedController.abort();
          }
          existingSignal.addEventListener('abort', onAbort);
          timeoutSignal.addEventListener('abort', onAbort);

          if (existingSignal.aborted || timeoutSignal.aborted) {
              combinedController.abort();
          }
          finalSignal = combinedController.signal;
      }
  }

  const startTime = performance.now();

  try {
      const res = await fetch(url, { ...options, signal: finalSignal });
      if (timeoutId !== undefined) clearTimeout(timeoutId);

      const endTime = performance.now();
      if (urlStr.includes('/storage/v1/object/')) {
          console.log(`[Storage Upload] ${reqId} completed in ${(endTime - startTime).toFixed(2)}ms for ${urlStr}`);
      }
      return res;

  } catch (err: any) {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      const endTime = performance.now();

      const isNetworkError = err.message === 'Failed to fetch' || err.name === 'TypeError';
      const isLockError = err.name === 'AbortError' && err.message?.includes('Lock broken');

      // Should we attempt auto-recovery?
      // - We only retry once per request
      // - We only intercept clear staleness markers: lock breaks and raw network drop errors
      // - We do not intercept normal API 4xx/5xx errors (those are returned as normal Responses)
      // - We do not intercept deliberate user aborts (standard AbortError)
      if (retryCount < MAX_AUTO_RETRIES && (isNetworkError || isLockError)) {
          console.warn(`[Fetch Interceptor] Caught stale session error (${err.name}: ${err.message}). Triggering auto-recovery for ${urlStr}...`);

          const recovered = await triggerAppRecovery(`Intercepted ${err.name} on ${urlStr}`);

          if (recovered) {
              console.log(`[Fetch Interceptor] Auto-recovery successful. Retrying request ${reqId}...`);
              // We must not pass the exact same signal because the old one might have been aborted
              // or timed out. We pass a clean copy of the options, omitting the old aborted signal if needed.
              // Note: If the caller explicitly aborted the request, we wouldn't be here (it would be a standard AbortError, not a Lock broken / Failed to fetch).
              const retryOptions = { ...options };
              // We can keep the same existingSignal if it hasn't fired natively. The next run of fetchWithTimeout will build a new timeout wrapper.

              return fetchWithTimeout(url, retryOptions, timeoutMs, retryCount + 1);
          } else {
             console.error(`[Fetch Interceptor] Auto-recovery failed. Propagating original error.`);
          }
      }

      if (urlStr.includes('/storage/v1/object/')) {
          console.error(`[Storage Upload] ${reqId} failed after ${(endTime - startTime).toFixed(2)}ms for ${urlStr} - ${err.name}: ${err.message}`);
      }
      throw err;
  }
};
