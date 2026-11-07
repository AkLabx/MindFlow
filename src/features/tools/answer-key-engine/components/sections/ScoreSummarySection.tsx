import React from 'react';
import { CheckCircle2, XCircle, MinusCircle, Target } from 'lucide-react';
import type { ResultDashboardData } from '../../types';
import { ScoreDonut } from '../visuals/ScoreDonut';
import { MetricTile } from '../common/MetricTile';
import { formatMarks } from '../../utils/format';

interface ScoreSummarySectionProps {
  summary: ResultDashboardData['score_summary'];
  candidateName?: string;
}

export const ScoreSummarySection: React.FC<ScoreSummarySectionProps> = ({
  summary,
  candidateName = 'Aspirant',
}) => {
  const initials = candidateName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-900/60 dark:via-card-dark dark:to-card-dark border border-indigo-100 dark:border-white/10 shadow-sm">
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 justify-between">
        {/* Left: Avatar & Score Donut */}
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            {initials}
          </div>

          <ScoreDonut
            score={summary.raw_score}
            maxMarks={summary.max_marks || 200}
            accuracy={summary.accuracy}
          />
        </div>

        {/* Right: 4 Metric KPI Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto md:flex-1">
          <MetricTile
            label="Right"
            value={`+${formatMarks(summary.correct * 2)}`}
            subtitle={`${summary.correct} questions`}
            accentColor="emerald"
          />

          <MetricTile
            label="Wrong"
            value={`-${formatMarks(summary.wrong * 0.5)}`}
            subtitle={`${summary.wrong} questions`}
            accentColor="rose"
          />

          <MetricTile
            label="Skipped"
            value={summary.skipped}
            subtitle={`${summary.total_questions - summary.attempted} unattempted`}
            accentColor="amber"
          />

          <MetricTile
            label="Accuracy"
            value={`${summary.accuracy}%`}
            subtitle={`${summary.correct}/${summary.attempted} hit rate`}
            accentColor="indigo"
          />
        </div>
      </div>
    </div>
  );
};
