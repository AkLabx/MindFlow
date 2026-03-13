import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export interface ScrollableCapsulesProps {
  label?: string;
  options: string[];
  selectedOptions: string[];
  onOptionToggle: (option: string) => void;
  counts?: { [key: string]: number };
  allowMultiple?: boolean;
  tooltip?: string;
}

export const ScrollableCapsules = React.memo(function ScrollableCapsules({
  label,
  options,
  selectedOptions,
  onOptionToggle,
  counts,
  allowMultiple = true,
  tooltip
}: ScrollableCapsulesProps) {
  return (
    <div>
      {label && (
        <div className="flex items-center gap-1.5 mb-2">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
          {tooltip && (
            <div className="group relative flex items-center">
              <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-indigo-500 transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50 pointer-events-none text-center font-normal leading-relaxed">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scrollable Container */}
      <div
        className="flex overflow-x-auto py-1 -mx-1 px-1 scrollbar-hide space-x-2"
        role="group"
        aria-label={label || "Capsule Filter Group"}
      >
        {options.map(option => {
            const count = counts?.[option] || 0;
            const isSelected = selectedOptions.includes(option);
            const isDisabled = !isSelected && count === 0;

            return (
              <button
                  key={option}
                  type="button"
                  onClick={() => !isDisabled && onOptionToggle(option)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  className={cn(
                      "flex-shrink-0 whitespace-nowrap py-2 px-4 rounded-full text-sm font-semibold transition-all duration-200 border flex items-center gap-2",
                      isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-none"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                      isDisabled && "opacity-40 cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                  )}
              >
                  {option}
                  <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full transition-colors font-bold",
                      isSelected
                        ? "bg-indigo-500/30 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
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
