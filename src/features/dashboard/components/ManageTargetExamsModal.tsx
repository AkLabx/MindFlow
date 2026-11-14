import React, { useId } from 'react';
import {
  X,
  Check,
  Plus,
  Landmark,
  Scale,
  Train,
  ShieldAlert,
  Award,
  Shield,
  Sparkles,
  Target
} from 'lucide-react';
import { CANONICAL_EXAMS } from '../constants/examRegistry';
import { NativeDialog } from '@/components/ui/NativeDialog';

interface ManageTargetExamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedExamIds: string[];
  activeExamId: string;
  examCounts: Record<string, number>;
  onTogglePin: (examId: string) => void;
  onSetActive: (examId: string) => void;
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

export const ManageTargetExamsModal: React.FC<ManageTargetExamsModalProps> = ({
  isOpen,
  onClose,
  pinnedExamIds,
  activeExamId,
  examCounts,
  onTogglePin,
  onSetActive,
}) => {
  const titleId = useId();
  const categories = Array.from(new Set(CANONICAL_EXAMS.map((e) => e.category)));

  return (
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      variant="bottom-sheet"
      ariaLabelledBy={titleId}
      className="sm:my-auto sm:p-4 max-w-xl"
      panelClassName="relative w-full max-h-[88dvh] sm:max-h-[85dvh] flex flex-col bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <h2 id={titleId} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Manage Target Exams
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pin multiple exams to your dashboard for fast switching & practice
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        {/* Exam List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {categories.map((category) => {
            const exams = CANONICAL_EXAMS.filter((e) => e.category === category);
            return (
              <div key={category} className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {category}
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {exams.map((exam) => {
                    const Icon = IconMap[exam.icon] || Sparkles;
                    const isPinned = pinnedExamIds.includes(exam.id);
                    const isActive = activeExamId === exam.id;
                    const count = examCounts[exam.id] || 0;
                    const formattedCount =
                      count >= 1000 ? `${(count / 1000).toFixed(1)}k+` : `${count}`;

                    return (
                      <div
                        key={exam.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isActive
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700'
                            : isPinned
                            ? 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${exam.borderClass} bg-white dark:bg-slate-800`}
                          >
                            <Icon className={`w-4 h-4 ${exam.textClass}`} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {exam.displayName}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                {formattedCount} Qs
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                              {exam.subtitle}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {isPinned && !isActive && (
                            <button
                              type="button"
                              onClick={() => onSetActive(exam.id)}
                              className="text-[11px] font-semibold px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onTogglePin(exam.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isPinned
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isPinned ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Pinned</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Pin</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Done CTA */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
    </NativeDialog>
  );
};
