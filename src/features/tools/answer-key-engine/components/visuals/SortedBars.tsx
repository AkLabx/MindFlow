import React from 'react';
import type { ShiftDirectoryItem } from '../../hooks/useShiftAverages';
import { formatMarks, formatIndianNumber } from '../../utils/format';

interface SortedBarsProps {
  shifts: ShiftDirectoryItem[];
  userShiftCode?: string;
  maxDisplay?: number;
}

export const SortedBars: React.FC<SortedBarsProps> = ({
  shifts,
  userShiftCode,
  maxDisplay = 5,
}) => {
  const displayShifts = shifts.slice(0, maxDisplay);
  const maxMean = Math.max(...shifts.map(s => s.mean), 150);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {displayShifts.map((shift) => {
        const isUserShift = shift.shift_code === userShiftCode;
        const widthPct = Math.min(Math.max((shift.mean / maxMean) * 100, 10), 100);

        return (
          <div
            key={shift.shift_code}
            className={`flex flex-col p-2.5 rounded-xl border transition-all ${
              isUserShift
                ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30'
                : 'bg-white dark:bg-card-dark border-slate-200 dark:border-white/5'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  #{shift.difficulty_rank}
                </span>
                <span className="truncate text-slate-900 dark:text-white">
                  {shift.shift_label}
                </span>
                {isUserShift && (
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider">
                    You
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatMarks(shift.mean)} Avg
                </span>
                <span className="text-[10px] text-slate-400">
                  (N={formatIndianNumber(shift.n)})
                </span>
              </div>
            </div>

            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isUserShift ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-400 dark:bg-slate-600'
                }`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
