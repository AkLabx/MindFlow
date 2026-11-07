/**
 * MindFlow Brand Identity Tokens (brandTokens.ts)
 * 
 * The single authoritative definition of MindFlow brand artwork, vector geometries,
 * gradient anchors, and sizing ratios across all platforms (Web, PWA, Capacitor Android).
 */

export const BRAND_COLORS = {
  primary: '#4f46e5',   // Indigo-600
  secondary: '#a855f7', // Purple-500
  accent: '#6366f1',    // Indigo-500
  darkBg: '#0f172a',    // Slate-900
  lightBg: '#ffffff',
  gradient: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
  conicHalo: 'conic-gradient(from 0deg, transparent 0%, transparent 30%, rgba(168, 85, 247, 0.5) 60%, rgba(79, 70, 229, 0.9) 80%, #4f46e5 100%)',
} as const;

export const BRAND_SIZES = {
  xs: 16,
  sm: 24,
  md: 36,
  lg: 48,
  xl: 80,
  '2xl': 120,
} as const;

export type BrandSizeKey = keyof typeof BRAND_SIZES;

/**
 * 1. The Canonical Smooth Brain Glyph with Neural Lobes
 * Used as the primary emblem (App icon, BlueIntro, headers, squircle).
 */
export const SMOOTH_BRAIN_PATHS = {
  leftLobe: 'M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z',
  rightLobe: 'M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z',
} as const;

/**
 * 2. The Circuit-Board Brain Paths
 * Used in the high-impact animated variant (with drawing paths and synapse spark nodes).
 */
export const CIRCUIT_BRAIN_PATHS = {
  left: [
    'M125 200c0-50 30-90 80-90s80 40 80 90c0 20-10 40-25 55',
    'M100 280c-30 0-60-20-60-70 0-40 30-80 70-80',
    'M120 350c-40 0-70-30-70-70',
    'M205 380c-50 0-85-30-85-80'
  ],
  right: [
    'M375 200c0-50-30-90-80-90s-80 40-80 90c0 20-10 40-25 55',
    'M400 280c30 0 60-20 60-70 0-40-30-80-70-80',
    'M380 350c40 0 70-30 70-70',
    'M295 380c50 0 85-30 85-80'
  ],
  synapses: [
    { cx: 250, cy: 150, r: 20 },
    { cx: 250, cy: 250, r: 20 },
    { cx: 250, cy: 350, r: 20 }
  ],
  sparks: [
    'M250 150 L250 100',
    'M250 380 L250 420'
  ]
} as const;
