import React from 'react';

interface MetricTileProps {
  label: string;
  value: string | number;
  subtitle?: string;
  delta?: {
    formatted: string;
    trend: 'more' | 'less' | 'neutral';
  };
  accentColor?: 'brand' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'crimson';
  className?: string;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  subtitle,
  delta,
  accentColor = 'brand',
  className = '',
}) => {
  const accentClasses = {
    brand: 'border-slate-200 dark:border-white/10 hover:border-indigo-500/30',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
    rose: 'border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400',
    indigo: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400',
    crimson: 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400',
  }[accentColor];

  return (
    <div
      className={`flex flex-col justify-between p-3.5 rounded-xl bg-white dark:bg-card-dark border transition-all shadow-sm ${accentClasses} ${className}`}
    >
      <span className="text-[11px] font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
          {value}
        </span>
      </div>

      {delta && (
        <span
          className={`mt-1.5 text-xs font-medium font-mono tabular-nums flex items-center gap-1 ${
            delta.trend === 'more'
              ? 'text-emerald-600 dark:text-emerald-400'
              : delta.trend === 'less'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {delta.formatted}
        </span>
      )}

      {subtitle && !delta && (
        <span className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
          {subtitle}
        </span>
      )}
    </div>
  );
};
