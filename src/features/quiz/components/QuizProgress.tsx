import React from 'react';

interface QuizProgressProps {
  current: number;
  total: number;
  progress: number;
}

export const QuizProgress: React.FC<QuizProgressProps> = ({ current, total, progress }) => {
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
        <span>Question {current} of {total}</span>
        <span>{Math.round(progress)}% Completed</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};