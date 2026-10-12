/**
 * Branding Registry
 *
 * Centralizes application names, taglines, seasonal themes, and ad configurations.
 */
export const BRANDING = {
  APP_NAME: 'MindFlow',
  APP_TAGLINE: 'Master your exams',

  // Example for seasonal themes
  THEME: {
    IS_FESTIVE: false,
    FESTIVE_BANNER_URL: '', // e.g., '/assets/banners/diwali.png'
  }
} as const;
