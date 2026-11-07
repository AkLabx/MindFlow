import React, { useMemo } from 'react';
import type { HistogramBin } from '../../hooks/useHistogramSlider';
import { formatIndianNumber } from '../../utils/format';

interface HistogramSliderProps {
  bins: HistogramBin[];
  selectedMark: number;
  candidateMark: number;
  maxMarks?: number;
  onSliderChange: (event: React.ChangeEvent<HTMLInputElement> | number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const HistogramSlider: React.FC<HistogramSliderProps> = ({
  bins,
  selectedMark,
  candidateMark,
  maxMarks = 200,
  onSliderChange,
  onKeyDown,
}) => {
  const maxBinCount = useMemo(() => {
    if (!bins || bins.length === 0) return 1;
    return Math.max(...bins.map(b => b.cnt), 1);
  }, [bins]);

  const ticks = useMemo(() => {
    const step = maxMarks / 6;
    return Array.from({ length: 7 }, (_, i) => Math.round(i * step));
  }, [maxMarks]);

  return (
    <div className="flex flex-col w-full">
      {/* SVG Bar Chart Visualization */}
      <div className="relative w-full h-36 sm:h-44 bg-slate-900/5 dark:bg-black/30 rounded-xl p-2 flex items-end overflow-hidden border border-slate-200 dark:border-white/5">
        <svg
          viewBox={`0 0 ${maxMarks} 100`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          {/* Background grid lines */}
          <line x1="0" y1="25" x2={maxMarks} y2="25" stroke="currentColor" strokeDasharray="3 3" className="stroke-slate-300/30 dark:stroke-slate-700/30" />
          <line x1="0" y1="50" x2={maxMarks} y2="50" stroke="currentColor" strokeDasharray="3 3" className="stroke-slate-300/30 dark:stroke-slate-700/30" />
          <line x1="0" y1="75" x2={maxMarks} y2="75" stroke="currentColor" strokeDasharray="3 3" className="stroke-slate-300/30 dark:stroke-slate-700/30" />

          {/* Histogram Bars */}
          {bins.map((bin) => {
            const barHeight = (bin.cnt / maxBinCount) * 88;
            const isSelected = Math.abs(bin.marks - selectedMark) < 1.0;
            const isCandidate = Math.abs(bin.marks - candidateMark) < 1.0;

            let fillColor = 'fill-indigo-500/30 dark:fill-indigo-400/30';
            if (isSelected) {
              fillColor = 'fill-indigo-600 dark:fill-indigo-400';
            } else if (isCandidate) {
              fillColor = 'fill-emerald-500/70 dark:fill-emerald-400/70';
            }

            return (
              <rect
                key={bin.marks}
                x={bin.marks - 0.4}
                y={100 - barHeight}
                width={1.2}
                height={Math.max(barHeight, 1.5)}
                rx={0.5}
                className={`transition-colors ${fillColor}`}
              />
            );
          })}

          {/* Candidate Marks Reference Line */}
          <line
            x1={candidateMark}
            y1="0"
            x2={candidateMark}
            y2="100"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            className="stroke-emerald-500"
          />

          {/* Selected Scrubber Marker */}
          <line
            x1={selectedMark}
            y1="0"
            x2={selectedMark}
            y2="100"
            strokeWidth="2"
            className="stroke-indigo-600 dark:stroke-indigo-400"
          />
        </svg>

        {/* Candidate Marker Tooltip */}
        <div
          className="absolute top-2 pointer-events-none transform -translate-x-1/2 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold shadow-sm"
          style={{ left: `${Math.min(Math.max((candidateMark / maxMarks) * 100, 8), 92)}%` }}
        >
          You: {candidateMark}
        </div>
      </div>

      {/* Axis Ticks */}
      <div className="flex justify-between px-1 mt-1 text-[11px] font-mono tabular-nums text-slate-400">
        {ticks.map(tick => (
          <span key={tick}>{tick}</span>
        ))}
      </div>

      {/* Interactive Range Scrubber */}
      <div className="mt-3 relative flex items-center">
        <label htmlFor="score-scrubber" className="sr-only">
          Score scrubber: {selectedMark} marks
        </label>
        <input
          id="score-scrubber"
          type="range"
          min="0"
          max={maxMarks}
          step="0.5"
          value={selectedMark}
          onChange={onSliderChange}
          onKeyDown={onKeyDown}
          aria-valuemin={0}
          aria-valuemax={maxMarks}
          aria-valuenow={selectedMark}
          aria-label={`Scrub to mark ${selectedMark}`}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-between items-center mt-1.5 text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          Scrub to evaluate candidate density at any mark
        </span>
        <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
          Selected: {selectedMark} Marks
        </span>
      </div>
    </div>
  );
};
