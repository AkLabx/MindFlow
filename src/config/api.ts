/**
 * API and Database Constants Registry
 *
 * Centralizes table names, endpoints, and external service URLs.
 */
export const API = {
  TABLES: {
    PROFILES: 'profiles',
    QUESTIONS: 'questions',
    QUIZZES: 'quizzes',
    // Add all supabase tables here
  },
  ENDPOINTS: {
    // Add external API endpoints here if any
  }
} as const;
