/**
 * App Metadata Registry
 *
 * General application metadata like versioning and external links.
 */
export const APP = {
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  CONTACT_EMAIL: 'support@mindflow.com',
  GITHUB_REPO: 'https://github.com/mindflow/app',
} as const;
