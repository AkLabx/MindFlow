import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'indigo' | 'emerald' | 'amber' | 'crimson';
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  badgeColor = 'indigo',
  action,
  className = '',
}) => {
  const badgeClasses = {
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    crimson: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  }[badgeColor];

  return (
    <div className={`flex items-start justify-between gap-3 mb-4 ${className}`}>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          {badge && (
            <span
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${badgeClasses}`}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
