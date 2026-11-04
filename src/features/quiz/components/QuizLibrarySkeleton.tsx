import React from 'react';

interface QuizLibrarySkeletonProps {
  count?: number;
  viewMode?: 'list' | 'grid';
  showToolbar?: boolean;
}

const ShimmerItem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-gradient-to-r from-slate-200/90 via-slate-100/90 to-slate-200/90 dark:from-slate-800 dark:via-slate-700/60 dark:to-slate-800 bg-[length:200%_100%] animate-shimmer ${className}`}
  />
);

export const QuizLibrarySkeleton: React.FC<QuizLibrarySkeletonProps> = ({
  count,
  viewMode = 'list',
  showToolbar = true
}) => {
  const effectiveCount = count ?? (viewMode === 'grid' ? 6 : 3);

  return (
    <div className="w-full h-full animate-fade-in pb-8">
      <div className="flex flex-col gap-6">
        {/* Toolbar Skeleton */}
        {showToolbar && (
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 p-2 sm:p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100/50 dark:border-slate-700/50 backdrop-blur-sm z-20 shadow-sm mb-4">
            <div className="flex items-center gap-2">
              <ShimmerItem className="h-4 w-16 rounded-md" />
              <ShimmerItem className="h-6 w-8 rounded-lg" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ShimmerItem className="h-8 w-28 rounded-lg" />
              <div className="hidden sm:flex items-center p-1 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-indigo-100/50 dark:border-indigo-900/50 gap-1">
                <ShimmerItem className="w-7 h-7 rounded-md" />
                <ShimmerItem className="w-7 h-7 rounded-md" />
              </div>
            </div>
          </div>
        )}

        {/* Cards Grid Skeleton */}
        <div className={`w-full grid gap-4 sm:gap-6 z-20 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {Array.from({ length: effectiveCount }).map((_, i) => (
            <div
              key={i}
              className="relative p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col justify-between gap-4 overflow-hidden"
            >
              {/* Top Row: Icon + Title + Action Pill */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <ShimmerItem className="w-11 h-11 rounded-2xl shrink-0" />
                  <div className="flex flex-col gap-2 flex-1 max-w-sm">
                    <ShimmerItem className="h-5 w-3/4 rounded-lg" />
                    <ShimmerItem className="h-3.5 w-1/3 rounded-md" />
                  </div>
                </div>
                <ShimmerItem className="h-9 w-24 sm:w-28 rounded-xl shrink-0" />
              </div>

              {/* Tags / Meta Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <ShimmerItem className="h-6 w-20 rounded-lg" />
                <ShimmerItem className="h-6 w-24 rounded-lg" />
                <ShimmerItem className="h-6 w-16 rounded-lg" />
              </div>

              {/* Bottom Row: Progress / Score bar line */}
              <div className="pt-2">
                <ShimmerItem className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
