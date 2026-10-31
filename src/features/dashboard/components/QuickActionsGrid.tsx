import React from 'react';
import { QUICK_ACTIONS } from '../constants/sscDashboardConfig';
import { Zap, SlidersHorizontal, BookMarked, Bookmark, Target, ChevronRight } from 'lucide-react';

interface QuickActionsGridProps {
  onActionClick: (action: string) => void;
}

const IconMap: Record<string, React.ElementType> = {
  Zap,
  SlidersHorizontal,
  BookMarked,
  Bookmark,
  Target,
};

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ onActionClick }) => {
  return (
    <section className="flex flex-col gap-2.5 relative z-10">
      <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white px-0.5">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {QUICK_ACTIONS.map((item) => {
          const Icon = IconMap[item.icon] || Zap;
          return (
            <button
              key={item.id}
              onClick={() => onActionClick(item.action)}
              className="flex flex-col items-start justify-between p-3.5 sm:p-5 min-h-[110px] sm:min-h-[135px] text-left rounded-2xl bg-white dark:bg-slate-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group w-full cursor-pointer active:scale-95 relative overflow-hidden"
            >
              <div className="flex items-start justify-between w-full">
                <div className={`p-2 sm:p-2.5 rounded-xl ${item.bgClass} dark:bg-slate-700/50`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.textClass}`} />
                </div>
              </div>
              <div className="flex flex-col items-start mt-auto w-full pt-2.5 relative z-10">
                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 transition-colors">
                  {item.title}
                </span>
                <div className="flex items-center justify-between w-full mt-0.5 sm:mt-1">
                  <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium pr-2">
                    {item.subtitle}
                  </span>
                  <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${item.textClass} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
