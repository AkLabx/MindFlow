import React from 'react';
import { Layers, ChevronRight, Award } from 'lucide-react';
import { useShiftAverages } from '../../hooks/useShiftAverages';
import { SortedBars } from '../visuals/SortedBars';
import { AllShiftsSlideOver } from '../visuals/AllShiftsSlideOver';
import { MetricTile } from '../common/MetricTile';
import { SectionHeader } from '../common/SectionHeader';
import { formatMarks, formatIndianNumber } from '../../utils/format';

interface AverageMarksSectionProps {
  examId: string;
  userShiftCode?: string;
}

export const AverageMarksSection: React.FC<AverageMarksSectionProps> = ({
  examId,
  userShiftCode,
}) => {
  const {
    dimension,
    setDimension,
    shifts,
    dimensionStats,
    yourShift,
    hardestShift,
    easiestShift,
    totalShifts,
    isSlideOverOpen,
    setIsSlideOverOpen,
  } = useShiftAverages({
    examId,
    userShiftCode,
  });

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
      <SectionHeader
        title="Average Marks & Shift Difficulty Directory"
        subtitle="Benchmark average marks across shifts, social categories, and candidate cohorts"
        badge="Multi-Dimension"
        badgeColor="indigo"
        action={
          dimension === 'shift' && shifts.length > 0 ? (
            <button
              onClick={() => setIsSlideOverOpen(true)}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              <span>View All Shifts ({totalShifts})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : undefined
        }
      />

      {/* Dimension Tabs (Shift / Category / Gender) */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
        <button
          onClick={() => setDimension('shift')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            dimension === 'shift'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          Shifts ({totalShifts})
        </button>
        <button
          onClick={() => setDimension('category')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            dimension === 'category'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          Category
        </button>
        <button
          onClick={() => setDimension('gender')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            dimension === 'gender'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          Gender
        </button>
      </div>

      {dimension === 'shift' ? (
        <>
          {/* Shift Difficulty Summary Callout */}
          {yourShift && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-slate-800 dark:text-slate-200">
                  Your Shift (<strong className="text-indigo-600 dark:text-indigo-400">{yourShift.shift_label}</strong>) is ranked
                </span>
              </div>
              <span className="font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[11px]">
                #{yourShift.difficulty_rank} hardest out of {totalShifts} shifts
              </span>
            </div>
          )}

          {/* 3 Shift Benchmark Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricTile
              label="Your Shift Avg"
              value={yourShift ? formatMarks(yourShift.mean) : '—'}
              subtitle={yourShift ? `N=${formatIndianNumber(yourShift.n)}` : 'Shift not matched'}
              accentColor="indigo"
            />

            <MetricTile
              label="Hardest Shift (#1)"
              value={hardestShift ? formatMarks(hardestShift.mean) : '—'}
              subtitle={hardestShift ? hardestShift.shift_label : 'N/A'}
              accentColor="rose"
            />

            <MetricTile
              label="Easiest Shift"
              value={easiestShift ? formatMarks(easiestShift.mean) : '—'}
              subtitle={easiestShift ? easiestShift.shift_label : 'N/A'}
              accentColor="emerald"
            />
          </div>

          {/* Top 5 Sorted Shift Difficulty Bars */}
          <SortedBars
            shifts={shifts}
            userShiftCode={userShiftCode}
            maxDisplay={5}
          />
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {dimensionStats.map(stat => (
            <div
              key={stat.key}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-card-dark/60 border border-slate-200 dark:border-white/5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {stat.key}
                </span>
                <span className="text-[10px] text-slate-400">
                  N={formatIndianNumber(stat.n)}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {formatMarks(stat.mean)}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Max: {formatMarks(stat.max)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over sheet for full shift directory */}
      <AllShiftsSlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        shifts={shifts}
        userShiftCode={userShiftCode}
      />
    </div>
  );
};
