import React from 'react';
import { cn } from '../../../../utils/cn';
import { triggerHaptic } from '@/lib/haptics';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

/**
 * A segmented control component (toggle button group).
 *
 * Allows users to select one or more options from a linear group.
 * Displays counts for each option and handles disabled states.
 */
export const SegmentedControl = React.memo(function SegmentedControl({
  label,
  options, 
  selectedOptions, 
  onOptionToggle,
  counts,
  allowMultiple = true,
  tooltip,
  hideZeroCount = false
}: { 
  label?: string;
  options: string[]; 
  selectedOptions: string[]; 
  onOptionToggle: (option: string) => void;
  counts?: { [key: string]: number };
  allowMultiple?: boolean;
  tooltip?: string;
  hideZeroCount?: boolean;
}) {
  return (
    <div className="pb-5 border-b-2 border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0">
      {label && (
        <div className="flex items-center gap-2 mb-3">
          <label className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white dark:bg-blue-500 text-xs font-bold uppercase tracking-wider rounded-md shadow-sm">{label}</label>
          {tooltip && <InfoTooltip label={label} text={tooltip} />}
        </div>
      )}
      <div className="flex flex-wrap p-1 bg-gray-100 dark:bg-gray-800 rounded-xl gap-1" role="group" aria-label={label || "Segmented Control"}>
        {options.filter(opt => {
            if (!hideZeroCount || !counts) return true;
            return selectedOptions.includes(opt) || (counts[opt] || 0) > 0;
        }).map(option => {
            const count = counts?.[option] || 0;
            const isSelected = selectedOptions.includes(option);
            const isDisabled = !isSelected && count === 0;

            return (
            <button 
                key={option}
                type="button"
                onClick={() => {
                  if (!isDisabled) {
                    triggerHaptic('light');
                    onOptionToggle(option);
                  }
                }}
                disabled={isDisabled}
                aria-pressed={isSelected}
                className={cn(
                    "flex-1 min-h-[40px] py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 select-none touch-manipulation",
                    isSelected 
                        ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-black/5 active:scale-95"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:bg-gray-700/50 active:scale-95",
                    isDisabled && "opacity-40 cursor-not-allowed active:scale-100 hover:bg-transparent hover:text-gray-600 dark:text-gray-300"
                )}
            >
                {option} 
                <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full transition-colors font-bold tabular-nums",
                    isSelected
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}>
                    {count}
                </span>
            </button>
            )
        })}
      </div>
    </div>
  );
});
