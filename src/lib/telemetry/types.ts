export interface TelemetryPayloads {
  // Existing business / diagnostic events
  exam_selected: { examId: string; source: 'strip' | 'modal' | 'banner' | 'hub' | 'config' };
  quiz_generated: { examId?: string; mode: string; count: number; durationMs: number; reusedSession?: boolean };
  quiz_generation_failed: { reason: string; filterIntersection?: Record<string, any> };
  resume_quiz: { quizId: string; progressPct?: number; daysPaused?: number };
  filters_cleared: { preservedExamId?: string; clearedFields: string[] };
  empty_state_seen: { view: string; triggerCondition: string };
  recovery_action_clicked: { view: string; actionChosen: string };
  perf_budget_exceeded: { metric: string; actualMs: number; budgetMs: number; route?: string };
  offline_sync_completed: { recordsSynced: number; durationMs: number };
  vulnerability_diagnosed: { examId: string; primaryTopic: string; errorCount: number; isDiagnostic: boolean };
  ai_drill_launched: { examId: string; topic: string; mode: string; isDiagnostic: boolean };
  readiness_computed: { examId: string; readinessScore: number; coveragePct: number; tier: string };
  revision_plan_generated: { examId: string; topicsDueCount: number };
  dashboard_drill_sheet_opened: { drillType: string; drillTitle: string; exam?: string };
  dashboard_drill_started: { drillType: string; drillTitle: string; mode: string; questionCount: number };
  dashboard_drill_customize_clicked: { drillType: string; drillTitle: string; mode: string; questionCount: number };

  // System, Environment & Lifecycle events
  app_opened: { coldStartMs?: number; is_authenticated?: boolean };
  page_viewed: { path: string; search?: string; hash?: string };
  auth_signup_attempted: { provider: 'google' | 'email' };
  auth_login_succeeded: { provider: 'google' | 'email' };
  quiz_session_started: { examId?: string; mode: string; count: number };
  session_recovery: { success: boolean; duration_ms: number; reason: string; error?: string; error_code?: string; error_class?: string };
}

export type TelemetryEventName = keyof TelemetryPayloads;

export interface DeviceTelemetryContext {
  platform: 'android' | 'web';
  app_version: string;
  viewport: string;
  screen_resolution: string;
  device_pixel_ratio: number;
  orientation: string;
  touch_capable: boolean;
  language: string;
  timezone: string;
  network_type?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}
