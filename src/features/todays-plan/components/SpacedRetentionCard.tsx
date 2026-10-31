import React from 'react';
import { RefreshCw, BrainCircuit, ArrowUpRight } from 'lucide-react';
import { PlanItem } from '../types';

interface SpacedRetentionCardProps {
  spacedItems: PlanItem[];
  onStartDrill: () => void;
  isLaunching: boolean;
}

export const SpacedRetentionCard: React.FC<SpacedRetentionCardProps> = ({
  spacedItems,
  onStartDrill,
  isLaunching
}) => {
  const count = spacedItems.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {count} Due Today
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 text-left">
          Retention Radar
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 text-left leading-relaxed">
          Based on the Ebbinghaus forgetting curve. Questions solved 1, 3, or 7 days ago reappear before memory decay sets in.
        </p>

        <div className="grid grid-cols-4 gap-1.5 mb-4 text-center">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Day 1</div>
            <div className="text-xs font-bold text-violet-600 dark:text-violet-400">Recall</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Day 3</div>
            <div className="text-xs font-bold text-violet-600 dark:text-violet-400">Check</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Day 7</div>
            <div className="text-xs font-bold text-violet-600 dark:text-violet-400">Anchor</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Day 21</div>
            <div className="text-xs font-bold text-violet-600 dark:text-violet-400">Master</div>
          </div>
        </div>
      </div>

      <button
        onClick={onStartDrill}
        disabled={isLaunching || count === 0}
        className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/40 border border-violet-200 dark:border-violet-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span>Refresh Spaced Memory</span>
        <ArrowUpRight className="w-4 h-4" />
      </button>
    </div>
  );
};
