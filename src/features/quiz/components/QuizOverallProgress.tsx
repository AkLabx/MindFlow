import React from 'react';

export function QuizOverallProgress({ current, total }: { current: number, total: number }) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
      <div 
        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}