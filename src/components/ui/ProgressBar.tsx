import React from 'react';
import { cn } from '../../utils/cn';

type ProgressVariant = 'primary' | 'success' | 'warning' | 'danger';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  variant?: ProgressVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const variantColors: Record<ProgressVariant, string> = {
  primary: "bg-indigo-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

const sizes = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  className,
  showLabel = false
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-gray-100 rounded-full overflow-hidden", sizes[size])}>
        <div 
          className={cn("h-full rounded-full transition-all duration-500 ease-out", variantColors[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};