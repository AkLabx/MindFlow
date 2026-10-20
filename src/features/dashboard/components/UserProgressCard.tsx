import React from 'react';
import { BarChart3 } from 'lucide-react';

interface UserProgressCardProps {
  averageScore: number;
  quizzesCompleted: number;
  correctAnswers: number;
  totalTimeSpentFormatted: string;
  onDetailsClick: () => void;
}

export const UserProgressCard: React.FC<UserProgressCardProps> = ({
  averageScore,
  quizzesCompleted,
  correctAnswers,
  totalTimeSpentFormatted,
  onDetailsClick,
}) => {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (averageScore / 100) * circumference;
  const isHighAccuracy = averageScore >= 75;

  return (
    <div
      onClick={onDetailsClick}
      className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-black/10 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-none flex flex-col justify-between cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 transition-all h-full min-h-[168px] active:scale-[0.98]"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white">Your Progress</h3>
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
          Details <BarChart3 className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="flex items-center gap-4 mt-auto">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ease-out ${
                isHighAccuracy ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-500'
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-none">
              {averageScore}%
            </span>
            <span className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase mt-0.5">
              Accuracy
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          <div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-none">
              {correctAnswers > 0 ? correctAnswers : quizzesCompleted}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {correctAnswers > 0 ? 'Correct Answers' : 'Quizzes Completed'}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                {totalTimeSpentFormatted}
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full w-[45%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
