/**
 * @file stateOwnershipRegistry.ts
 * @description Canonical State Ownership Matrix enforcing Section 3 of the MindFlow Constitution.
 * 
 * Rules:
 * 1. Exactly ONE store owns each slice of state.
 * 2. Child components READ via derived selectors.
 * 3. Mutations occur ONLY through exported store actions.
 * 4. Downstream screens NEVER maintain shadow local state.
 */

export type StateEntityKey =
  | 'active_target_exam'
  | 'pinned_exam_list'
  | 'active_subject_topic'
  | 'draft_quiz_filters'
  | 'inflight_quiz_session'
  | 'question_taxonomy_cache'
  | 'cognitive_mastery'
  | 'bookmarked_questions'
  | 'user_profile_stats'
  | 'global_ui_overlays';

export interface StateOwnershipEntry {
  entity: StateEntityKey;
  name: string;
  soleOwnerStore: string;
  primaryStorage: string;
  authorizedConsumers: readonly string[];
  prohibitedBehaviors: string;
}

export const STATE_OWNERSHIP_REGISTRY: Record<StateEntityKey, StateOwnershipEntry> = {
  active_target_exam: {
    entity: 'active_target_exam',
    name: 'Active Target Exam',
    soleOwnerStore: 'useExamContextStore',
    primaryStorage: 'localStorage (mindflow_exam_context_v1) + Supabase profile',
    authorizedConsumers: [
      'Dashboard',
      'QuizConfig',
      'SubjectHub',
      'AI Coach',
      'MistakeNotebook',
      'Bookmarks',
      'TodaysPlan',
    ],
    prohibitedBehaviors: 'Component holding shadow currentExam state; resetting exam upon clearing topic filters.',
  },
  pinned_exam_list: {
    entity: 'pinned_exam_list',
    name: 'Pinned Exam List',
    soleOwnerStore: 'useExamContextStore',
    primaryStorage: 'localStorage (mindflow_exam_context_v1)',
    authorizedConsumers: ['ExamQuickAccessStrip', 'ManageTargetExamsModal'],
    prohibitedBehaviors: 'Hardcoding pinned exam arrays inside page templates.',
  },
  active_subject_topic: {
    entity: 'active_subject_topic',
    name: 'Active Subject / Topic Context',
    soleOwnerStore: 'Route URL Context',
    primaryStorage: 'React Router URL params (/subject/:subjectName)',
    authorizedConsumers: ['SubjectHubPage', 'SubjectTopicsPage', 'QuizConfig'],
    prohibitedBehaviors: 'Passing subject names via volatile window globals or uncontrolled React state.',
  },
  draft_quiz_filters: {
    entity: 'draft_quiz_filters',
    name: 'Draft Quiz Filters',
    soleOwnerStore: 'useQuizConfigStore',
    primaryStorage: 'sessionStorage (mindflow_draft_filters)',
    authorizedConsumers: ['QuizConfig.tsx'],
    prohibitedBehaviors: 'Re-requesting exam or resetting drafted filters on accidental page pop.',
  },
  inflight_quiz_session: {
    entity: 'inflight_quiz_session',
    name: 'In-Flight Quiz Session',
    soleOwnerStore: 'useQuizSessionStore',
    primaryStorage: 'Dexie IndexedDB (db.saved_quizzes)',
    authorizedConsumers: ['LearningSession', 'MockSession', 'ResultGuard'],
    prohibitedBehaviors: 'Storing answers solely in React useState; dropping state on browser refresh.',
  },
  question_taxonomy_cache: {
    entity: 'question_taxonomy_cache',
    name: 'Question Taxonomy Cache',
    soleOwnerStore: 'useQuestionMetadata',
    primaryStorage: 'Dexie IndexedDB (db.cached_metadata) + Memory',
    authorizedConsumers: ['QuizConfig', 'SubjectStrip', 'ExamCard', 'SubjectHub'],
    prohibitedBehaviors: 'Triggering full Supabase SQL RPCs when client cache is warm (<24h).',
  },
  cognitive_mastery: {
    entity: 'cognitive_mastery',
    name: 'Cognitive Mastery Records',
    soleOwnerStore: 'masteryService',
    primaryStorage: 'Dexie IndexedDB + Supabase (user_question_mastery)',
    authorizedConsumers: ['MistakeNotebookPage', 'MasteryDrillBar', 'CognitiveDeck'],
    prohibitedBehaviors: 'Calculating vulnerability index ad-hoc inside UI render loops.',
  },
  bookmarked_questions: {
    entity: 'bookmarked_questions',
    name: 'Bookmarked Questions',
    soleOwnerStore: 'useBookmarkStore',
    primaryStorage: 'Dexie IndexedDB (db.bookmarks) + Cloud Sync',
    authorizedConsumers: ['BookmarksPage', 'DashboardGreeting', 'QuestionCard'],
    prohibitedBehaviors: 'Storing bookmark state as a boolean on question objects without syncing.',
  },
  user_profile_stats: {
    entity: 'user_profile_stats',
    name: 'User Profile & Stats',
    soleOwnerStore: 'useAuth / useProfileStats',
    primaryStorage: 'Supabase Auth Session + localStorage',
    authorizedConsumers: ['Entire Application'],
    prohibitedBehaviors: 'Polling Supabase for profile data on every route change.',
  },
  global_ui_overlays: {
    entity: 'global_ui_overlays',
    name: 'Global UI Overlays',
    soleOwnerStore: 'useNotificationStore / useLayoutStore',
    primaryStorage: 'In-Memory (Zustand)',
    authorizedConsumers: ['App.tsx', 'MainLayout.tsx'],
    prohibitedBehaviors: 'Direct DOM manipulation for alerts, toasts, or bottom bar spacing.',
  },
};

/**
 * Validates consumer access against the authoritative State Ownership Registry.
 */
export function assertStateConsumer(entityKey: StateEntityKey, consumerName: string): boolean {
  const entry = STATE_OWNERSHIP_REGISTRY[entityKey];
  if (!entry) return false;

  const isAuthorized =
    entry.authorizedConsumers.includes('Entire Application') ||
    entry.authorizedConsumers.includes(consumerName);

  if (!isAuthorized && import.meta.env.DEV) {
    console.warn(
      `%c[Architecture Violation] Consumer "${consumerName}" is not registered for state entity "${entry.name}".`,
      'color: #DC2626; font-weight: bold;',
      `Refer to docs/MINDFLOW_CONSTITUTION.md Section 3. Owning store: ${entry.soleOwnerStore}`
    );
  }

  return isAuthorized;
}
