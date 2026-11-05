import React from 'react';
import {
  Landmark,
  Scale,
  Train,
  ShieldAlert,
  Award,
  Shield,
  Sparkles,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  Target
} from 'lucide-react';
import { CanonicalExam } from '../constants/examRegistry';

interface ExamCardProps {
  exam: CanonicalExam;
  questionCount: number;
  isActive: boolean;
  onSelect: (exam: CanonicalExam) => void;
  onQuickDrill: (exam: CanonicalExam) => void;
}

const IconMap: Record<string, React.ElementType> = {
  Landmark,
  Scale,
  Train,
  ShieldAlert,
  Award,
  Shield,
  Sparkles,
};

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  questionCount,
  isActive,
  onSelect,
  onQuickDrill,
}) => {
  const Icon = IconMap[exam.icon] || Sparkles;

  const formattedCount =
    questionCount >= 1000
      ? `${(questionCount / 1000).toFixed(1)}k+`
      : `${questionCount}`;

  return (
    <div
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 snap-start shrink-0 w-[78vw] sm:w-[260px] lg:w-[280px] bg-white dark:bg-slate-900 shadow-sm hover:shadow-md ${
        isActive
          ? 'border-indigo-500/90 dark:border-indigo-400 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20'
          : `${exam.borderClass} hover:border-indigo-300 dark:hover:border-indigo-700/60`
      }`}
    >
      {/* Background Accent Gradient */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${exam.gradient} pointer-events-none opacity-80`}
      />

      {/* Header Info */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${exam.borderClass} bg-white dark:bg-slate-800 shadow-xs group-hover:scale-105 transition-transform`}
          >
            <Icon className={`w-5 h-5 ${exam.textClass}`} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                {exam.displayName}
              </h3>
              {isActive && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  <Target className="w-2.5 h-2.5 mr-0.5" /> Active
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block line-clamp-1 mt-0.5">
              {exam.subtitle}
            </span>
          </div>
        </div>

        {/* Live Question Count Badge */}
        <span
          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${exam.badgeColor}`}
        >
          {formattedCount} Qs
        </span>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
        {/* Primary CTA: Configure Quiz */}
        <button
          type="button"
          onClick={() => onSelect(exam)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Configure</span>
          <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />
        </button>

        {/* Secondary Quick Drill CTA: 25 Qs */}
        <button
          type="button"
          onClick={() => onQuickDrill(exam)}
          title="Instant 25 Questions Practice Drill"
          className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200/80 dark:border-amber-800/50 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>25 Qs</span>
        </button>
      </div>
    </div>
  );
};
