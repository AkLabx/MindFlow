type SchedulerLike = {
  yield?: () => Promise<void>;
};

const getTimestamp = (): number => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
};

/**
 * Yields control back to the browser main thread so pending input events and
 * paint frames can run without long-task stalls (INP optimization).
 *
 * Uses `scheduler.yield()` when supported, falling back to `setTimeout(..., 0)`
 * in engines without Prioritized Task Scheduling support (e.g. Safari).
 */
export const yieldToMain = (): Promise<void> => {
  const maybeScheduler = (globalThis as typeof globalThis & { scheduler?: SchedulerLike }).scheduler;
  if (maybeScheduler && typeof maybeScheduler.yield === 'function') {
    return maybeScheduler.yield();
  }
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
};

/**
 * Creates a deadline-based yield controller aligned with the 50ms long-task threshold.
 * Call `await yieldIfNeeded()` inside tight async loops to yield only when the
 * active work slice reaches `budgetMs`, avoiding per-iteration timer overhead.
 */
export const createYieldController = (budgetMs = 50): (() => Promise<void>) => {
  let deadline = getTimestamp() + budgetMs;

  return async () => {
    if (getTimestamp() >= deadline) {
      await yieldToMain();
      deadline = getTimestamp() + budgetMs;
    }
  };
};
