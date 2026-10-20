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
              className="flex flex-col items-center justify-center p-4 sm:p-5 min-h-[120px] sm:min-h-[140px] text-center rounded-2xl bg-white dark:bg-slate-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group w-full cursor-pointer active:scale-95"
            >
              <div className="flex flex-col items-center gap-1 sm:gap-2 mb-0 w-full justify-center">
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <div className={`p-3 rounded-full ${item.bgClass} dark:bg-slate-700/50 mb-1`}>
                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${item.textClass}`} />
                  </div>
                  <span className="font-semibold text-[13px] leading-tight sm:text-[15px] text-slate-700 dark:text-slate-300 transition-colors">
                    {item.title}
                  </span>
                </div>
              </div>
              <span className="block text-[11px] leading-snug sm:text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-1 w-full">
                {item.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
