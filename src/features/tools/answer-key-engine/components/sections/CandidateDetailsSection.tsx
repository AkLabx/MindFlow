import React from 'react';
import { Contact } from 'lucide-react';
import type { ResultDashboardData } from '../../types';
import { formatExamDate, formatExamTimeWithShift } from '../../utils/format';

interface CandidateDetailsSectionProps {
  candidate: ResultDashboardData['candidate'];
}

export const CandidateDetailsSection: React.FC<CandidateDetailsSectionProps> = ({
  candidate,
}) => {
  const details = [
    {
      label: 'Candidate Name',
      value: candidate.candidate_name || 'Aspirant',
    },
    {
      label: 'Roll Number',
      value: candidate.roll_number || '—',
    },
    {
      label: 'Category',
      value: candidate.category || 'UR',
    },
    {
      label: 'Exam Date',
      value: formatExamDate(candidate.exam_date),
    },
    {
      label: 'Exam Time',
      value: formatExamTimeWithShift(candidate.exam_time, candidate.shift_name),
    },
    {
      label: 'Venue Name',
      value: candidate.venue_name || '—',
    },
    {
      label: 'Subject/Exam Name',
      value: candidate.exam_name || 'Combined Graduate Level Examination, 2026',
    },
    {
      label: 'State',
      value: candidate.state || 'BIHAR',
    },
    {
      label: 'Gender',
      value: candidate.gender || 'MALE',
    },
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-card-dark border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
      {/* 1. Header with ID Card Icon and Title */}
      <div className="p-3.5 sm:p-4 flex items-center gap-2.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-500/20 shadow-2xs">
          <Contact className="w-4.5 h-4.5" />
        </div>
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Candidate Details
        </h2>
      </div>

      {/* 2. Structured Details List with Crisp Dividers */}
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {details.map((item, idx) => (
          <div key={idx} className="py-2.5 sm:py-3 px-4 sm:px-5 flex flex-col gap-0.5">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">
              {item.label}
            </span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight break-words">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
