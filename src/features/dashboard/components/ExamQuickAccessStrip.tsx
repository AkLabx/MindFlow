import React, { useState, useMemo } from 'react';
import { Target, Settings2, Plus, Sparkles } from 'lucide-react';
import {
  CANONICAL_EXAMS,
  CanonicalExam,
  computeExamCounts,
} from '../constants/examRegistry';
import { useExamContextStore } from '@/stores/useExamContextStore';
import { useQuestionMetadata } from '@/features/quiz/hooks/useQuestionMetadata';
import { ExamCard } from './ExamCard';
import { ManageTargetExamsModal } from './ManageTargetExamsModal';

interface ExamQuickAccessStripProps {
  onSelectExam: (exam: CanonicalExam) => void;
  onQuickDrill: (exam: CanonicalExam) => void;
}

const EXAM_COUNTS_CACHE_KEY = 'mindflow_exam_counts_cache_v1';

const getInitialExamCounts = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(EXAM_COUNTS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // Graceful fallback
  }
  return {};
};

export const ExamQuickAccessStrip: React.FC<ExamQuickAccessStripProps> = ({
  onSelectExam,
  onQuickDrill,
}) => {
  const {
    activeExamId,
    pinnedExamIds,
    setActiveExam,
    togglePinExam,
  } = useExamContextStore();

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Read question metadata (eagerly hydrated from Dexie/IndexedDB)
  const { metadata } = useQuestionMetadata();

  // Compute live question counts per canonical exam
  const examCounts = useMemo(() => {
    if (metadata && metadata.length > 0) {
      const calculated = computeExamCounts(metadata);
      try {
        localStorage.setItem(EXAM_COUNTS_CACHE_KEY, JSON.stringify(calculated));
      } catch {}
      return calculated;
    }
    return getInitialExamCounts();
  }, [metadata]);

  // Resolve pinned exams in user order, falling back to default featured if none pinned
  const displayedExams = useMemo(() => {
    const pinned = pinnedExamIds
      .map((id) => CANONICAL_EXAMS.find((e) => e.id === id))
      .filter((e): e is CanonicalExam => Boolean(e));

    if (pinned.length > 0) return pinned;

    // Fallback: Default featured exams
    return CANONICAL_EXAMS.filter((e) => e.isDefaultFeatured);
  }, [pinnedExamIds]);

  return (
    <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none p-3.5 sm:p-4.5 flex flex-col gap-3 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
              Target Exams
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsManageModalOpen(true)}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Manage</span>
        </button>
      </div>

      {/* Horizontal Swipeable Card Strip */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-2.5 sm:gap-3.5 pb-1 no-scrollbar">
        {displayedExams.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            questionCount={examCounts[exam.id] || 0}
            isActive={activeExamId === exam.id}
            onSelect={(selected) => {
              setActiveExam(selected.id);
              onSelectExam(selected);
            }}
            onQuickDrill={(selected) => {
              setActiveExam(selected.id);
              onQuickDrill(selected);
            }}
          />
        ))}

        {/* Add More Goals Card */}
        <button
          type="button"
          onClick={() => setIsManageModalOpen(true)}
          className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600/70 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-all snap-start shrink-0 w-[120px] sm:w-[140px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 transition-all">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-center">Add Exam</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Explore All</span>
        </button>
      </div>

      {/* Manage Target Exams Modal */}
      <ManageTargetExamsModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        pinnedExamIds={pinnedExamIds}
        activeExamId={activeExamId}
        examCounts={examCounts}
        onTogglePin={togglePinExam}
        onSetActive={setActiveExam}
      />
    </section>
  );
};
