import React, { useId } from 'react';
import { cn } from '../../../../utils/cn';

/**
 * A toggle switch component for settings items.
 *
 * Renders an accessible label row and a native `role="switch"` control with a
 * 44x44px minimum touch target for mobile ergonomics.
 *
 * @param {object} props - The component props.
 * @param {string} props.label - The text label for the setting.
 * @param {boolean} props.checked - The current state (on/off).
 * @param {function} props.onChange - Callback to toggle the state.
 * @param {React.ReactNode} [props.icon] - Optional icon to display next to the label.
 * @returns {JSX.Element} The rendered toggle component.
 */
export function SettingsToggle({ label, checked, onChange, icon }: { label: string, checked: boolean, onChange: () => void, icon?: React.ReactNode }) {
  const labelId = useId();

  return (
    <div className="flex items-center justify-between py-2 min-h-[44px] gap-3">
      <span
        id={labelId}
        onClick={onChange}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer select-none flex-1"
      >
        {icon && <span className="text-gray-400" aria-hidden="true">{icon}</span>}
        <span>{label}</span>
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={onChange}
        className="inline-flex items-center justify-end min-w-[44px] min-h-[44px] -my-2 -mr-1 p-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 cursor-pointer"
      >
        <span
          aria-hidden="true"
          className={cn(
            "w-11 h-6 rounded-full relative transition-colors block",
            checked ? "bg-indigo-600 dark:bg-indigo-500" : "bg-gray-200 dark:bg-gray-700"
          )}
        >
          <span
            className={cn(
              "absolute top-1 left-1 bg-white dark:bg-gray-800 w-4 h-4 rounded-full shadow transition-transform transform",
              checked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </span>
      </button>
    </div>
  );
}
