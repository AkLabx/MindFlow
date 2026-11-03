import React from 'react';
import { 
  Flame, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles,
  BarChart3
} from 'lucide-react';
import { MasterySummary } from '../types';
import { ActiveTierFilter } from '../types';
import { cn } from '../../../utils/cn';

interface CognitiveSummaryDeckProps {
  summary: MasterySummary;
  activeFilter: ActiveTierFilter;
  onFilterChange: (tier: ActiveTierFilter) => void;
}

export const CognitiveSummaryDeck: React.FC<CognitiveSummaryDeckProps> = ({
  summary,
  activeFilter,
  onFilterChange
}) => {
  const mvi = summary.overallVulnerabilityScore || 0;

  const getMviColor = (score: number) => {
    if (score >= 65) return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500', label: 'High Vulnerability Risk' };
    if (score >= 35) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500', label: 'Moderate Error Load' };
    return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', label: 'Optimal Retention' };
  };

  const mviStatus = getMviColor(mvi);
  const totalMistakes = summary.criticalCount + summary.repeatedCount + summary.slipsCount;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
      {/* Top Banner: Memory Vulnerability Score & Diagnostic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Cognitive Mastery Engine
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                Panacea CMME
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Spaced Vulnerability & Guess Verification Tracker across all subjects
            </p>
          </div>
        </div>

        {/* MVI Metric Gauge */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Memory Vulnerability (MVI)
            </div>
            <div className={cn("text-xs font-bold flex items-center justify-end gap-1.5", mviStatus.text)}>
              <span className={cn("w-2 h-2 rounded-full", mviStatus.bg)} />
              <span>{mviStatus.label}</span>
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {mvi}<span className="text-sm font-semibold text-slate-400">/100</span>
          </div>
        </div>
      </div>

      {/* Tier Filter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-5">
        {/* 1. All Mistakes Combined */}
        <button
          onClick={() => onFilterChange('all_mistakes')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between",
            activeFilter === 'all_mistakes'
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm"
              : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold">All Mistakes</span>
            <BarChart3 className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-2xl font-black">{totalMistakes}</div>
          <span className="text-[10px] opacity-70 mt-1">Pending Revision</span>
        </button>

        {/* 2. Critical Blindspots (3+ fails) */}
        <button
          onClick={() => onFilterChange('critical')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between",
            activeFilter === 'critical'
              ? "bg-rose-600 text-white border-transparent shadow-sm"
              : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 hover:bg-rose-100/70 dark:hover:bg-rose-950/40"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold">Critical Traps</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black">{summary.criticalCount}</div>
          <span className="text-[10px] opacity-80 mt-1">Failed ≥ 3 times</span>
        </button>

        {/* 3. Repeated Errors (2 fails) */}
        <button
          onClick={() => onFilterChange('repeated')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between",
            activeFilter === 'repeated'
              ? "bg-amber-600 text-white border-transparent shadow-sm"
              : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-amber-950/40"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold">Repeated</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black">{summary.repeatedCount}</div>
          <span className="text-[10px] opacity-80 mt-1">Failed 2 times</span>
        </button>

        {/* 4. Fresh Slips (1 fail) */}
        <button
          onClick={() => onFilterChange('slips')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between",
            activeFilter === 'slips'
              ? "bg-yellow-600 text-white border-transparent shadow-sm"
              : "bg-yellow-50/60 dark:bg-yellow-950/20 border-yellow-200/70 dark:border-yellow-900/40 text-yellow-900 dark:text-yellow-200 hover:bg-yellow-100/70 dark:hover:bg-yellow-950/40"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold">Fresh Slips</span>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-black">{summary.slipsCount}</div>
          <span className="text-[10px] opacity-80 mt-1">Failed 1st time</span>
        </button>

        {/* 5. Lucky Guesses (1x correct) */}
        <button
          onClick={() => onFilterChange('unverified')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between",
            activeFilter === 'unverified'
              ? "bg-indigo-600 text-white border-transparent shadow-sm"
              : "bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200/70 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/40"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold">Lucky Guesses?</span>
            <HelpCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black">{summary.unverifiedCount}</div>
          <span className="text-[10px] opacity-80 mt-1">1x Correct (Verify)</span>
        </button>

        {/* 6. Mastered */}
        <button
          onClick={() => onFilterChange('mastered')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between",
            activeFilter === 'mastered'
              ? "bg-emerald-600 text-white border-transparent shadow-sm"
              : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/40"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold">Mastered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black">{summary.masteredCount}</div>
          <span className="text-[10px] opacity-80 mt-1">Solidified (3x)</span>
        </button>
      </div>
    </div>
  );
};
