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
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} text-indigo-600 dark:text-indigo-400`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {/* Inner fixed Brain Logo */}
      <div className="absolute inset-0 flex items-center justify-center animate-pulse">
        <Brain className={`${iconClasses[size]} text-indigo-600 dark:text-indigo-400`} />
      </div>
    </div>
  );
};
