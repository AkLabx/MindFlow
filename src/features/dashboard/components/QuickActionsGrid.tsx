import React from 'react';
import { QUICK_ACTIONS } from '../constants/sscDashboardConfig';
import { Zap, SlidersHorizontal, BookMarked, Bookmark, ChevronRight } from 'lucide-react';

interface QuickActionsGridProps {
  onActionClick: (action: string) => void;
}

const IconMap: Record<string, React.ElementType> = {
  Zap,
  SlidersHorizontal,
  BookMarked,
  Bookmark,
};

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ onActionClick }) => {
  return (
    <div className="flex flex-col gap-3 relative z-10">
      <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-900 dark:text-white px-1">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
        {QUICK_ACTIONS.map((item) => {
          const Icon = IconMap[item.icon] || Zap;
          return (
            <button
              key={item.id}
              onClick={() => onActionClick(item.action)}
              className="bg-white dark:bg-slate-900/90 rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-none hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all duration-200 flex items-center sm:flex-col sm:items-start gap-3 text-left group cursor-pointer active:scale-95"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bgClass} ${item.textClass} group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight truncate">
                  {item.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {item.subtitle}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all sm:hidden" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
