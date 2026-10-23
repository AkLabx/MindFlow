import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface QuizSettingsState {
  isTimerEnabled: boolean;
  toggleTimer: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  isHapticEnabled: boolean;
  toggleHaptics: () => void;
  isExplanationEnabled: boolean;
  toggleExplanation: () => void;
}

export const useQuizSettingsStore = create<QuizSettingsState>()(
  persist(
    (set) => ({
      isTimerEnabled: true,
      toggleTimer: () => set((state) => ({ isTimerEnabled: !state.isTimerEnabled })),

      isSoundEnabled: true,
      toggleSound: () => set((state) => ({ isSoundEnabled: !state.isSoundEnabled })),

      isHapticEnabled: true,
      toggleHaptics: () => set((state) => ({ isHapticEnabled: !state.isHapticEnabled })),

      isExplanationEnabled: true,
      toggleExplanation: () => set((state) => ({ isExplanationEnabled: !state.isExplanationEnabled })),
    }),
    {
      name: 'quiz-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
