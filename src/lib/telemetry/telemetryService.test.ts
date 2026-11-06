import { describe, it, expect, beforeEach } from 'vitest';
import { telemetry } from './telemetryService';

describe('telemetryService', () => {
  beforeEach(() => {
    telemetry.clear();
  });

  it('records emitted events in the ring buffer', () => {
    telemetry.emit('exam_selected', { examId: 'ssc_cgl', source: 'strip' });

    const history = telemetry.getHistory();
    expect(history).toHaveLength(1);
    const first = history[0];
    expect(first.name).toBe('exam_selected');
    if (first.name === 'exam_selected') {
      expect(first.payload.examId).toBe('ssc_cgl');
      expect(first.payload.source).toBe('strip');
    }
    expect(first.timestamp).toBeGreaterThan(0);
  });

  it('bounds buffer size to 50 entries', () => {
    for (let i = 0; i < 60; i++) {
      telemetry.emit('exam_selected', { examId: `exam_${i}`, source: 'modal' });
    }

    const history = telemetry.getHistory();
    expect(history).toHaveLength(50);
    // Oldest 10 entries should have been evicted
    const oldest = history[0];
    const newest = history[49];
    if (oldest.name === 'exam_selected') {
      expect(oldest.payload.examId).toBe('exam_10');
    }
    if (newest.name === 'exam_selected') {
      expect(newest.payload.examId).toBe('exam_59');
    }
  });

  it('clears buffer on clear()', () => {
    telemetry.emit('exam_selected', { examId: 'bpsc', source: 'banner' });
    expect(telemetry.getHistory()).toHaveLength(1);

    telemetry.clear();
    expect(telemetry.getHistory()).toHaveLength(0);
  });

  it('sanitizes and strips forbidden PII fields', () => {
    // Pass object with forbidden fields
    telemetry.emit('quiz_generation_failed' as any, {
      reason: 'No questions',
      email: 'user@example.com',
      token: 'secret-token',
      nested: {
        password: 'password123',
        safeKey: 'safeValue',
      },
    } as any);

    const history = telemetry.getHistory();
    expect(history).toHaveLength(1);
    const payload = history[0].payload as any;
    expect(payload.reason).toBe('No questions');
    expect(payload.email).toBeUndefined();
    expect(payload.token).toBeUndefined();
    expect(payload.nested?.password).toBeUndefined();
    expect(payload.nested?.safeKey).toBe('safeValue');
  });
});
