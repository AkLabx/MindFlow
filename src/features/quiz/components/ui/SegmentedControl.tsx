import React from 'react';
import { cn } from '../../../../utils/cn';

export function SegmentedControl({ 
  label,
  options, 
  selectedOptions, 
  onOptionToggle,
  counts,
  allowMultiple = true
}: { 
  label?: string;
  options: string[]; 
  selectedOptions: string[]; 
  onOptionToggle: (option: string) => void;
  counts?: { [key: string]: number };
  allowMultiple?: boolean;
}) {
  return (
    <div>
      {label && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>}
      <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
        {options.map(option => {
            const count = counts?.[option] || 0;
            const isSelected = selectedOptions.includes(option);
            const isDisabled = !isSelected && count === 0;

            return (
            <button 
                key={option} 
                onClick={() => !isDisabled && onOptionToggle(option)}
                disabled={isDisabled}
                className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                    isSelected 
                        ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" 
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
                    isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-gray-500"
                )}
            >
                {option} 
                <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full transition-colors",
                    isSelected ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-500"
                )}>
                    {count}
                </span>
            </button>
            )
        })}
      </div>
    </div>
  );
}