import React from 'react';
import { ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import type { ResultDashboardData } from '../../types';
import { SectionHeader } from '../common/SectionHeader';
import { formatIndianNumber, formatMarks, formatPercentile } from '../../utils/format';

interface NormalisedScoreSectionProps {
  summary: ResultDashboardData['score_summary'];
  normalisedRanks: ResultDashboardData['ranks']['normalised'];
  shiftRank: number;
}

export const NormalisedScoreSection: React.FC<NormalisedScoreSectionProps> = ({
  summary,
  normalisedRanks,
  shiftRank,
}) => {
  const isAvailable = summary.normalised_score !== null;
  const isShiftRankInvariant = shiftRank === normalisedRanks.shift_rank;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
      <SectionHeader
        title="Normalised Score & Projected Rank"
        subtitle="Multi-shift equalization using Commission Formula-2 (Top-0.1% anchor model)"
        badge="Formula-2"
        badgeColor="crimson"
      />

      {isAvailable ? (
        <>
          {/* Normalised Score Hero Callout */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 via-rose-500/5 to-amber-500/10 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm shadow-red-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">
                  Normalised Score (Top-0.1% Baseline)
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {formatMarks(summary.normalised_score)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    (Raw: {formatMarks(summary.raw_score)})
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Normalisation Gain
              </span>
              <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                +{(summary.normalised_score! - summary.raw_score).toFixed(2)} Marks
              </span>
            </div>
          </div>

          {/* Crimson Projected Rank Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-red-500/5 dark:bg-card-dark/60 border border-red-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                  Normalised Overall
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold">
                  {formatPercentile(normalisedRanks.overall_percentile)}ile
                </span>
              </div>
              <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-2">
                #{formatIndianNumber(normalisedRanks.overall_rank)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Projected all-India</span>
            </div>

            <div className="p-4 rounded-xl bg-red-500/5 dark:bg-card-dark/60 border border-red-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                  Normalised Shift
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold">
                  {formatPercentile(normalisedRanks.shift_percentile)}ile
                </span>
              </div>
              <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-2">
                #{formatIndianNumber(normalisedRanks.shift_rank)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Shift invariant</span>
            </div>

            <div className="p-4 rounded-xl bg-red-500/5 dark:bg-card-dark/60 border border-red-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                  Normalised Category
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold">
                  {formatPercentile(normalisedRanks.category_percentile)}ile
                </span>
              </div>
              <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-2">
                #{formatIndianNumber(normalisedRanks.category_rank)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Category projected</span>
            </div>
          </div>

          {/* Shift Rank Invariance Proof Callout */}
          {isShiftRankInvariant && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>
                Shift Rank Invariance Verified: Your shift rank (#{shiftRank}) remains identical before and after normalisation as mathematically guaranteed.
              </span>
            </div>
          )}

          {/* Bonus Marks Footer */}
          {summary.bonus_marks > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
              <span>Provisional Bonus / Dropped Question Marks:</span>
              <span className="font-bold font-mono">+{summary.bonus_marks} Marks</span>
            </div>
          )}
        </>
      ) : (
        <div className="p-6 rounded-xl bg-slate-50 dark:bg-card-dark/40 border border-slate-200 dark:border-white/5 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Normalisation Sample Gating Active
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Accurate Formula-2 multi-shift normalisation requires at least 1,000 verified submissions across all shifts. Normalised scores and projected ranks will unlock automatically as more submissions arrive.
          </p>
        </div>
      )}
    </div>
  );
};
