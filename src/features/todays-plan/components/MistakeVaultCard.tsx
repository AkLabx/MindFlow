import React from 'react';
import { ShieldAlert, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { PlanItem } from '../types';

interface MistakeVaultCardProps {
  mistakeItems: PlanItem[];
  onStartDrill: () => void;
  isLaunching: boolean;
}

export const MistakeVaultCard: React.FC<MistakeVaultCardProps> = ({
  mistakeItems,
  onStartDrill,
  isLaunching
}) => {
  const hasMistakes = mistakeItems.length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {mistakeItems.length} Identified
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 text-left">
          Mistake Vault
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 text-left leading-relaxed">
          {hasMistakes
            ? "Questions you recently missed across previous quizzes. Clear them today to solidify exam recall."
            : "Clean sheet! You have zero unmastered mistakes right now. Keep up the high accuracy!"}
        </p>

        {hasMistakes && (
          <div className="space-y-2 mb-4 text-left">
            {mistakeItems.slice(0, 3).map((item, idx) => (
              <div
                key={item.id || idx}
                className="text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="truncate flex-1 font-medium text-slate-700 dark:text-slate-200">
                  {item.question?.question || `Question in ${item.subject}`}
                </div>
                <span className="text-[10px] shrink-0 font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
                  {item.subject}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onStartDrill}
        disabled={isLaunching || !hasMistakes}
        className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span>Redeem Mistakes in Plan</span>
        <ArrowUpRight className="w-4 h-4" />
      </button>
    </div>
  );
};
