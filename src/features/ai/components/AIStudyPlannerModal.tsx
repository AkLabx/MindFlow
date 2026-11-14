import React, { useId } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Brain,
  Target,
  Flame
} from 'lucide-react';
import { useExamReadiness } from '../hooks/useExamReadiness';
import { NativeDialog } from '@/components/ui/NativeDialog';

interface AIStudyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIStudyPlannerModal: React.FC<AIStudyPlannerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const titleId = useId();
  const {
    isLoading,
    activeExam,
    readinessScore,
    coveragePct,
    accuracyPct,
    tierLabel,
    actionRecommendation,
    totalSyllabusTopics,
    masteredTopicsCount,
    revisionDueTopics,
    launchRevisionDrill,
  } = useExamReadiness();

  return (
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy={titleId}
      className="max-w-lg"
      panelClassName="relative w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90dvh]"
    >
      {/* Header */}
      <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 id={titleId} className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              AI Study Planner
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-extrabold uppercase tracking-wide">
                Spaced Repetition
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Predictive readiness & memory retention schedules
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Target Exam Readiness Hero */}
          <div className="bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-transparent border border-amber-200/80 dark:border-amber-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {activeExam.shortCode} Target Readiness
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {readinessScore}% • {tierLabel}
                </h4>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 flex flex-col items-center justify-center shadow-xs">
                <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  Score
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
              {actionRecommendation}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/60 text-center">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Coverage</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{coveragePct}%</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Accuracy</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{accuracyPct}%</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Mastered</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{masteredTopicsCount}</p>
              </div>
            </div>
          </div>

          {/* Spaced Repetition Due Topics List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Spaced Revision Schedule (Due Today)
              </label>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                {revisionDueTopics.length} {revisionDueTopics.length === 1 ? 'topic' : 'topics'} due
              </span>
            </div>

            {revisionDueTopics.length === 0 ? (
              <div className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/30 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Memory Retention Optimal!
                </h5>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  All attempted topics for {activeExam.shortCode} are fresh. No immediate spaced repetition drills due.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {revisionDueTopics.map((topicItem) => (
                  <div
                    key={topicItem.topic}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-between hover:border-amber-300 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {topicItem.topic}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium shrink-0">
                          {topicItem.subject}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {topicItem.daysSinceLastAttempt > 0
                          ? `Last practiced ${topicItem.daysSinceLastAttempt}d ago`
                          : 'Practiced recently'} • {topicItem.mistakesCount} mistakes
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        launchRevisionDrill(topicItem.topic);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <span>Drill</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          {revisionDueTopics.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onClose();
                launchRevisionDrill();
              }}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Start All Due Revisions</span>
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
    </NativeDialog>
  );
};
