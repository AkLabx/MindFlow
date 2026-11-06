import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CANONICAL_EXAMS } from '@/features/dashboard/constants/examRegistry';
import { telemetry } from '@/lib/telemetry';

export interface ExamContextState {
  /** Active single exam focus (e.g., 'ssc_cgl') */
  activeExamId: string;
  /** List of user-pinned target exams for quick switching (multi-exam preparation) */
  pinnedExamIds: string[];

  setActiveExam: (examId: string, source?: 'strip' | 'modal' | 'banner' | 'hub' | 'config') => void;
  pinExam: (examId: string) => void;
  unpinExam: (examId: string) => void;
  togglePinExam: (examId: string) => void;
  setPinnedExams: (examIds: string[]) => void;
}

export const useExamContextStore = create<ExamContextState>()(
  persist(
    (set, get) => ({
      activeExamId: 'ssc_cgl',
      pinnedExamIds: ['ssc_cgl', 'bpsc'], // Default to the top 2 exams in MindFlow

      setActiveExam: (examId: string, source = 'strip') => {
        const { pinnedExamIds } = get();
        // Automatically pin if it was not already pinned
        const nextPinned = pinnedExamIds.includes(examId)
          ? pinnedExamIds
          : [...pinnedExamIds, examId];

        set({
          activeExamId: examId,
          pinnedExamIds: nextPinned,
        });

        telemetry.emit('exam_selected', { examId, source });
      },

      pinExam: (examId: string) => {
        const { pinnedExamIds } = get();
        if (!pinnedExamIds.includes(examId)) {
          set({ pinnedExamIds: [...pinnedExamIds, examId] });
        }
      },

      unpinExam: (examId: string) => {
        const { pinnedExamIds, activeExamId } = get();
        // Prevent unpinning all exams - keep at least one
        if (pinnedExamIds.length <= 1) return;

        const nextPinned = pinnedExamIds.filter((id) => id !== examId);
        set({
          pinnedExamIds: nextPinned,
          activeExamId: activeExamId === examId ? nextPinned[0] : activeExamId,
        });
      },

      togglePinExam: (examId: string) => {
        const { pinnedExamIds } = get();
        if (pinnedExamIds.includes(examId)) {
          get().unpinExam(examId);
        } else {
          get().pinExam(examId);
        }
      },

      setPinnedExams: (examIds: string[]) => {
        if (!examIds || examIds.length === 0) return;
        const validIds = examIds.filter((id) =>
          CANONICAL_EXAMS.some((e) => e.id === id)
        );
        if (validIds.length === 0) return;

        set({
          pinnedExamIds: validIds,
          activeExamId: validIds.includes(get().activeExamId)
            ? get().activeExamId
            : validIds[0],
        });
      },
    }),
    {
      name: 'mindflow_exam_context_v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
