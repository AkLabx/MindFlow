/**
 * Global Route Constants Registry
 *
 * This file serves as the single source of truth for all application routes.
 * Using these constants prevents typos, makes refactoring easier, and provides
 * autocompletion across the application.
 */

export const ROUTES = {
  // Core App & Auth
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  FALLBACK: '*',

  TODAYS_PLAN: '/todays-plan',
  DAILY_MISSION: '/daily-mission',

  // Main Navigation Tabs
  MCQS: '/mcqs',
  ENGLISH: '/english',
  SCHOOL: '/school',
  COMMUNITY: '/community',
  TOOLS: '/tools',
  AI: '/ai',

  // User Profile & Settings
  PROFILE: {
    ROOT: '/profile',
    SUBSCRIPTION: '/profile/subscription',
    PREFERENCES: '/profile/preferences',
    SUPPORT: '/profile/support',
  },

  SETTINGS: {
    ROOT: '/settings',
    MY_REPORTS: '/settings/my-reports',
    DELETE_ACCOUNT: '/settings/deleteaccount',
  },

  NOTIFICATION: '/notification',
  MESSAGES: '/messages',

  // Quiz Feature
  QUIZ: {
    LIBRARY: '/quiz/library',
    ANALYTICS: '/quiz/analytics',
    BOOKMARKS: '/quiz/bookmarks',
    CONFIG: '/quiz/config',

    SESSION: {
      learning: (id: string | number) => `/quiz/session/learning/${id}`,
      mock: (id: string | number) => `/quiz/session/mock/${id}`,
      god: (id: string | number) => `/quiz/session/god/${id}`,
    },

    live: (id: string | number) => `/quiz/live/${id}`,
  },

  // Shared matching roots
  RESULT: {
    ROOT: '/result/:quizId',
    view: (quizId: string | number) => `/result/${quizId}`
  },

  SHARE: {
    ROOT: '/share/:originalQuizId',
    view: (originalQuizId: string | number) => `/share/${originalQuizId}`,
  },

  // Vocabulary & Flashcards Feature
  FLASHCARDS: {
    SUMMARY: '/flashcards/summary',
  },

  VOCAB: {
    SYNONYMS: {
      ROOT: '/vocab/synonyms',
      CONFIG: '/vocab/synonyms/config',
      LIBRARY: '/vocab/synonyms/library',
      SESSION: {
        root: '/vocab/synonyms/session',
        dynamic: (deckId: string | number) => `/vocab/synonyms/session/${deckId}`,
      },
      RESULT: (deckId: string | number) => `/vocab/synonyms/result/${deckId}`,
      PHASE1: '/vocab/synonyms/phase1',
      LIST: '/vocab/synonyms/list',
      QUIZ: '/vocab/synonyms/quiz',
    },
    IDIOMS: {
      ROOT: '/vocab/idioms',
      CONFIG: '/vocab/idioms/config',
      LIBRARY: '/vocab/idioms/library',
      SESSION: {
        root: '/vocab/idioms/session',
        dynamic: (deckId: string | number) => `/vocab/idioms/session/${deckId}`,
      },
      RESULT: (deckId: string | number) => `/vocab/idioms/result/${deckId}`,
    },
    OWS: {
      ROOT: '/vocab/ows',
      CONFIG: '/vocab/ows/config',
      LIBRARY: '/vocab/ows/library',
      SESSION: {
        root: '/vocab/ows/session',
        dynamic: (deckId: string | number) => `/vocab/ows/session/${deckId}`,
      },
      RESULT: (deckId: string | number) => `/vocab/ows/result/${deckId}`,
    },
  },

  // Test Series / Mock Tests
  TEST_SERIES: {
    ROOT: '/mcqs/test-series',
    COMING_SOON: '/mcqs/test-series/coming-soon',
    CATEGORY: (categoryId: string | number) => `/mcqs/test-series/category/${categoryId}`,
    SERIES: (seriesId: string | number) => `/mcqs/test-series/series/${seriesId}`,
    TEST: (testId: string | number) => `/mcqs/test-series/test/${testId}`,
  },

  // Community / Social
  SOCIAL: {
    REELS: '/community/reels',
    REELS_COMMENTS: (id: string | number) => `/community/reels/${id}/comments`,
    SEARCH: '/community/search',
    USER_PROFILE: (username: string) => `/u/${username}`,
    POST: (id: string | number) => `/community/post/${id}`,
  },

  // Tools
  TOOLS_ROUTES: {
    FLASHCARD_MAKER: '/tools/flashcard-maker',
    BILINGUAL_PDF_MAKER: '/tools/bilingual-pdf-maker',
    TEXT_EXPORTER: '/tools/text-exporter',
    QUIZ_PDF_PPT_GENERATOR: '/tools/quiz-pdf-ppt-generator',
    ASCII_ART_HUB: '/tools/ascii-art-hub',
    ASCII_ART_NUMBER: '/tools/ascii-art/number',
    ASCII_ART_INVISIBLE_INK: '/tools/ascii-art/invisible-ink',
    ASCII_ART_STEGO: '/tools/ascii-art/stego',
  },

  // AI
  AI_ROUTES: {
    CHAT: '/ai/chat',
    TALK: '/ai/talk',
  },

  // School
  SCHOOL_ROUTES: {
    DOWNLOAD: '/school/download',
  },

  // Admin
  ADMIN: {
    ROOT: '/admin',
    APP_CONFIG: '/admin/app-config',
    REPORTS: '/admin/reports',
    MATERIALS: '/admin/materials',
    UPLOAD: '/admin/upload',
    UPLOAD_GK: '/admin/uploadgk',
    UPLOAD_OWS: '/admin/upload-ows',
    UPLOAD_IDIOMS: '/admin/upload-idioms',
    UPLOAD_SYNONYMS: '/admin/upload-synonyms',
    ENRICHMENT: '/admin/enrichment',
    TEST_SERIES: '/admin/test-series',
    CONTENT: '/admin/content',
    NOTIFICATIONS: '/admin/notifications',
  },

  // Static / Legal
  ABOUT: {
    ROOT: '/about',
    DEVELOPER_PROFILE: '/about/developer-profile',
    DEVELOPER_PROFILE_AALOK: '/about/developer-profile/aalok',
    DEVELOPER_PROFILE_DYNAMIC: (id: string | number) => `/about/developer-profile/${id}`,
    TERMS_OF_USE: '/about/terms-of-use',
    PRIVACY_POLICY: '/privacy-policy',
  }
} as const;
