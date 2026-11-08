import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Clock,
  Flame,
  RotateCcw,
  BookOpen,
  Target,
  Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVulnerabilityEngine, TopicVulnerability } from '../hooks/useVulnerabilityEngine';
import { ROUTES } from '@/config/routes';

export interface AIPrescriptionCardProps {
  onStartDrill?: (vulnerability: TopicVulnerability) => void;
}

export const AIPrescriptionCard: React.FC<AIPrescriptionCardProps> = ({ onStartDrill }) => {
  const navigate = useNavigate();
  const {
    isLoading,
    activeExam,
    primaryVulnerability,
    hasMistakeData,
    totalMistakesForExam,
    launchTargetedDrill,
  } = useVulnerabilityEngine();

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-indigo-100 dark:border-indigo-950/80 shadow-xs animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-40 bg-indigo-100 dark:bg-indigo-900/40 rounded-full" />
          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md mb-2" />
        <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded-md mb-4" />
        <div className="h-10 w-full bg-indigo-200/50 dark:bg-indigo-900/40 rounded-xl" />
      </div>
    );
  }

  if (!primaryVulnerability) {
    return null;
  }

  const isDiagnostic = primaryVulnerability.isDiagnostic;

  const handleDrillAction = () => {
    if (onStartDrill && primaryVulnerability) {
      onStartDrill(primaryVulnerability);
    } else {
      launchTargetedDrill(primaryVulnerability);
    }
  };

  return (
    <div className="group relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-indigo-200/80 dark:border-indigo-800/60 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.08)] dark:shadow-none overflow-hidden transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-700">
      {/* Background ambient gradient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none opacity-80" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                {activeExam.shortCode} AI Study Coach
              </span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Personalized Remedial Intelligence
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs ${
            isDiagnostic
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          {isDiagnostic ? 'Diagnostic' : 'Weak Area'}
        </span>
      </div>

      {/* Main prescription body */}
      <div className="relative z-10 mt-3">
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-1">
          {primaryVulnerability.headline}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
          {primaryVulnerability.subtext}
        </p>

        {/* Feature badge chips */}
        <div className="flex items-center gap-2 mt-3.5 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 px-2.5 py-1 rounded-lg shrink-0">
            <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{primaryVulnerability.suggestedQuestionCount} Questions</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 px-2.5 py-1 rounded-lg shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Learning Mode</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 px-2.5 py-1 rounded-lg shrink-0">
            <Flame className="w-3.5 h-3.5" />
            <span>PYQ Focus</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="relative z-10 mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <button
          onClick={handleDrillAction}
          className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          aria-label={isDiagnostic ? 'Start Diagnostic Drill' : 'Start Targeted Drill'}
        >
          <span>{isDiagnostic ? 'Start Diagnostic Drill' : 'Start Targeted Drill'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {hasMistakeData && (
          <button
            onClick={() =>
              navigate(ROUTES.MISTAKE_NOTEBOOK, {
                state: { returnTo: '/dashboard', from: '/dashboard' },
              })
            }
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 transition-colors flex items-center justify-center gap-1.5"
            aria-label="View Mistakes Notebook"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Review Mistakes ({totalMistakesForExam})</span>
          </button>
        )}
      </div>
    </div>
  );
};
