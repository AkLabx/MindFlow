import React from 'react';
import { Target, Clock, Timer, Flame, ArrowRight } from 'lucide-react';

interface SuggestedDrillCardProps {
  topicTitle: string;
  subtext: string;
  isDiagnostic?: boolean;
  onStartDrill: () => void;
}

export const SuggestedDrillCard: React.FC<SuggestedDrillCardProps> = ({
  topicTitle,
  subtext,
  isDiagnostic = false,
  onStartDrill,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none relative overflow-hidden flex flex-col justify-between h-full min-h-[168px]">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Target className="w-4 h-4" />
            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Suggested Drill</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
            {isDiagnostic ? 'Diagnostic' : 'Weak Area'}
          </span>
        </div>

        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1.5 line-clamp-1">
          {topicTitle}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
          {subtext}
        </p>

        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg shrink-0">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> 15 Qs
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg shrink-0">
            <Timer className="w-3.5 h-3.5 text-slate-500" /> 10 Mins
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-lg shrink-0">
            <Flame className="w-3.5 h-3.5" /> PYQ Focus
          </div>
        </div>
      </div>

      <button
        onClick={onStartDrill}
        className="w-full sm:w-auto mt-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
      >
        Start Drill <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
