import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/utils/cn';
import { triggerHaptic } from '@/lib/haptics';

export interface DedicatedPageHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  badge?: React.ReactNode;
  infoPopover?: React.ReactNode;
  rightActions?: React.ReactNode;
  maxWidthClass?: string;
  children?: React.ReactNode;
}

/**
 * Sticky native-Android-feel Top App Bar for dedicated sub-pages where the
 * global MainLayout header is hidden.
 */
export const DedicatedPageHeader: React.FC<DedicatedPageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backLabel,
  badge,
  infoPopover,
  rightActions,
  maxWidthClass,
  children,
}) => {
  const handleBack = () => {
    triggerHaptic('light');
    onBack();
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-3 px-4 sm:px-6">
      <div className={cn(maxWidthClass ?? 'max-w-7xl', 'mx-auto flex items-center justify-between gap-3')}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleBack}
            aria-label={backLabel || 'Go back'}
            className="min-w-[44px] min-h-[44px] active:scale-95 touch-manipulation rounded-xl inline-flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                {title}
              </h1>
              {badge ? <span className="shrink-0">{badge}</span> : null}
              {infoPopover ? <span className="shrink-0">{infoPopover}</span> : null}
            </div>
            {subtitle ? (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-snug">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {rightActions ? (
          <div className="shrink-0 flex items-center gap-2">
            {rightActions}
          </div>
        ) : null}
      </div>

      {children ? (
        <div className={cn(maxWidthClass ?? 'max-w-7xl', 'mx-auto mt-2.5')}>
          {children}
        </div>
      ) : null}
    </header>
  );
};
