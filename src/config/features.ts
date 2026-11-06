/**
 * Feature Flags Registry
 *
 * Centralized toggle for experimental or seasonal features.
 */
export const FEATURES = {
  ENABLE_AI_TUTOR: true,
  ENABLE_MULTIPLAYER_QUIZ: false,
  SHOW_ADS: false,
  EXAM_ANALYTICS: {
    PHASE_1_MVP: true,
    PHASE_2_RANKS: false,
    PHASE_3_STATS: false,
    PHASE_4_AI_INSIGHTS: false,
  },
} as const;
