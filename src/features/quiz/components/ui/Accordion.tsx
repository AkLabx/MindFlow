import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface AccordionProps {
  title: string;
  subtitle?: string;
  activeBadge?: string | number | null;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Accordion({
  title,
  subtitle,
  activeBadge,
  children,
  defaultOpen = false,
  className,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "border-y md:border border-slate-200/80 dark:border-slate-800 md:rounded-2xl bg-white/60 dark:bg-slate-900/60 shadow-xs backdrop-blur-xs transition-all overflow-hidden",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-bold text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 shadow-xs">
            {title}
          </span>
          {subtitle && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
              {subtitle}
            </span>
          )}
          {Boolean(activeBadge) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50">
              {activeBadge} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 shrink-0 ml-2">
          <span className="text-[11px] font-medium hidden xs:inline">
            {isOpen ? 'Collapse' : 'Expand'}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-300",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out relative",
          isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden pointer-events-none"
        )}
      >
        <div className="p-3.5 sm:p-5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          {children}
        </div>
      </div>
    </div>
  );
}
