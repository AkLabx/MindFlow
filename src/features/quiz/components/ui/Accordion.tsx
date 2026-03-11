import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden mt-6 mb-24">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="font-bold text-gray-800 dark:text-gray-100">{title}</span>
        <ChevronDown className={cn("w-5 h-5 text-gray-500 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="p-6 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
