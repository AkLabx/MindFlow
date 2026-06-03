export const quizKeys = {
  all: ['quiz'] as const,

  // Library / Bookmarks
  library: () => [...quizKeys.all, 'library'] as const,
  saved: () => [...quizKeys.library(), 'saved'] as const,

  // History / Analytics
  history: () => [...quizKeys.all, 'history'] as const,
  attempted: () => [...quizKeys.history(), 'attempted'] as const,
  analyticsMetrics: () => [...quizKeys.all, 'analytics', 'metrics'] as const,

  // Active Sessions & Results
  sessions: () => [...quizKeys.all, 'sessions'] as const,
  session: (id: string) => [...quizKeys.sessions(), id] as const,
  results: () => [...quizKeys.all, 'results'] as const,
  result: (id: string) => [...quizKeys.results(), id] as const,
};
