import React from 'react';
import { ChevronRight, Play, Flame } from 'lucide-react';
import { IMPORTANT_FOR_SSC } from '../constants/sscDashboardConfig';

interface ImportantForSscStripProps {
  onTopicClick: (filters: any) => void;
  onViewAllClick: () => void;
}

export const ImportantForSscStrip: React.FC<ImportantForSscStripProps> = ({ onTopicClick, onViewAllClick }) => {
  return (
    <section className="flex flex-col gap-2.5 relative z-10 pb-2">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 fill-rose-500" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Important for SSC</h2>
        </div>
        <button
          onClick={onViewAllClick}
          className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline cursor-pointer"
        >
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-6">
        {IMPORTANT_FOR_SSC.map((item) => (
          <div
            key={item.id}
            onClick={() => onTopicClick(item.filter)}
            className="bg-white dark:bg-slate-800/80 rounded-2xl p-3.5 sm:p-4 border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer min-w-[220px] sm:min-w-0 snap-start active:scale-[0.98] group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${item.subjectBg}`}>
                  {item.subjectLabel}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {item.qs}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-2 leading-snug">
                {item.title}
              </h3>
            </div>

            <div className="flex items-center justify-between mt-3 pt-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {item.tag}
              </span>
              <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center">
                <Play className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
