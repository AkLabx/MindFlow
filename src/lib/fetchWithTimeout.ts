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
const MAX_AUTO_RETRIES = 2; // Increased to 2 for better backoff

// Explicit allowlist of RPCs that are confirmed safe/idempotent to retry
const SAFE_RPCS = [
    'get_filtered_quiz_metadata',
    'finalize_quiz_session', // Includes upserts guard
];

const isSafeToRetry = (urlStr: string, options?: RequestInit): boolean => {
    const method = options?.method?.toUpperCase() || 'GET';

    if (method === 'GET' || method === 'HEAD') return true;

    if (method === 'POST' && urlStr.includes('/rpc/')) {
        return SAFE_RPCS.some(rpc => urlStr.includes(`/rpc/${rpc}`));
    }

    return false;
};

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

      // DO NOT confuse our own timeout AbortError with a broken lock AbortError
      const isOurTimeout = err.message === 'TimeoutError' || (err.name === 'AbortError' && existingSignal?.aborted);

      const isNetworkError = err.message === 'Failed to fetch' || err.name === 'TypeError';
      const isLockError = !isOurTimeout && err.name === 'AbortError' && err.message?.includes('Lock broken');

      if (retryCount < MAX_AUTO_RETRIES && (isNetworkError || isLockError)) {

          if (!isSafeToRetry(urlStr, options)) {
              console.warn(`[Fetch Interceptor] Caught stale session error but request is not safe to retry automatically: ${options?.method} ${urlStr}`);
              // Fall through to throw, letting the UI handle the failure friendly
          } else {
              console.warn(`[Fetch Interceptor] Caught stale session error (${err.name}: ${err.message}). Triggering auto-recovery for ${urlStr}...`);

              const recovered = await triggerAppRecovery(`Intercepted ${err.name} on ${urlStr}`);

              if (recovered) {
                  // Exponential backoff for network stability
                  const backoffDelay = (retryCount + 1) * 1000;
                  console.log(`[Fetch Interceptor] Auto-recovery successful. Retrying request ${reqId} in ${backoffDelay}ms...`);

                  await new Promise(r => setTimeout(r, backoffDelay));

                  const retryOptions = { ...options };
                  return fetchWithTimeout(url, retryOptions, timeoutMs, retryCount + 1);
              } else {
                 console.error(`[Fetch Interceptor] Auto-recovery failed. Propagating original error.`);
              }
          }
      }

      if (urlStr.includes('/storage/v1/object/')) {
          console.error(`[Storage Upload] ${reqId} failed after ${(endTime - startTime).toFixed(2)}ms for ${urlStr} - ${err.name}: ${err.message}`);
      }

      // Remap raw technical errors to friendly UI errors for unrecovered/unsafe queries
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
          throw new Error('Connection lost. Please check your internet and try again.');
      }
      if (err.name === 'AbortError' && err.message?.includes('Lock broken')) {
          throw new Error('Session interrupted. Please refresh the page.');
      }

      throw err;
  }
};
