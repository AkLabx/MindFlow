/**
 * Environment Constants Registry
 *
 * Provides easy access and type-safety for environment variables.
 */
export const ENV = {
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
} as const;
