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

  const goalQuizzes = 3;
  const progressPct = quizzesCompleted === 0 ? 0 : Math.min(100, Math.round((quizzesCompleted / goalQuizzes) * 100));

  return (
    <div
      onClick={onDetailsClick}
      className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col justify-between cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 transition-all h-full min-h-[168px] active:scale-[0.98]"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Your Progress</h3>
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline">
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Accuracy
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 flex-1">
          <div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-none">
              {correctAnswers > 0 ? `${correctAnswers} Qs` : `${quizzesCompleted} Quizzes`}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {correctAnswers > 0 ? 'Correct Answers' : 'Quizzes Completed'}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Goal ({quizzesCompleted}/{goalQuizzes})</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{totalTimeSpentFormatted}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(progressPct, 4)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
