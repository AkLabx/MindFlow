import React from 'react';
import { cn } from '../../../../utils/cn';

interface DonutChartProps {
  correct: number;
  incorrect: number;
  unanswered: number;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ 
  correct, 
  incorrect, 
  unanswered, 
  size = 160 
}) => {
  const total = correct + incorrect + unanswered;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) return null;

  const correctPct = correct / total;
  const incorrectPct = incorrect / total;
  // The remaining percent is unanswered

  const correctStroke = correctPct * circumference;
  const incorrectStroke = incorrectPct * circumference;
  
  // Offsets for rotation
  const correctOffset = circumference * 0.25; // Start at top
  const incorrectOffset = correctOffset - correctStroke;
  const unansweredOffset = incorrectOffset - incorrectStroke;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle (Unanswered/Base) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#e5e7eb" // gray-200
          strokeWidth={strokeWidth}
        />
        
        {/* Incorrect Segment */}
        {incorrect > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#ef4444" // red-500
            strokeWidth={strokeWidth}
            strokeDasharray={`${incorrectStroke} ${circumference}`}
            strokeDashoffset={-correctStroke}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}

        {/* Correct Segment */}
        {correct > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#22c55e" // green-500
            strokeWidth={strokeWidth}
            strokeDasharray={`${correctStroke} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}
      </svg>
      
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-gray-900">
          {Math.round((correct / total) * 100)}%
        </span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Accuracy</span>
      </div>
    </div>
  );
};