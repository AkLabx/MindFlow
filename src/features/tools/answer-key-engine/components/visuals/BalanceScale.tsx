import React from 'react';
import { motion } from 'framer-motion';

interface BalanceScaleProps {
  candidateMarks: number;
  averageMarks: number;
  label?: string;
}

export const BalanceScale: React.FC<BalanceScaleProps> = ({
  candidateMarks,
  averageMarks,
  label = 'Overall Average',
}) => {
  const delta = candidateMarks - averageMarks;
  // Maximum tilt angle clamped to ±15 degrees
  const tiltAngle = Math.min(Math.max((delta / 30) * 12, -15), 15);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-card-dark/60 rounded-2xl border border-slate-200/80 dark:border-white/5">
      <div className="w-full flex justify-between text-xs font-semibold px-2 mb-2">
        <span className="text-indigo-600 dark:text-indigo-400">
          You: <span className="font-mono tabular-nums">{candidateMarks}</span>
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          {label}: <span className="font-mono tabular-nums">{averageMarks.toFixed(1)}</span>
        </span>
      </div>

      <svg
        viewBox="0 0 200 90"
        className="w-48 h-22 overflow-visible"
        role="img"
        aria-label={`Balance scale: Candidate ${candidateMarks} vs Average ${averageMarks}`}
      >
        {/* Base and Fulcrum */}
        <polygon points="100,35 90,75 110,75" className="fill-slate-400 dark:fill-slate-600" />
        <rect x="75" y="75" width="50" height="6" rx="2" className="fill-slate-500 dark:fill-slate-500" />
        <circle cx="100" cy="35" r="4" className="fill-indigo-600 dark:fill-indigo-400" />

        {/* Tilting Beam */}
        <motion.g
          animate={{ rotate: tiltAngle }}
          transition={{ type: 'spring', stiffness: 90, damping: 14 }}
          style={{ originX: '100px', originY: '35px' }}
        >
          {/* Main Bar */}
          <line
            x1="30"
            y1="35"
            x2="170"
            y2="35"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="stroke-slate-700 dark:stroke-slate-300"
          />

          {/* Left Pan (Candidate - heavy if score > avg -> tilts downward) */}
          <line x1="45" y1="35" x2="35" y2="55" strokeWidth="1.5" className="stroke-slate-400" />
          <line x1="45" y1="35" x2="55" y2="55" strokeWidth="1.5" className="stroke-slate-400" />
          <path
            d="M 28 55 Q 45 66 62 55 Z"
            className="fill-indigo-500/80 stroke-indigo-600 dark:stroke-indigo-400"
            strokeWidth="1.5"
          />

          {/* Right Pan (Average) */}
          <line x1="155" y1="35" x2="145" y2="55" strokeWidth="1.5" className="stroke-slate-400" />
          <line x1="155" y1="35" x2="165" y2="55" strokeWidth="1.5" className="stroke-slate-400" />
          <path
            d="M 138 55 Q 155 66 172 55 Z"
            className="fill-slate-300 dark:fill-slate-600 stroke-slate-400 dark:stroke-slate-500"
            strokeWidth="1.5"
          />
        </motion.g>
      </svg>

      <span
        className={`mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
          delta >= 0
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
        }`}
      >
        {delta >= 0 ? `+${delta.toFixed(2)} Above Average` : `${delta.toFixed(2)} Below Average`}
      </span>
    </div>
  );
};
