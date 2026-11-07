import React from 'react';
import { motion } from 'framer-motion';
import { BRAND_SIZES, BrandSizeKey, SMOOTH_BRAIN_PATHS, CIRCUIT_BRAIN_PATHS } from './brandTokens';

export interface BrandLogoProps {
  variant?: 'icon' | 'wordmark' | 'animated';
  size?: BrandSizeKey | number;
  showSquircle?: boolean;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  animated?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'icon',
  size = 'md',
  showSquircle = true,
  className = '',
  theme = 'auto',
  animated = false,
}) => {
  const pixelSize = typeof size === 'number' ? size : BRAND_SIZES[size] || BRAND_SIZES.md;

  // Render the canonical smooth brain emblem
  const renderSmoothBrainGlyph = (iconSize: number, iconClass = 'text-white') => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      style={{ width: iconSize, height: iconSize }}
      aria-label="MindFlow Emblem"
    >
      <path d={SMOOTH_BRAIN_PATHS.leftLobe} />
      <path d={SMOOTH_BRAIN_PATHS.rightLobe} />
    </svg>
  );

  // Variant 1: Animated Circuit Brain (for hero and welcome moments)
  if (variant === 'animated') {
    const pathVariants = {
      hidden: { pathLength: 0, opacity: 0 },
      visible: (i: number) => ({
        pathLength: 1,
        opacity: 1,
        transition: {
          pathLength: { delay: i * 0.15, type: 'spring' as const, duration: 2, bounce: 0 },
          opacity: { delay: i * 0.15, duration: 0.1 }
        }
      })
    };

    const circleVariants = {
      hidden: { scale: 0, opacity: 0 },
      visible: (i: number) => ({
        scale: 1,
        opacity: 1,
        transition: {
          delay: 1.8 + i * 0.2,
          type: 'spring' as const,
          stiffness: 300,
          damping: 15
        }
      })
    };

    return (
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        style={{ width: pixelSize, height: pixelSize }}
        className={`inline-block ${className}`}
        initial="hidden"
        animate="visible"
      >
        <g
          transform="translate(106, 106) scale(0.6)"
          fill="none"
          stroke="currentColor"
          strokeWidth="40"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-indigo-600 dark:text-indigo-400"
        >
          {CIRCUIT_BRAIN_PATHS.left.map((d, i) => (
            <motion.path key={`left-${i}`} custom={i + 1} variants={pathVariants} d={d} />
          ))}
          {CIRCUIT_BRAIN_PATHS.right.map((d, i) => (
            <motion.path key={`right-${i}`} custom={i + 1} variants={pathVariants} d={d} />
          ))}
          {CIRCUIT_BRAIN_PATHS.synapses.map((syn, i) => (
            <motion.circle
              key={`syn-${i}`}
              custom={i + 1}
              variants={circleVariants}
              cx={syn.cx}
              cy={syn.cy}
              r={syn.r}
              fill="currentColor"
              stroke="none"
            />
          ))}
          {CIRCUIT_BRAIN_PATHS.sparks.map((spk, i) => (
            <motion.path key={`spark-${i}`} custom={i + 5} variants={pathVariants} d={spk} strokeWidth="30" />
          ))}
        </g>
      </motion.svg>
    );
  }

  // Variant 2: Wordmark (Emblem + Typography Lockup)
  if (variant === 'wordmark') {
    const iconDimension = Math.max(24, Math.round(pixelSize * 0.7));
    const squircleDimension = pixelSize;

    return (
      <div className={`inline-flex items-center gap-3 select-none ${className}`}>
        <div
          className="relative flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/25"
          style={{ width: squircleDimension, height: squircleDimension }}
        >
          {renderSmoothBrainGlyph(iconDimension, 'text-white')}
        </div>
        <div className="flex flex-col leading-none">
          <span
            className={`font-black tracking-tight ${
              theme === 'dark'
                ? 'text-white'
                : theme === 'light'
                ? 'text-slate-900'
                : 'text-slate-900 dark:text-white'
            }`}
            style={{ fontSize: `${Math.max(18, Math.round(pixelSize * 0.55))}px` }}
          >
            Mind<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Flow</span>
          </span>
        </div>
      </div>
    );
  }

  // Variant 3: Standalone Emblem Icon
  if (!showSquircle) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        {renderSmoothBrainGlyph(pixelSize, 'text-indigo-600 dark:text-indigo-400')}
      </div>
    );
  }

  // Squircle icon container
  const iconDimension = Math.round(pixelSize * 0.55);
  const cornerRadius = Math.max(6, Math.round(pixelSize * 0.3));

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/25 ${
        animated ? 'transition-transform hover:scale-105 active:scale-95' : ''
      } ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        borderRadius: `${cornerRadius}px`,
      }}
    >
      {renderSmoothBrainGlyph(iconDimension, 'text-white')}
    </div>
  );
};
