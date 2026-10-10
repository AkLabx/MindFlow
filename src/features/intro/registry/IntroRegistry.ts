import { IntroModuleDef } from './types';

// The blue intro is always available and bundled (or lazy-loaded immediately).
// For strict lazy loading of all, we define them with dynamic imports.

export const introRegistry: Record<string, IntroModuleDef> = {
  blue: {
    id: 'blue',
    name: 'Blue Splash Reveal',
    description: 'The classic MindFlow experience. Expands and reveals the app.',
    isAvailable: true,
    load: () => import('../modules/blue/BlueIntro'),
  },
  'minimal-fade': {
    id: 'minimal-fade',
    name: 'Minimal Fade',
    description: 'A sophisticated, smooth fade-in experience.',
    isAvailable: true,
    load: () => import('../modules/minimal-fade/MinimalFadeIntro'),
  },
  particle: {
    id: 'particle',
    name: 'AI Particle',
    description: 'A futuristic particle animation representing AI connections.',
    isAvailable: true,
    load: () => import('../modules/particle/ParticleIntro'),
  },
  // Placeholders
  liquid: {
    id: 'liquid',
    name: 'Liquid Morph',
    description: 'Fluid, morphing shapes that settle into the interface.',
    isAvailable: false,
    load: () => import('../modules/blue/BlueIntro'), // Fallback
  },
  glass: {
    id: 'glass',
    name: 'Glass Blur Reveal',
    description: 'Frosted glass clearing away to reveal the app.',
    isAvailable: false,
    load: () => import('../modules/blue/BlueIntro'), // Fallback
  },
  ripple: {
    id: 'ripple',
    name: 'Material Ripple',
    description: 'A clean material-design style ripple expansion.',
    isAvailable: false,
    load: () => import('../modules/blue/BlueIntro'), // Fallback
  },
  gradient: {
    id: 'gradient',
    name: 'Gradient Wave',
    description: 'A smooth, flowing gradient wave transition.',
    isAvailable: false,
    load: () => import('../modules/blue/BlueIntro'), // Fallback
  },
  'logo-explosion': {
    id: 'logo-explosion',
    name: 'Logo Explosion',
    description: 'High-energy logo dispersion effect.',
    isAvailable: false,
    load: () => import('../modules/blue/BlueIntro'), // Fallback
  },
  'circular-mask': {
    id: 'circular-mask',
    name: 'Circular Mask Reveal',
    description: 'Precise geometry revealing the interface.',
    isAvailable: false,
    load: () => import('../modules/blue/BlueIntro'), // Fallback
  },
  'premium-dark': {
    id: 'premium-dark',
    name: 'Premium Dark Intro',
    description: 'A sleek, luxury dark-mode exclusive intro.',
    isAvailable: false,
    load: () => import('../modules/blue/BlueIntro'), // Fallback
  }
};

export const getIntroModule = (id: string): IntroModuleDef => {
  return introRegistry[id] || introRegistry['blue'];
};

export const getAllIntroModules = (): IntroModuleDef[] => {
  return Object.values(introRegistry);
};
