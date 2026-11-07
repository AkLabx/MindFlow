import React from 'react';
import { User, Calendar, Clock, MapPin, Award } from 'lucide-react';
import type { ResultDashboardData } from '../../types';
import { formatMaskedName, formatMaskedRoll, formatExamDate, formatExamTime } from '../../utils/format';

interface CandidateDetailsSectionProps {
  candidate: ResultDashboardData['candidate'];
}

export const CandidateDetailsSection: React.FC<CandidateDetailsSectionProps> = ({
  candidate,
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {formatMaskedName(candidate.candidate_name)}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {candidate.category}
              </span>
            </div>
            <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              Roll No: {formatMaskedRoll(candidate.roll_number)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 border border-indigo-200/60 dark:border-indigo-500/20">
            <Award className="w-3.5 h-3.5" />
            {candidate.exam_name || 'Tier 1 Examination'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3.5 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Date: <strong className="text-slate-900 dark:text-white">{formatExamDate(candidate.exam_date)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Shift: <strong className="text-slate-900 dark:text-white">{candidate.shift_name} ({formatExamTime(candidate.exam_time)})</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 truncate">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">
            Venue: <strong className="text-slate-900 dark:text-white truncate">{candidate.venue_name || 'Authorized CBT Centre'}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
