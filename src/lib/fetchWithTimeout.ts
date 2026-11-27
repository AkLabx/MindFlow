/**
 * A hardened fetch wrapper that enforces a strict timeout (default 15s) on HTTP requests.
 * This guarantees that requests resolve or reject, preventing the "Sleep Coma" infinite pending state
 * caused by dropped TCP sockets when the app is backgrounded.
 *
 * It also acts as the Layer 1 Global Interceptor for stale session recovery, intercepting
 * 'Failed to fetch' network drops and 'AbortError' lock steals, triggering the RecoveryManager.
 */

import { triggerAppRecovery } from './recovery/RecoveryManager';
import { useRecoveryStore } from '../stores/useRecoveryStore';
import { DB_TABLES, DB_RPCS } from '../config/dbTables';

// Diagnostic counter to track requests
let requestIdCounter = 0;

// Maximum retries per request via the automatic recovery mechanism
const MAX_AUTO_RETRIES = 2; // Increased to 2 for better backoff

// Explicit allowlist of RPCs that are confirmed safe/idempotent to retry
const SAFE_RPCS = [
    'get_filtered_quiz_metadata', // read
    'get_dashboard_subject_counts', // read
    'get_filtered_idiom_metadata', // read
    'get_filtered_ows_metadata', // read
    'search_profiles_trgm', // read
    'get_reels_feed', // read
    'get_blueprint_questions', // read
    'get_ai_pipeline_dashboard_metrics', // read
    'get_ai_pipeline_dlq', // read
    'get_word_lineage', // read
    'get_pipeline_timeline', // read
    'get_prompt_registry_metrics', // read
    DB_RPCS.SUBMIT_QUIZ_SESSION, // idempotent upsert guard included
];

// Expanded timeout for Supabase Auth email-dispatching endpoints (signup/OTP/recovery/resend)
// so slow SMTP handshakes or upstream 504/429 responses complete cleanly instead of aborting mid-flight at 15s.
export const AUTH_EMAIL_TIMEOUT_MS = 30000;

const AUTH_EMAIL_ENDPOINTS = [
    '/auth/v1/signup',
    '/auth/v1/otp',
    '/auth/v1/recover',
    '/auth/v1/resend',
];

export const isAuthEmailEndpoint = (urlStr: string): boolean => {
    return AUTH_EMAIL_ENDPOINTS.some((endpoint) => urlStr.includes(endpoint));
};

export const isSafeToRetry = (urlStr: string, options?: RequestInit): boolean => {
    // 1. Guard against infinite auth / telemetry loops and non-idempotent email-dispatching auth mutations.
    // We never want background telemetry, core session checks, or signup/OTP/recovery POSTs to auto-retry.
    // /auth/v1/user is excluded to allow explicit intentional fetch retry by the app on stale load,
    // but analytics_events is fully blocked from initiating recovery.
    if (
        urlStr.includes('/auth/v1/token') ||
        isAuthEmailEndpoint(urlStr) ||
        urlStr.includes('/rest/v1/analytics_events')
    ) {
        return false;
    }

    const method = options?.method?.toUpperCase() || 'GET';

    if (method === 'GET' || method === 'HEAD') return true;

    if (method === 'POST' && urlStr.includes('/rpc/')) {
        return SAFE_RPCS.some(rpc => urlStr.includes(`/rpc/${rpc}`));
    }

    // PATCH to quiz_sessions (or legacy saved_quizzes) is an idempotent background quiz state update
    if (
        method === 'PATCH' &&
        (urlStr.includes(`/rest/v1/${DB_TABLES.QUIZ.SESSIONS}`) || urlStr.includes('/rest/v1/saved_quizzes'))
    ) {
        return true;
    }

    return false;
};

export const fetchWithTimeout = async (url: RequestInfo | URL, options?: RequestInit, timeoutMs: number = 15000, retryCount: number = 0): Promise<Response> => {
  const reqId = `req_${++requestIdCounter}`;
  const urlStr = url.toString();

  // Conditionally expand timeout for Supabase Auth email-dispatching requests (signup/OTP/recovery/resend)
  if (isAuthEmailEndpoint(urlStr) && timeoutMs < AUTH_EMAIL_TIMEOUT_MS) {
      timeoutMs = AUTH_EMAIL_TIMEOUT_MS;
  }

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

      // DO NOT confuse our own timeout AbortError/TimeoutError with a broken lock AbortError.
      // Modern Chrome/Android WebView AbortSignal.timeout() throws DOMException with name === 'TimeoutError'
      // and message === 'signal timed out', whereas our manual fallback throws Error('TimeoutError').
      const isOurTimeout =
          err?.name === 'TimeoutError' ||
          err?.message === 'TimeoutError' ||
          err?.message === 'signal timed out' ||
          (err?.name === 'AbortError' && existingSignal?.aborted);

      const isNetworkError = err.message === 'Failed to fetch' || err.name === 'TypeError';
      const isLockError = !isOurTimeout && err.name === 'AbortError' && err.message?.includes('Lock broken');

      if (retryCount < MAX_AUTO_RETRIES && (isNetworkError || isLockError)) {
          // Telemetry Guard: If a lock broke during getSession *because* telemetry was trying to log,
          // do NOT let that telemetry log attempt launch the recovery manager.
          const isBackgroundTelemetryAttempt = urlStr.includes('/rest/v1/analytics_events') ||
                (urlStr.includes('/auth/v1/user') && useRecoveryStore.getState().status !== 'HEALTHY' && useRecoveryStore.getState().status !== 'RECOVERED');

          if (!isSafeToRetry(urlStr, options) || isBackgroundTelemetryAttempt) {
              console.warn(`[Fetch Interceptor] Caught stale session error but request is not safe to retry automatically: ${options?.method} ${urlStr}`);
              // Fall through to throw, letting the UI handle the failure friendly
          } else {
              console.warn(`[Fetch Interceptor] Caught stale session error (${err.name}: ${err.message}). Triggering auto-recovery for ${urlStr}...`);

              const recovered = await triggerAppRecovery(`Intercepted ${err.name} on ${urlStr}`);

              if (recovered) {
                  // Exponential backoff for network stability: 1s, then 2s
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

      // We explicitly PRESERVE the original error object (name, message, stack)
      // so we don't break downstream offline-handlers, while QueryStateHandler maps it to friendly UI.
      throw err;
  }
};
