import React from 'react';
import { ArrowLeft, RotateCw, BookOpen, BookA } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import {
  useTodaysPlan,
  TodaysPlanHeroCard,
  MistakeVaultCard,
  SpacedRetentionCard,
  ChaptersOf25List,
  VocabBoosterCard,
  TodaysPlanSkeleton
} from '@/features/todays-plan';

export const TodaysPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    planState,
    isLoading,
    isLaunching,
    activeTrack,
    setActiveTrack,
    startPlanSession,
    startChapterSession,
    refreshPlan
  } = useTodaysPlan();

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 absolute left-1/2 -translate-x-1/2">
          Today's Plan
        </h1>

        <button
          onClick={() => refreshPlan()}
          disabled={isLoading || isLaunching}
          className="p-2 -mr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
          aria-label="Refresh Plan"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 space-y-6">
        {/* Dual-Track Tabs (GK vs Vocab) */}
        <div className="flex p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl max-w-sm mx-auto shadow-inner">
          <button
            onClick={() => setActiveTrack('gk')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTrack === 'gk'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>GK Revision Plan</span>
          </button>

          <button
            onClick={() => setActiveTrack('vocab')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTrack === 'vocab'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookA className="w-4 h-4" />
            <span>Vocab Booster</span>
          </button>
        </div>

        {/* Content Body */}
        {isLoading && !planState ? (
          <TodaysPlanSkeleton />
        ) : planState ? (
          <>
            {activeTrack === 'gk' ? (
              <>
                {/* 1. Hero Card (1-Click Launch 5-min drill) */}
                <TodaysPlanHeroCard
                  planState={planState}
                  onStart={startPlanSession}
                  isLaunching={isLaunching}
                />

                {/* 2. Breakout Cards: Mistake Vault & Spaced Retention */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MistakeVaultCard
                    mistakeItems={planState.items.filter(i => i.category === 'mistake')}
                    onStartDrill={startPlanSession}
                    isLaunching={isLaunching}
                  />

                  <SpacedRetentionCard
                    spacedItems={planState.items.filter(i => i.category === 'spaced_repetition')}
                    onStartDrill={startPlanSession}
                    isLaunching={isLaunching}
                  />
                </div>

                {/* 3. Chapters of 25 (Sequential Syllabus Progression) */}
                <ChaptersOf25List
                  chapters={planState.chapters}
                  onStartChapter={startChapterSession}
                  isLaunching={isLaunching}
                />
              </>
            ) : (
              /* English Vocab Booster Track */
              <VocabBoosterCard vocabItems={planState.vocabItems} />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
