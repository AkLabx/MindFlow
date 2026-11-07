import React from 'react';
import { formatMarks } from '../../utils/format';

interface CohortComparisonBarProps {
  label: string;
  candidateMarks: number;
  cohortAvgMarks: number;
  maxMarks: number;
  candidateAccuracy: number;
  cohortAccuracy: number;
  delta: number;
}

export const CohortComparisonBar: React.FC<CohortComparisonBarProps> = ({
  label,
  candidateMarks,
  cohortAvgMarks,
  maxMarks,
  candidateAccuracy,
  cohortAccuracy,
  delta,
}) => {
  const candidatePct = Math.min(Math.max((candidateMarks / maxMarks) * 100, 0), 100);
  const cohortPct = Math.min(Math.max((cohortAvgMarks / maxMarks) * 100, 0), 100);

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-card-dark/60 border border-slate-200/80 dark:border-white/5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-800 dark:text-slate-200">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono tabular-nums text-slate-900 dark:text-white">
            {formatMarks(candidateMarks)} / {maxMarks}
          </span>
          <span
            className={`font-mono text-[11px] font-bold ${
              delta >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Bar container with serious cohort tick */}
      <div className="relative w-full h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-visible">
        {/* Candidate Fill Bar */}
        <div
          className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${candidatePct}%` }}
        />

        {/* Serious Cohort Average Vertical Tick */}
        <div
          className="absolute -top-1 bottom-0 w-1 bg-black dark:bg-white rounded-full shadow-sm z-10"
          style={{ left: `${cohortPct}%` }}
          title={`Serious Cohort Average: ${cohortAvgMarks.toFixed(2)}`}
        />
      </div>

      {/* Accuracy & Cohort Comparison Subtitle */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
        <span>
          Accuracy: <span className="font-bold font-mono">{candidateAccuracy}%</span> (Cohort:{' '}
          <span className="font-mono">{cohortAccuracy}%</span>)
        </span>
        <span className="text-[10px]">
          Cohort Avg: <span className="font-mono font-medium">{formatMarks(cohortAvgMarks)}</span>
        </span>
      </div>
    </div>
  );
};
