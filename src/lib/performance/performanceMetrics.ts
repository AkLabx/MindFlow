/**
 * @file performanceMetrics.ts
 * @description Performance budget tracker and SLA instrumentation for MindFlow.
 * Enforces Section 8 of the MindFlow Constitution.
 */

import { telemetry } from '../telemetry';

export const PERF_BUDGETS = {
  /** First contentful paint of the Dashboard */
  DASHBOARD_FCP: 1000,
  /** Dynamic question filtering recalculation (60fps threshold) */
  FILTER_RECALCULATION: 16,
  /** Quiz generation from launch to first question */
  QUIZ_GENERATION: 300,
  /** Route-to-route transitions */
  ROUTE_TRANSITION: 150,
  /** Presentation of bottom sheets and modals */
  MODAL_PRESENTATION: 100,
  /** Display of AI Coach placeholder / skeleton */
  AI_PLACEHOLDER: 50,
  /** AI streaming response generation target */
  AI_RESPONSE: 2500,
} as const;

export type PerfBudgetMetric = keyof typeof PERF_BUDGETS;

class PerformanceTracker {
  private activeMarks = new Map<string, number>();

  /**
   * Starts a performance timing mark.
   * @param label Identifier for the performance measurement
   * @returns Monotonic timestamp in milliseconds
   */
  startMark(label: string): number {
    const start = performance.now();
    this.activeMarks.set(label, start);
    return start;
  }

  /**
   * Completes a performance timing mark and evaluates against the budget.
   * Emits telemetry if the budget SLA is exceeded.
   * 
   * @param label Identifier for the performance measurement
   * @param budgetMs Optional budget threshold in milliseconds
   * @param meta Optional contextual metadata
   * @returns Duration in milliseconds
   */
  endMark(label: string, budgetMs?: number, meta?: Record<string, any>): number {
    const end = performance.now();
    const start = this.activeMarks.get(label);
    this.activeMarks.delete(label);

    const duration = start !== undefined ? end - start : 0;

    if (budgetMs !== undefined && duration > budgetMs) {
      const currentRoute = typeof window !== 'undefined' ? window.location.hash : undefined;
      telemetry.emit('perf_budget_exceeded', {
        metric: label,
        actualMs: Math.round(duration),
        budgetMs,
        route: currentRoute,
      });

      if (import.meta.env.DEV) {
        console.warn(
          `%c[Perf Budget Exceeded] ${label}: ${duration.toFixed(2)}ms (budget: ${budgetMs}ms)`,
          'color: #EF4444; font-weight: bold;',
          meta || {}
        );
      }
    }

    return duration;
  }

  /**
   * Synchronously measures execution time of a synchronous operation against a budget.
   */
  measureSync<T>(label: string, budgetMs: number, fn: () => T, meta?: Record<string, any>): T {
    this.startMark(label);
    try {
      return fn();
    } finally {
      this.endMark(label, budgetMs, meta);
    }
  }

  /**
   * Asynchronously measures execution time of a promise-based operation against a budget.
   */
  async measureAsync<T>(label: string, budgetMs: number, fn: () => Promise<T>, meta?: Record<string, any>): Promise<T> {
    this.startMark(label);
    try {
      return await fn();
    } finally {
      this.endMark(label, budgetMs, meta);
    }
  }
}

export const performanceTracker = new PerformanceTracker();
