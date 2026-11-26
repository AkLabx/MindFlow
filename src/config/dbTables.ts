/**
 * Centralized Supabase PostgreSQL Table & RPC Registry for MindFlow Assessments.
 *
 * NOTE (`DEC-0004`): Local browser IndexedDB object store names in `src/lib/db.ts`
 * (`'saved_quizzes'`, `'quiz_history'`) remain intentionally separate so existing
 * offline user caches are never wiped. Always use `DB_TABLES` for remote Supabase
 * `.from(...)` queries and PostgREST relational embeds.
 */
export const DB_TABLES = {
  /** Block A — Admin-Prepared Preset Mock Tests (`mock_*`) */
  MOCK: {
    CATEGORIES: 'mock_categories',
    SERIES: 'mock_series',
    BUNDLE_ITEMS: 'mock_series_bundle_items',
    TESTS: 'mock_tests',
    ATTEMPTS: 'mock_test_attempts',
  },
  /** Block B — Custom Student Quizzes (`quiz_*`) */
  QUIZ: {
    SESSIONS: 'quiz_sessions',
    SESSION_QUESTIONS: 'quiz_session_questions',
    SESSION_RESULTS: 'quiz_session_results',
  },
  /** Core Question Bank & Adaptive Mastery */
  BANK: {
    QUESTIONS: 'questions',
    MASTERY: 'user_question_mastery',
    SUBJECT_METADATA_CACHE: 'subject_metadata_cache',
    EXAM_CATALOG: 'exam_catalog',
    EXAM_CYCLES: 'exam_cycles',
    TAXONOMY: 'question_taxonomy',
  },
  /** Exam Blueprints */
  BLUEPRINT: {
    BLUEPRINTS: 'user_exam_blueprints',
    SEEN_QUESTIONS: 'blueprint_seen_questions',
  },
  /** Answer Key & Ranker Engine */
  RANKER: {
    CONFIGS: 'exam_configs',
    SUBMISSIONS: 'exam_submissions',
    SECTION_RESULTS: 'exam_section_results',
    STATS_SNAPSHOTS: 'exam_stats_snapshots',
    OFFICIAL_KEYS: 'official_answer_keys',
  },
  BILLING: {
    PAYMENTS: 'payments',
    ENTITLEMENTS: 'user_course_entitlements',
  },
} as const;

export const DB_RPCS = {
  MOCK_LEADERBOARD: 'get_test_leaderboard',
  GET_TEST_LEADERBOARD: 'get_test_leaderboard',
  GET_MOCK_TEST_LEADERBOARD: 'get_mock_test_leaderboard',
  CREATE_QUIZ_SESSION: 'create_quiz_session',
  SUBMIT_QUIZ_SESSION: 'submit_quiz_session',
  CLONE_SHARED_QUIZ: 'clone_shared_quiz',
  EXPORT_USER_DATA: 'export_user_data',
  BACKFILL_USER_QUESTION_MASTERY: 'backfill_user_question_mastery',
  CLEANUP_ORPHANED_BRIDGE_ROWS: 'cleanup_orphaned_bridge_rows',
  GET_USER_PERFORMANCE_METRICS: 'get_user_performance_metrics',
  RECORD_QUESTION_INTERACTIONS: 'record_question_interactions',
  RESET_USER_ANALYTICS: 'reset_user_analytics',
  SUBMIT_COURSE_PAYMENT_REQUEST: 'submit_course_payment_request',
  LOOKUP_STUDENT_FOR_ENROLLMENT: 'lookup_student_for_enrollment',
  ADMIN_ACTIVATE_COURSE_ENTITLEMENT: 'admin_activate_course_entitlement',
  ADMIN_REJECT_COURSE_PAYMENT_REQUEST: 'admin_reject_course_payment_request',
  GET_QUESTION_TAXONOMY_TREE: 'get_question_taxonomy_tree',
} as const;
