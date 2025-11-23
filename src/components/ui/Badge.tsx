import React from 'react';
import { cn } from '../../utils/cn';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-indigo-100 text-indigo-700 border-transparent",
  success: "bg-emerald-100 text-emerald-700 border-transparent",
  warning: "bg-amber-100 text-amber-700 border-transparent",
  danger: "bg-rose-100 text-rose-700 border-transparent",
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
  outline: "bg-transparent text-gray-600 border-gray-200",
};

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'neutral', 
  className,
  icon
}) => {
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition-colors",
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};