/**
 * Global Route Constants Registry
 *
 * This file serves as the single source of truth for all application routes.
 * Using these constants prevents typos, makes refactoring easier, and provides
 * autocompletion across the application.
 */

export const ROUTES = {
  // ---------------------------------------------------------
  // Core App & Auth
  // ---------------------------------------------------------
  home: '/',
  login: '/login',
  signup: '/signup',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  fallback: '*',

  // ---------------------------------------------------------
  // Main Navigation Tabs
  // ---------------------------------------------------------
  mcqs: '/mcqs',
  english: '/english',
  school: '/school',
  community: '/community',
  tools: '/tools',
  ai: '/ai',

  // ---------------------------------------------------------
  // User Profile & Settings
  // ---------------------------------------------------------
  profile: {
    root: '/profile',
    subscription: '/profile/subscription',
    preferences: '/profile/preferences',
    support: '/profile/support',
  },
  settings: {
    root: '/settings',
    myReports: '/settings/my-reports',
    deleteAccount: '/settings/deleteaccount',
  },
  notification: '/notification',
  messages: '/messages',

  // ---------------------------------------------------------
  // Quiz Feature
  // ---------------------------------------------------------
  quiz: {
    library: '/quiz/library',
    analytics: '/quiz/analytics',
    bookmarks: '/quiz/bookmarks',
    config: '/quiz/config',
    // Dynamic Generators
    result: (quizId: string | number) => `/result/${quizId}`,
    live: (id: string | number) => `/quiz/live/${id}`,
    sessionLearning: (quizId: string | number) => `/quiz/session/learning/${quizId}`,
    sessionMock: (quizId: string | number) => `/quiz/session/mock/${quizId}`,
    sessionGod: (quizId: string | number) => `/quiz/session/god/${quizId}`,
  },

  // Shared Result Root (for matching in AppRoutes)
  resultRoot: '/result/:quizId',
  shareRoot: '/share/:originalQuizId',
  share: (originalQuizId: string | number) => `/share/${originalQuizId}`,

  // ---------------------------------------------------------
  // Vocabulary & Flashcards Feature
  // ---------------------------------------------------------
  flashcards: {
    summary: '/flashcards/summary',
  },
  vocab: {
    synonyms: {
      root: '/vocab/synonyms',
      config: '/vocab/synonyms/config',
      library: '/vocab/synonyms/library',
      session: '/vocab/synonyms/session',
      sessionDynamic: (deckId: string | number) => `/vocab/synonyms/session/${deckId}`,
      resultDynamic: (deckId: string | number) => `/vocab/synonyms/result/${deckId}`,
      phase1: '/vocab/synonyms/phase1',
      list: '/vocab/synonyms/list',
      quiz: '/vocab/synonyms/quiz',
    },
    idioms: {
      root: '/vocab/idioms',
      config: '/vocab/idioms/config',
      library: '/vocab/idioms/library',
      session: '/vocab/idioms/session',
      sessionDynamic: (deckId: string | number) => `/vocab/idioms/session/${deckId}`,
      resultDynamic: (deckId: string | number) => `/vocab/idioms/result/${deckId}`,
    },
    ows: {
      root: '/vocab/ows',
      config: '/vocab/ows/config',
      library: '/vocab/ows/library',
      session: '/vocab/ows/session',
      sessionDynamic: (deckId: string | number) => `/vocab/ows/session/${deckId}`,
      resultDynamic: (deckId: string | number) => `/vocab/ows/result/${deckId}`,
    },
  },

  // ---------------------------------------------------------
  // Test Series / Mock Tests
  // ---------------------------------------------------------
  testSeries: {
    root: '/mcqs/test-series',
    comingSoon: '/mcqs/test-series/coming-soon',
    category: (categoryId: string | number) => `/mcqs/test-series/category/${categoryId}`,
    series: (seriesId: string | number) => `/mcqs/test-series/series/${seriesId}`,
    test: (testId: string | number) => `/mcqs/test-series/test/${testId}`,
  },

  // ---------------------------------------------------------
  // Community / Social
  // ---------------------------------------------------------
  social: {
    reels: '/community/reels',
    reelsComments: (id: string | number) => `/community/reels/${id}/comments`,
    search: '/community/search',
    userProfile: (username: string) => `/u/${username}`,
    post: (id: string | number) => `/community/post/${id}`,
  },

  // ---------------------------------------------------------
  // Tools
  // ---------------------------------------------------------
  toolsRoutes: {
    flashcardMaker: '/tools/flashcard-maker',
    bilingualPdfMaker: '/tools/bilingual-pdf-maker',
    textExporter: '/tools/text-exporter',
    quizPdfPptGenerator: '/tools/quiz-pdf-ppt-generator',
    asciiArtHub: '/tools/ascii-art-hub',
    asciiArtNumber: '/tools/ascii-art/number',
    asciiArtInvisibleInk: '/tools/ascii-art/invisible-ink',
    asciiArtStego: '/tools/ascii-art/stego',
  },

  // ---------------------------------------------------------
  // AI
  // ---------------------------------------------------------
  aiRoutes: {
    chat: '/ai/chat',
    talk: '/ai/talk',
  },

  // ---------------------------------------------------------
  // School
  // ---------------------------------------------------------
  schoolRoutes: {
    download: '/school/download',
  },

  // ---------------------------------------------------------
  // Admin
  // ---------------------------------------------------------
  admin: {
    root: '/admin',
    appConfig: '/admin/app-config',
    reports: '/admin/reports',
    materials: '/admin/materials',
    upload: '/admin/upload',
    uploadGk: '/admin/uploadgk',
    uploadOws: '/admin/upload-ows',
    uploadIdioms: '/admin/upload-idioms',
    uploadSynonyms: '/admin/upload-synonyms',
    enrichment: '/admin/enrichment',
    testSeries: '/admin/test-series',
    content: '/admin/content',
    notifications: '/admin/notifications',
  },

  // ---------------------------------------------------------
  // Static / Legal
  // ---------------------------------------------------------
  about: {
    root: '/about',
    developerProfile: '/about/developer-profile',
    developerProfileAalok: '/about/developer-profile/aalok',
    developerProfileDynamic: (id: string | number) => `/about/developer-profile/${id}`,
    termsOfUse: '/about/terms-of-use',
    privacyPolicy: '/privacy-policy',
  }
} as const;
