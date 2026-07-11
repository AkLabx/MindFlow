/**
 * A hardened fetch wrapper that enforces a strict timeout (default 15s) on HTTP requests.
 * This guarantees that requests resolve or reject, preventing the "Sleep Coma" infinite pending state
 * caused by dropped TCP sockets when the app is backgrounded.
 *
 * Supports AbortSignal.timeout() for modern browsers and falls back to a manual AbortController
 * for older WebViews / Capacitor environments.
 */

// Diagnostic counter to track requests
let requestIdCounter = 0;

export const fetchWithTimeout = (url: RequestInfo | URL, options?: RequestInit, timeoutMs: number = 15000) => {
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

  if (existingSignal) {
        }

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

  // If there's an existing signal, we must abort if either fires
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
  return fetch(url, { ...options, signal: finalSignal })
    .then(res => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        const endTime = performance.now();
        if (urlStr.includes('/storage/v1/object/')) {
            console.log(`[Storage Upload] ${reqId} completed in ${(endTime - startTime).toFixed(2)}ms for ${urlStr}`);
        }
        return res;
    })
    .catch(err => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        const endTime = performance.now();
        if (urlStr.includes('/storage/v1/object/')) {
            console.error(`[Storage Upload] ${reqId} failed after ${(endTime - startTime).toFixed(2)}ms for ${urlStr} - ${err.name}: ${err.message}`);
        }
        throw err;
    });
};
