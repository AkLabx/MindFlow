
import React from 'react';
import { Star, Bookmark, Calendar, Clock } from 'lucide-react';
import { Question } from '../types';
import { cn } from '../../../utils/cn';

export function QuizQuestionHeader({ 
    question, 
    currentIndex, 
    total, 
    isBookmarked, 
    onToggleBookmark,
    elapsedTime
}: { 
    question: Question, 
    currentIndex: number, 
    total: number, 
    isBookmarked: boolean, 
    onToggleBookmark: () => void,
    elapsedTime?: number
}) {
  // Helper to format stopwatch
  const formatStopwatch = (seconds: number = 0) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
      
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md">
          Q.{currentIndex + 1} <span className="text-indigo-400 font-normal">/ {total}</span>
        </span>

        {elapsedTime !== undefined && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-100">
                <Clock className="w-3 h-3" />
                {formatStopwatch(elapsedTime)}
            </span>
        )}
        
        <button 
            onClick={onToggleBookmark}
            className={cn(
                "p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium",
                isBookmarked 
                    ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" 
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            )}
        >
            <Star className={cn("w-4 h-4", isBookmarked ? "fill-current" : "")} />
            <span className="hidden xs:inline">{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
        </button>

        <span className="text-xs text-gray-300 font-mono hidden sm:inline-block">ID: {question.id}</span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs items-center">
        {question.sourceInfo?.examName && (
             <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-bold border border-gray-200">
               {question.sourceInfo.examName} <span className="font-normal text-gray-500">{question.sourceInfo.examYear}</span>
             </span>
        )}
        {question.sourceInfo?.examDateShift && (
             <span className="px-2 py-1 rounded-md bg-white text-gray-500 font-medium border border-gray-200 flex items-center gap-1.5 shadow-sm">
               <Calendar className="w-3 h-3 text-gray-400" />
               {question.sourceInfo.examDateShift}
             </span>
        )}
      </div>
    </div>
  );
}
