import React from 'react';

interface QuizLibrarySkeletonProps {
  count?: number;
  viewMode?: 'list' | 'grid';
}

export const QuizLibrarySkeleton: React.FC<QuizLibrarySkeletonProps> = ({
  count = 3,
  viewMode = 'list'
}) => {
  return (
    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative p-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-sm animate-pulse flex flex-col gap-3.5"
        >
          {/* Header Row: Title & Action pill */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-slate-200/80 dark:bg-slate-700/80" />
              <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
                <div className="h-4 w-3/4 rounded-md bg-slate-200/80 dark:bg-slate-700/80" />
                <div className="h-3 w-1/2 rounded-md bg-slate-200/60 dark:bg-slate-700/60" />
              </div>
            </div>
            <div className="h-9 w-24 rounded-xl bg-slate-200/80 dark:bg-slate-700/80" />
          </div>

          {/* Tags / Meta Row */}
          <div className="flex items-center gap-2 pt-1">
            <div className="h-5 w-16 rounded-lg bg-slate-200/70 dark:bg-slate-700/70" />
            <div className="h-5 w-20 rounded-lg bg-slate-200/70 dark:bg-slate-700/70" />
            <div className="h-5 w-24 rounded-lg bg-slate-200/70 dark:bg-slate-700/70" />
          </div>

          {/* Progress bar line */}
          <div className="h-1.5 w-full rounded-full bg-slate-200/50 dark:bg-slate-700/50 mt-1" />
        </div>
      ))}
    </div>
  );
};
