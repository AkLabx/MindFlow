import React from 'react';
import { Brain } from 'lucide-react';

interface SynapticLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

const iconClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

export const SynapticLoader: React.FC<SynapticLoaderProps> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center min-h-[60vh] ${className}`}>
      {/* Outer spinning gradient ring */}
      <svg
        className={`animate-spin ${sizeClasses[size]} text-indigo-600 dark:text-indigo-400`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="synaptic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="50%" stopColor="#EC4899" stopOpacity="0.8" /> {/* Pink */}
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Background track (optional subtle ring) */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          strokeOpacity="0.1"
          strokeLinecap="round"
        />

        {/* Animated gradient ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#synaptic-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="283"
          strokeDashoffset="75"
        />
      </svg>

      {/* Inner fixed Brain Logo */}
      <div className="absolute inset-0 flex items-center justify-center animate-pulse">
        <Brain className={`${iconClasses[size]} text-indigo-600 dark:text-indigo-400`} />
      </div>
    </div>
  );
};
