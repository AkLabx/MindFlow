import React from 'react';

export const TodaysPlanSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        </div>
        <div className="h-14 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
      </div>

      {/* Breakout Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6" />
        <div className="h-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6" />
      </div>

      {/* Chapters Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4" />
        <div className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
        <div className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
      </div>
    </div>
  );
};
