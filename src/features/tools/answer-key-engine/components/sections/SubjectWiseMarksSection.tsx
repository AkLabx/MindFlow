import React, { useState } from 'react';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import type { ResultDashboardData } from '../../types';
import { SectionHeader } from '../common/SectionHeader';
import { formatMarks, formatIndianNumber } from '../../utils/format';

interface SubjectWiseMarksSectionProps {
  sections: ResultDashboardData['section_results'];
  totalMarks: number;
}

export const SubjectWiseMarksSection: React.FC<SubjectWiseMarksSectionProps> = ({
  sections,
  totalMarks,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const totalAttempted = sections.reduce((sum, s) => sum + s.attempted, 0);
  const totalCorrect = sections.reduce((sum, s) => sum + s.correct, 0);
  const totalWrong = sections.reduce((sum, s) => sum + s.wrong, 0);
  const totalAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
      <SectionHeader
        title="Subject Wise Marks Breakdown"
        subtitle="Granular section performance with accuracy and section ranks"
        badge="4 Sections"
        badgeColor="indigo"
        action={
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-card-dark text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-card-dark text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        }
      />

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sections.map((sec) => (
            <div
              key={sec.section_id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-card-dark/60 border border-slate-200 dark:border-white/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {sec.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                    {sec.accuracy}% Acc
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                    {formatMarks(sec.marks)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ 50</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/5 grid grid-cols-3 text-center text-[11px]">
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    +{sec.correct}
                  </span>
                  <div className="text-slate-400 text-[10px]">Right</div>
                </div>
                <div>
                  <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">
                    -{sec.wrong}
                  </span>
                  <div className="text-slate-400 text-[10px]">Wrong</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold font-mono">{sec.skipped}</span>
                  <div className="text-slate-400 text-[10px]">Skip</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3 text-center">Attempted</th>
                <th className="py-2.5 px-3 text-center text-emerald-600">Correct</th>
                <th className="py-2.5 px-3 text-center text-rose-600">Wrong</th>
                <th className="py-2.5 px-3 text-center">Skipped</th>
                <th className="py-2.5 px-3 text-center">Accuracy</th>
                <th className="py-2.5 px-3 text-right">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
              {sections.map((sec) => (
                <tr key={sec.section_id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                    {sec.name}
                  </td>
                  <td className="py-2.5 px-3 text-center">{sec.attempted}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">{sec.correct}</td>
                  <td className="py-2.5 px-3 text-center text-rose-600 font-bold">{sec.wrong}</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">{sec.skipped}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                    {sec.accuracy}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                    {formatMarks(sec.marks)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deep Navy Summary Footer */}
      <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold tracking-wide uppercase text-slate-300 text-[11px]">
          Total Raw Score
        </span>
        <div className="flex items-center gap-4 font-mono">
          <span>
            Attempted: <strong className="text-white">{totalAttempted}</strong>
          </span>
          <span>
            Right: <strong className="text-emerald-400">{totalCorrect}</strong>
          </span>
          <span>
            Wrong: <strong className="text-rose-400">{totalWrong}</strong>
          </span>
          <span>
            Accuracy: <strong className="text-indigo-300">{totalAccuracy}%</strong>
          </span>
          <span className="text-sm font-black text-amber-400">
            {formatMarks(totalMarks)} / 200 Marks
          </span>
        </div>
      </div>
    </div>
  );
};
