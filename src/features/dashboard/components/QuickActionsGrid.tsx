import React from 'react';
import { QUICK_ACTIONS } from '../constants/sscDashboardConfig';
import { Zap, SlidersHorizontal, BookMarked, Bookmark, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

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
    <Card className="flex flex-col gap-3 relative z-10 border border-black/10 dark:border-white/10 dark:bg-slate-900/90 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] p-4 rounded-2xl">
      <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-900 dark:text-white ">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {QUICK_ACTIONS.map((item) => {
          const Icon = IconMap[item.icon] || Zap;
          return (
            <button
              key={item.id}
              onClick={() => onActionClick(item.action)}
              className="flex flex-col items-start justify-between p-4 sm:p-5 min-h-[120px] sm:min-h-[140px] text-left rounded-2xl bg-white dark:bg-slate-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group w-full cursor-pointer active:scale-95 relative overflow-hidden"
            >
              <div className="flex items-start justify-between w-full">
                <div className={`p-3 rounded-xl ${item.bgClass} dark:bg-slate-700/50`}>
                  <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${item.textClass}`} />
                </div>
              </div>
              <div className="flex flex-col items-start mt-auto w-full pt-4 relative z-10">
                <span className="font-bold text-[13px] leading-tight sm:text-[15px] text-slate-800 dark:text-slate-200 transition-colors">
                  {item.title}
                </span>
                <div className="flex items-center justify-between w-full mt-1">
                  <span className="block text-[11px] leading-snug sm:text-[12px] text-slate-500 dark:text-slate-400 font-medium pr-2">
                    {item.subtitle}
                  </span>
                  <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${item.textClass} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
