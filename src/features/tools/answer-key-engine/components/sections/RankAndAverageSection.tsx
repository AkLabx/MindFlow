import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import type { ResultDashboardData } from '../../types';
import { BalanceScale } from '../visuals/BalanceScale';
import { MetricTile } from '../common/MetricTile';
import { SectionHeader } from '../common/SectionHeader';
import { formatIndianNumber, formatPercentile, formatMarks } from '../../utils/format';
import { calculateDelta } from '../../utils/stats';

interface RankAndAverageSectionProps {
  ranks: ResultDashboardData['ranks'];
  averages: ResultDashboardData['averages_and_deltas'];
  candidateScore: number;
}

export const RankAndAverageSection: React.FC<RankAndAverageSectionProps> = ({
  ranks,
  averages,
  candidateScore,
}) => {
  const overallDelta = calculateDelta(candidateScore, averages.overall.mean);
  const shiftDelta = calculateDelta(candidateScore, averages.shift.mean);
  const categoryDelta = calculateDelta(candidateScore, averages.category.mean);

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
      <SectionHeader
        title="Rank Among Candidates & Benchmark"
        subtitle="Standard competition ranking and percentile across all verified submissions"
        badge="Live Estimates"
        badgeColor="indigo"
      />

      {/* 3 Competition Rank Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-card-dark/60 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Overall Rank
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">
              {formatPercentile(ranks.overall.percentile)}ile
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {formatIndianNumber(ranks.overall.rank)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {formatIndianNumber(ranks.overall.total)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Across all shifts</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-card-dark/60 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Shift Rank
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">
              {formatPercentile(ranks.shift.percentile)}ile
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {formatIndianNumber(ranks.shift.rank)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {formatIndianNumber(ranks.shift.total)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">In your shift</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-card-dark/60 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Category Rank
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">
              {formatPercentile(ranks.category.percentile)}ile
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {formatIndianNumber(ranks.category.rank)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {formatIndianNumber(ranks.category.total)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">In your category</span>
        </div>
      </div>

      {/* Dynamic Balance Scale + Averages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-2 border-t border-slate-100 dark:border-white/5">
        <BalanceScale
          candidateMarks={candidateScore}
          averageMarks={averages.overall.mean}
          label="Overall Avg"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricTile
            label="Overall Avg"
            value={formatMarks(averages.overall.mean)}
            delta={overallDelta}
            subtitle={`N=${formatIndianNumber(averages.overall.n)}`}
            accentColor="brand"
          />

          <MetricTile
            label="Shift Avg"
            value={formatMarks(averages.shift.mean)}
            delta={shiftDelta}
            subtitle={`N=${formatIndianNumber(averages.shift.n)}`}
            accentColor="brand"
          />

          <MetricTile
            label="Category Avg"
            value={formatMarks(averages.category.mean)}
            delta={categoryDelta}
            subtitle={`N=${formatIndianNumber(averages.category.n)}`}
            accentColor="brand"
          />
        </div>
      </div>
    </div>
  );
};
