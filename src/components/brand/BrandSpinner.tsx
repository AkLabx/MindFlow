import React from 'react';
import { BrandLogo } from './BrandLogo';
import { MORPHING_SYNAPSE_PATHS } from './brandTokens';
import { useAppConfigStore } from '@/stores/useAppConfigStore';

export type BrandSpinnerVariant = 'synaptic' | 'morphing' | 'inline' | 'skeleton' | 'classic';

export interface BrandSpinnerProps {
  variant?: BrandSpinnerVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  speed?: 'normal' | 'snappy' | 'relaxed';
  showEmblem?: boolean;
  label?: string;
  className?: string;
}

const SPEED_DURATIONS: Record<'normal' | 'snappy' | 'relaxed', string> = {
  snappy: '0.9s',
  normal: '1.5s',
  relaxed: '2.2s',
};

const MORPH_DURATIONS: Record<'normal' | 'snappy' | 'relaxed', string> = {
  snappy: '2.5s',
  normal: '4s',
  relaxed: '6s',
};

const SYNAPTIC_SIZES: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', { ring: number; emblem: number }> = {
  xs: { ring: 28, emblem: 14 },
  sm: { ring: 44, emblem: 20 },
  md: { ring: 64, emblem: 28 },
  lg: { ring: 96, emblem: 44 },
  xl: { ring: 140, emblem: 64 },
};

const MORPHING_SIZES: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', { box: string; icon: number }> = {
  xs: { box: 'w-6 h-6', icon: 10 },
  sm: { box: 'w-8 h-8', icon: 14 },
  md: { box: 'w-12 h-12', icon: 20 },
  lg: { box: 'w-16 h-16', icon: 28 },
  xl: { box: 'w-24 h-24', icon: 40 },
};

export const BrandSpinner: React.FC<BrandSpinnerProps> = ({
  variant = 'synaptic',
  size = 'md',
  speed,
  showEmblem,
  label,
  className = '',
}) => {
  // Read remote/local config overrides if not explicitly passed as props
  const configLoading = useAppConfigStore((state) => state.config?.loading) as {
    activeVariant?: BrandSpinnerVariant;
    speed?: 'normal' | 'snappy' | 'relaxed';
    showEmblem?: boolean;
  } | undefined;

  const effectiveVariant = variant || configLoading?.activeVariant || 'synaptic';
  const activeSpeed = speed || configLoading?.speed || 'normal';
  const duration = SPEED_DURATIONS[activeSpeed] || '1.5s';
  const morphDuration = MORPH_DURATIONS[activeSpeed] || '4s';

  // Variant 1: Inline Button / Chip Spinner (Single-Stroke Geometric Arc)
  if (effectiveVariant === 'inline') {
    const inlineSize = size === 'xs' ? 'w-3.5 h-3.5' : size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

    return (
      <svg
        className={`animate-spin inline-block shrink-0 ${inlineSize} ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Loading..."
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  }

  // Variant 2: Skeleton / Neural Pulse Loader
  if (effectiveVariant === 'skeleton') {
    return (
      <div
        className={`animate-pulse rounded-2xl bg-gradient-to-r from-slate-200 via-indigo-100 to-slate-200 dark:from-slate-800 dark:via-indigo-950/40 dark:to-slate-800 ${className}`}
      />
    );
  }

  // Variant 4: Morphing Synapse Spinner (Compact Google Play-Style Morphing Ring + Brain)
  // Designed for ultra-compact versatile placement (fits anywhere, w-8 h-8 / w-6 h-6 / etc)
  if (effectiveVariant === 'morphing' || effectiveVariant === 'classic') {
    const morphConfig = MORPHING_SIZES[size] || MORPHING_SIZES.md;
    const shouldShowEmblem = showEmblem !== undefined
      ? showEmblem
      : configLoading?.showEmblem !== undefined
      ? configLoading.showEmblem
      : size !== 'xs';

    return (
      <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
        <div className={`relative flex items-center justify-center ${morphConfig.box}`}>
          {/* Outer spinning gradient ring (Google Play Morphing Style) */}
          <svg
            className="w-full h-full text-indigo-600 dark:text-indigo-400 google-spinner-group"
            viewBox="0 0 140 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="synaptic-morph-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
                <stop offset="50%" stopColor="#EC4899" stopOpacity="0.8" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Background track (optional subtle ring) */}
            <circle
              cx="70"
              cy="70"
              r="60"
              stroke="currentColor"
              strokeWidth="4"
              strokeOpacity="0.1"
              strokeLinecap="round"
            />

            {/* Animated gradient morphing path */}
            <path
              d={MORPHING_SYNAPSE_PATHS.d}
              fill="none"
              stroke="url(#synaptic-morph-gradient)"
              strokeLinecap="round"
              className="google-spinner-circle"
            >
              <animate
                attributeName="d"
                dur={morphDuration}
                repeatCount="indefinite"
                values={MORPHING_SYNAPSE_PATHS.values}
                keyTimes="0;0.2;0.6;0.8;1"
              />
            </path>
          </svg>

          {/* Inner fixed Brain Logo */}
          {shouldShowEmblem && (
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
              <BrandLogo variant="glyph" size={morphConfig.icon} />
            </div>
          )}
        </div>

        {label && (
          <span className="mt-2 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            {label}
          </span>
        )}
      </div>
    );
  }

  // Variant 3: Synaptic Signature Brand Loader (Orbital Glowing Halo Ring)
  const dimensions = SYNAPTIC_SIZES[size] || SYNAPTIC_SIZES.md;
  const shouldShowEmblem = showEmblem !== undefined
    ? showEmblem
    : configLoading?.showEmblem !== undefined
    ? configLoading.showEmblem
    : size !== 'xs'; // Default to showing emblem unless tiny

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: dimensions.ring, height: dimensions.ring }}
      >
        {/* Glowing Orbital Halo Ring */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0%, transparent 30%, rgba(168, 85, 247, 0.5) 60%, rgba(79, 70, 229, 0.9) 80%, #4f46e5 100%)',
            WebkitMask: 'radial-gradient(circle, transparent 62%, black 64%)',
            mask: 'radial-gradient(circle, transparent 62%, black 64%)',
            animation: `brand-spin-halo ${duration} linear infinite`,
          }}
        />

        {/* Center Pulsing Emblem */}
        {shouldShowEmblem && (
          <div className="relative z-10 animate-pulse flex items-center justify-center">
            <BrandLogo variant="icon" size={dimensions.emblem} />
          </div>
        )}
      </div>

      {label && (
        <span className="mt-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          {label}
        </span>
      )}

      <style>{`
        @keyframes brand-spin-halo {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
