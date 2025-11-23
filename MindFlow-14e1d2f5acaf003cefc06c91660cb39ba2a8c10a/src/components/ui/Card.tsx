import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  noPadding = false,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all",
        !noPadding && "p-4 md:p-6",
        onClick && "cursor-pointer hover:shadow-md hover:border-indigo-300",
        className
      )}
    >
      {children}
    </div>
  );
};