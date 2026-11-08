import React from 'react';
import { ChevronRight, Play, Flame } from 'lucide-react';
import { IMPORTANT_FOR_SSC, ImportantForSscConfig } from '../constants/sscDashboardConfig';
import { useExamContextStore } from '@/stores/useExamContextStore';
import { CANONICAL_EXAMS } from '../constants/examRegistry';

export interface ImportantForSscStripProps {
  onTopicClick: (item: ImportantForSscConfig, filters: any) => void;
  onViewAllClick: () => void;
}

export const ImportantForSscStrip: React.FC<ImportantForSscStripProps> = ({ onTopicClick, onViewAllClick }) => {
  const activeExamId = useExamContextStore((s) => s.activeExamId);
  const activeExam = CANONICAL_EXAMS.find((e) => e.id === activeExamId);
  const sectionTitle = activeExam ? `Important for ${activeExam.displayName}` : 'Important for SSC';

  return (
    <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none p-3.5 sm:p-4.5 flex flex-col gap-3 relative z-10 mb-2">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 fill-rose-500" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{sectionTitle}</h2>
        </div>
        <button
          onClick={onViewAllClick}
          className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline cursor-pointer"
        >
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-6">
        {IMPORTANT_FOR_SSC.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              const examFilter = activeExam ? { examName: activeExam.dbExamNames } : {};
              onTopicClick(item, { ...item.filter, ...examFilter });
            }}
            className={`group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900 border ${item.borderClass} hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-sm transition-all cursor-pointer min-w-[210px] sm:min-w-0 snap-start active:scale-[0.98] overflow-hidden`}
          >
            <div
              className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.gradient} pointer-events-none opacity-80`}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.subjectBg}`}>
                  {item.subjectLabel}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.qs}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-2 leading-snug">
                {item.title}
              </h3>
            </div>

            <div className="relative z-10 flex items-center justify-between mt-3 pt-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {item.tag}
              </span>
              <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/60 shadow-xs group-hover:bg-indigo-600 group-hover:text-white group-hover:border-transparent transition-colors flex items-center justify-center">
                <Play className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
