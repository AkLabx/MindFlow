import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export function SegmentedControl({ 
  label,
  options, 
  selectedOptions, 
  onOptionToggle,
  counts,
  allowMultiple = true,
  tooltip
}: { 
  label?: string;
  options: string[]; 
  selectedOptions: string[]; 
  onOptionToggle: (option: string) => void;
  counts?: { [key: string]: number };
  allowMultiple?: boolean;
  tooltip?: string;
}) {
  return (
    <div>
      {label && (
        <div className="flex items-center gap-1.5 mb-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
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