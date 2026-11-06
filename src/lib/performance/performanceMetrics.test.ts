import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceTracker, PERF_BUDGETS } from './performanceMetrics';
import { telemetry } from '../telemetry';

describe('performanceMetrics', () => {
  beforeEach(() => {
    telemetry.clear();
  });

  it('measures synchronous operations within budget', () => {
    const result = performanceTracker.measureSync('test_sync_fast', 100, () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
      return sum;
    });

    expect(result).toBe(499500);
    // Should NOT have emitted perf_budget_exceeded
    const history = telemetry.getHistory();
    const violation = history.find(e => e.name === 'perf_budget_exceeded');
    expect(violation).toBeUndefined();
  });

  it('measures asynchronous operations within budget', async () => {
    const result = await performanceTracker.measureAsync('test_async_fast', 200, async () => {
      return 'fast_result';
    });

    expect(result).toBe('fast_result');
    const history = telemetry.getHistory();
    const violation = history.find(e => e.name === 'perf_budget_exceeded');
    expect(violation).toBeUndefined();
  });

  it('emits perf_budget_exceeded telemetry when SLA budget is violated', () => {
    let mockTime = 1000;
    const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => mockTime);

    performanceTracker.startMark('test_violation');
    
    // Simulate delay
    mockTime += 50; // 50ms simulated duration

    const duration = performanceTracker.endMark('test_violation', 10); // budget 10ms

    expect(duration).toBe(50);
    const history = telemetry.getHistory();
    const violation = history.find(e => e.name === 'perf_budget_exceeded');
    expect(violation).toBeDefined();
    if (violation && violation.name === 'perf_budget_exceeded') {
      expect(violation.payload.metric).toBe('test_violation');
      expect(violation.payload.budgetMs).toBe(10);
      expect(violation.payload.actualMs).toBe(50);
    }

    nowSpy.mockRestore();
  });
});
