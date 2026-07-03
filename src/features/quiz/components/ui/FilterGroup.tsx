import React from 'react';

/**
 * A container component for grouping related filter inputs.
 *
 * Provides a standardized visual wrapper with a title and icon.
 * Renders as a fieldset for semantic correctness and accessibility.
 *
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the filter group.
 * @param {React.ReactElement} props.icon - The icon to display next to the title.
 * @param {React.ReactNode} [props.children] - The filter inputs to render inside the group.
 * @returns {JSX.Element} The rendered FilterGroup.
 */
export function FilterGroup({ title, icon, children, onClearAll, showClearAll }: { title: string; icon: React.ReactElement; children?: React.ReactNode; onClearAll?: () => void; showClearAll?: boolean }) {
  return (
    <fieldset className="bg-transparent md:bg-white dark:md:bg-gray-800 p-0 md:p-6 rounded-none md:rounded-xl border-transparent border-b md:border-b-0 border-slate-200 dark:border-slate-700 md:border-gray-200 dark:md:border-gray-700 shadow-none md:shadow-sm h-full flex flex-col min-w-0 pb-6 mb-6 md:pb-0 md:mb-0">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-4 w-full">
        <div className="flex items-center gap-2">
          <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
          <legend className="font-bold text-gray-900 dark:text-white text-lg p-0">{title}</legend>
        </div>
        {showClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-gray-100 hover:bg-indigo-50 dark:bg-gray-700 dark:hover:bg-indigo-900/30 px-2 py-1 rounded"
          >
            Clear
          </button>
        )}
      </div>
      <div className="space-y-5 flex-1 min-w-0">
        {children}
      </div>
    </fieldset>
  );
}
