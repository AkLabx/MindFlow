import React from 'react';
import { Clock, ArrowRight, Loader2, Sparkles, AlertCircle, RefreshCw, Bookmark } from 'lucide-react';
import { TodaysPlanState } from '../types';

interface TodaysPlanHeroCardProps {
  planState: TodaysPlanState;
  onStart: () => void;
  isLaunching: boolean;
}

export const TodaysPlanHeroCard: React.FC<TodaysPlanHeroCardProps> = ({
  planState,
  onStart,
  isLaunching
}) => {
  const { title, subtitle, estimatedMinutes, stats, tier } = planState;

  const getTierBadge = () => {
    switch (tier) {
      case 'new_user':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5" />
            Diagnostic Baseline
          </span>
        );
      case 'error_prone':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3.5 h-3.5" />
            Mistake Redemption Active
          </span>
        );
      case 'advanced_retention':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
            <RefreshCw className="w-3.5 h-3.5" />
            Spaced Retention Radar
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            Daily High-Yield Mix
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />

      {/* Top row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {getTierBadge()}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>{estimatedMinutes} Min Quick Drill</span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="space-y-1 mb-6 text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
        <div className="p-3 sm:p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pending</span> Mistakes
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.mistakesToRedeem}
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-violet-600 dark:text-violet-400 text-xs font-semibold mb-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Memory</span> Refresh
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.spacedRepetitionDue}
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-1">
            <Bookmark className="w-3.5 h-3.5" />
            Bookmarks
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.bookmarkedCount}
          </div>
        </div>
      </div>

      {/* Prominent Launch Button */}
      <button
        onClick={onStart}
        disabled={isLaunching || stats.totalQuestions === 0}
        className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group text-base sm:text-lg"
      >
        {isLaunching ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Assembling Session...</span>
          </>
        ) : (
          <>
            <span>Start Today's 5-Min Plan ({stats.totalQuestions} Questions)</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
};
