import React from 'react';
import { ChevronRight, Play, Flame } from 'lucide-react';
import { IMPORTANT_FOR_SSC } from '../constants/sscDashboardConfig';
import { Card } from '@/components/ui/Card';

interface ImportantForSscStripProps {
  onTopicClick: (filters: any) => void;
  onViewAllClick: () => void;
}

export const ImportantForSscStrip: React.FC<ImportantForSscStripProps> = ({ onTopicClick, onViewAllClick }) => {
  return (
    <Card className="flex flex-col gap-3 relative z-10 pb-4 border border-black/10 dark:border-white/10 dark:bg-slate-900/90 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] p-4 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame className="w-5 h-5 text-rose-500 fill-rose-500" />
          <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-900 dark:text-white">Important for SSC</h2>
        </div>
        <button
          onClick={onViewAllClick}
          className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline"
        >
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-4">
        {IMPORTANT_FOR_SSC.map((item) => (
          <div
            key={item.id}
            onClick={() => onTopicClick(item.filter)}
            className="bg-white dark:bg-slate-900/90 rounded-2xl p-3.5 sm:p-4 border border-black/10 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-none hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer min-w-[240px] sm:min-w-0 snap-start active:scale-[0.98] group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${item.subjectBg}`}>
                  {item.subjectLabel}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {item.qs}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-2 line-clamp-2 leading-snug">
                {item.title}
              </h3>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {item.tag}
              </span>
              <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center">
                <Play className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
