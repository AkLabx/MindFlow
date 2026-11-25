import React from 'react';
import { X, Filter } from 'lucide-react';
import { InitialFilters } from '../../types';
import { getExamDisplayLabel } from '../../constants/examDomains';

/**
 * Props for the ActiveFiltersBar component.
 */
interface ActiveFiltersBarProps {
  /** The current state of selected filters. */
  filters: InitialFilters;
  /** Callback to remove a specific filter value. */
  onRemoveFilter: (key: keyof InitialFilters, value?: string) => void;
  /** Callback to clear all filters. */
  onClearAll: () => void;
  /** Array of filter keys that cannot be removed by the user. */
  lockedFilterKeys?: Array<keyof InitialFilters>;
}

/**
 * A component that displays a list of currently active filters as removable "pills" or tags.
 *
 * Provides visual feedback to the user about what criteria are currently applied to the question set.
 *
 * @param {ActiveFiltersBarProps} props - The component props.
 * @returns {JSX.Element} The rendered ActiveFiltersBar.
 */
export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({ filters, onRemoveFilter, onClearAll, lockedFilterKeys = [] }) => {
  // Explicitly type arr as string[] because Object.values return unknown[]/any[] depending on config
  const hasFilters = Object.values(filters).some((arr: string[]) => arr.length > 0);
  const hasRemovableFilters = Object.keys(filters).some(key =>
    (filters[key as keyof InitialFilters] || []).length > 0 && !lockedFilterKeys.includes(key as keyof InitialFilters)
  );

  return (
    <div className="bg-transparent md:bg-white dark:md:bg-gray-800 md:rounded-xl border-y md:border border-gray-200 dark:border-gray-700 p-4 md:p-4 shadow-none md:shadow-sm transition-all">
      <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Filter className="w-4 h-4" /> Active Filters
          </h4>
          {hasRemovableFilters && (
              <button 
                type="button"
                onClick={onClearAll}
                className="min-h-[44px] min-w-[44px] px-3 py-1.5 inline-flex items-center justify-center rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 active:scale-95 touch-manipulation transition-colors cursor-pointer"
              >
                  Clear All
              </button>
          )}
      </div>
      
      <div className="min-h-[32px] flex flex-wrap gap-2 items-center">
        {!hasFilters && (
          <span className="text-sm text-gray-400 italic">No filters selected. Select criteria above to refine questions.</span>
        )}
        
        {Object.keys(filters).map(key => {
          const isLocked = lockedFilterKeys.includes(key as keyof InitialFilters);
          return (filters[key as keyof InitialFilters] || []).map(val => {
            const displayVal = key === 'examName' ? getExamDisplayLabel(val) : val;
            return (
              <div 
                key={`${key}-${val}`} 
                className={`inline-flex items-center gap-1 min-h-[44px] pl-3 ${isLocked ? 'pr-3 py-2' : 'pr-1 py-0.5'} rounded-full text-xs font-bold shadow-sm group ${
                  isLocked
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                    : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700'
                }`}
              >
                 <span className="capitalize opacity-70 font-medium mr-0.5">{key}:</span>
                 <span>{displayVal}</span>
                 {!isLocked && (
                   <button
                      type="button"
                      onClick={() => onRemoveFilter(key as keyof InitialFilters, val)}
                      aria-label={`Remove ${key} filter ${displayVal}`}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full hover:bg-indigo-200/70 dark:hover:bg-indigo-800/60 active:scale-95 touch-manipulation transition-colors cursor-pointer"
                   >
                      <span className="bg-indigo-200 dark:bg-indigo-800 rounded-full p-1 inline-flex items-center justify-center">
                        <X className="w-3 h-3" aria-hidden="true" />
                      </span>
                   </button>
                 )}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};
