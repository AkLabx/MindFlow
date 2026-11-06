/**
 * @file telemetryService.ts
 * @description Centralized, privacy-first diagnostic telemetry engine for MindFlow.
 * Enforces Section 11 of the MindFlow Constitution.
 */

export interface TelemetryPayloads {
  exam_selected: { examId: string; source: 'strip' | 'modal' | 'banner' | 'hub' | 'config' };
  quiz_generated: { examId?: string; mode: string; count: number; durationMs: number; reusedSession?: boolean };
  quiz_generation_failed: { reason: string; filterIntersection?: Record<string, any> };
  resume_quiz: { quizId: string; progressPct?: number; daysPaused?: number };
  filters_cleared: { preservedExamId?: string; clearedFields: string[] };
  empty_state_seen: { view: string; triggerCondition: string };
  recovery_action_clicked: { view: string; actionChosen: string };
  perf_budget_exceeded: { metric: string; actualMs: number; budgetMs: number; route?: string };
  offline_sync_completed: { recordsSynced: number; durationMs: number };
}

export type TelemetryEventName = keyof TelemetryPayloads;

export type TelemetryRecord = {
  [K in TelemetryEventName]: {
    name: K;
    payload: TelemetryPayloads[K];
    timestamp: number;
  };
}[TelemetryEventName];

class TelemetryService {
  private buffer: TelemetryRecord[] = [];
  private maxBufferSize = 50;

  /**
   * Emits a privacy-first diagnostic event.
   */
  emit<K extends TelemetryEventName>(name: K, payload: TelemetryPayloads[K]): void {
    const record = {
      name,
      payload: this.sanitizePayload(payload),
      timestamp: Date.now(),
    } as TelemetryRecord;

    // Maintain in-memory ring buffer for runtime diagnostics
    this.buffer.push(record);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    if (import.meta.env.DEV) {
      console.log(`%c[Telemetry] ${name}`, 'color: #6366F1; font-weight: bold;', record.payload);
    }
  }

  /**
   * Retrieves the in-memory telemetry buffer.
   */
  getHistory(): readonly TelemetryRecord[] {
    return [...this.buffer];
  }

  /**
   * Clears in-memory telemetry buffer.
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Strips any unintentional PII or sensitive keys from telemetry payloads.
   */
  private sanitizePayload<T>(payload: T): T {
    if (!payload || typeof payload !== 'object') return payload;

    const forbiddenKeys = ['email', 'password', 'token', 'user_note', 'question', 'question_hi', 'notes'];
    const sanitized: any = Array.isArray(payload) ? [] : {};

    for (const [key, value] of Object.entries(payload)) {
      if (forbiddenKeys.includes(key.toLowerCase())) {
        continue;
      }
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizePayload(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }
}

export const telemetry = new TelemetryService();
