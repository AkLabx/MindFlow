import React from 'react';
import { Star, Calendar, Clock, Hash } from 'lucide-react';
import { Question } from '../types';
import { cn } from '../../../utils/cn';
import { Badge } from '../../../components/ui/Badge';

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
      
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="primary" className="text-sm">
          Question {currentIndex + 1} <span className="text-indigo-400 font-normal ml-1">/ {total}</span>
        </Badge>

        {elapsedTime !== undefined && (
            <Badge variant="neutral" icon={<Clock className="w-3 h-3" />}>
                {formatStopwatch(elapsedTime)}
            </Badge>
        )}
        
        <button 
            onClick={onToggleBookmark}
            className={cn(
                "p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium border",
                isBookmarked 
                    ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" 
                    : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-gray-600"
            )}
        >
            <Star className={cn("w-3.5 h-3.5", isBookmarked ? "fill-current" : "")} />
            <span className="hidden xs:inline">{isBookmarked ? "Saved" : "Save"}</span>
        </button>

        <span className="text-xs text-gray-300 font-mono hidden sm:flex items-center gap-1">
            <Hash className="w-3 h-3" /> {question.id}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs items-center justify-end">
        {question.sourceInfo?.examName && (
             <Badge variant="neutral" className="font-normal bg-gray-50">
               {question.sourceInfo.examName} <span className="text-gray-400 mx-1">|</span> {question.sourceInfo.examYear}
             </Badge>
        )}
        {question.sourceInfo?.examDateShift && (
             <Badge variant="outline" icon={<Calendar className="w-3 h-3 text-gray-400" />} className="font-normal border-dashed">
               {question.sourceInfo.examDateShift}
             </Badge>
        )}
      </div>
    </div>
  );
}