/**
 * Storage Keys Registry
 *
 * Centralizes LocalStorage and IndexedDB keys.
 */
export const STORAGE_KEYS = {
  LOCAL_STORAGE: {
    THEME: 'darkMode',
    QUIZ_SESSION: 'mindflow_quiz_session_v1',
    SETTINGS: 'mindflow_settings_v1',
  },
  INDEXED_DB: {
    DB_NAME: 'MindflowDB',
    // ... we can add store names here as well
  }
} as const;
