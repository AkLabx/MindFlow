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
export function FilterGroup({ title, icon, children }: { title: string; icon: React.ReactElement; children?: React.ReactNode }) {
  return (
    <fieldset className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
      <legend className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4 w-full">
        <span className="text-indigo-600">{icon}</span>
        <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
      </legend>
      <div className="space-y-5 flex-1">
        {children}
      </div>
    </fieldset>
  );
}
