import React from 'react';
import { cn } from '../../../../utils/cn';

export function SettingsToggle({ label, checked, onChange, icon }: { label: string, checked: boolean, onChange: () => void, icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
       <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon && <span className="text-gray-400">{icon}</span>}
          <label htmlFor={`setting-${label}`} className="cursor-pointer select-none">{label}</label>
       </div>
       
       <button 
          id={`setting-${label}`}
          onClick={onChange}
          className={cn(
              "w-11 h-6 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
              checked ? "bg-indigo-600" : "bg-gray-200"
          )}
       >
          <span className={cn(
              "absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform transform",
              checked ? "translate-x-5" : "translate-x-0"
          )} />
       </button>
    </div>
  );
}