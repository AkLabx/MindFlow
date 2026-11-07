import React from 'react';
import { motion } from 'framer-motion';

interface ScoreDonutProps {
  score: number;
  maxMarks: number;
  accuracy: number;
  size?: number;
  strokeWidth?: number;
}

export const ScoreDonut: React.FC<ScoreDonutProps> = ({
  score,
  maxMarks,
  accuracy,
  size = 170,
  strokeWidth = 14,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const scoreRatio = maxMarks > 0 ? Math.min(Math.max(score / maxMarks, 0), 1) : 0;
  const strokeDashoffset = circumference - scoreRatio * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        role="img"
        aria-label={`Score donut: ${score} out of ${maxMarks} marks, ${accuracy}% accuracy`}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-200 dark:stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>

      {/* Center Score & Accuracy Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white leading-none">
          {score}
        </span>
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
          / {maxMarks} Marks
        </span>
        <div className="mt-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
          {accuracy}% ACC
        </div>
      </div>
    </div>
  );
};
