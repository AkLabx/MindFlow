
export const APP_CONFIG = {
  APP_NAME: 'MindFlow Quiz',
  STORAGE_KEYS: {
    QUIZ_SESSION: 'mindflow_quiz_session_v1',
    SETTINGS: 'mindflow_settings_v1',
    THEME: 'darkMode',
  },
  TIMERS: {
    LEARNING_MODE_DEFAULT: 60, // seconds per question
    MOCK_MODE_DEFAULT_PER_QUESTION: 30, // seconds per question for calculating total
  },
  PAGINATION: {
    BATCH_SIZE: 25, // For navigation grouping
  }
};
