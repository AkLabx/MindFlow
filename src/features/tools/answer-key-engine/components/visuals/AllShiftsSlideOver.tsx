import React, { useState, useMemo } from 'react';
import { X, Search, ArrowUpDown } from 'lucide-react';
import type { ShiftDirectoryItem } from '../../hooks/useShiftAverages';
import { formatMarks, formatIndianNumber } from '../../utils/format';

interface AllShiftsSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: ShiftDirectoryItem[];
  userShiftCode?: string;
}

export const AllShiftsSlideOver: React.FC<AllShiftsSlideOverProps> = ({
  isOpen,
  onClose,
  shifts,
  userShiftCode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'hardest' | 'easiest'>('hardest');

  const filteredShifts = useMemo(() => {
    let result = [...shifts];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        s =>
          s.shift_label.toLowerCase().includes(q) ||
          s.shift_code.toLowerCase().includes(q) ||
          s.exam_date.toLowerCase().includes(q)
      );
    }

    if (sortOrder === 'easiest') {
      result.reverse();
    }

    return result;
  }, [shifts, searchTerm, sortOrder]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="All Shifts Directory"
    >
      <div className="w-full max-w-md bg-white dark:bg-card-dark h-full shadow-2xl flex flex-col z-10 animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              All Shifts Directory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {shifts.length} shifts ranked by average difficulty
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search shift or date..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setSortOrder(prev => (prev === 'hardest' ? 'easiest' : 'hardest'))}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
            <span>{sortOrder === 'hardest' ? 'Hardest' : 'Easiest'}</span>
          </button>
        </div>

        {/* Shift List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredShifts.map(shift => {
            const isUserShift = shift.shift_code === userShiftCode;

            return (
              <div
                key={shift.shift_code}
                className={`p-3 rounded-xl border transition-all ${
                  isUserShift
                    ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30'
                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      #{shift.difficulty_rank}
                    </span>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {shift.shift_label}
                    </span>
                    {isUserShift && (
                      <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-bold uppercase">
                        Your Shift
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {formatMarks(shift.mean)} Avg
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{shift.exam_date || 'Date N/A'}</span>
                  <span>N = {formatIndianNumber(shift.n)} candidates</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
