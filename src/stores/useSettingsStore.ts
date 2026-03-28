import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SettingsState {
  isDarkMode: boolean;
  toggleDarkMode: (event?: React.MouseEvent | React.TouchEvent | Event | any) => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  isHapticEnabled: boolean;
  toggleHaptics: () => void;
  areBgAnimationsEnabled: boolean;
  toggleBgAnimations: () => void;

  // Target Audience Setting (Competitive vs School)
  targetAudience: 'competitive' | 'school' | null;
  setTargetAudience: (audience: 'competitive' | 'school') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Default values
      isDarkMode: false,
      isSoundEnabled: true,
      isHapticEnabled: true,
      areBgAnimationsEnabled: true,
      targetAudience: null,

      toggleDarkMode: (event?: any) => {
        const { isDarkMode } = get();
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const willBeDark = !isDarkMode;

        if (!document.startViewTransition || prefersReducedMotion || !event) {
          if (willBeDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          set({ isDarkMode: willBeDark });
          return;
        }

        let x = 0;
        let y = 0;
        if (event.clientX !== undefined && event.clientY !== undefined) {
          x = event.clientX;
          y = event.clientY;
        } else if (event.touches && event.touches.length > 0) {
          x = event.touches[0].clientX;
          y = event.touches[0].clientY;
        } else if (event.nativeEvent && event.nativeEvent.clientX !== undefined) {
           x = event.nativeEvent.clientX;
           y = event.nativeEvent.clientY;
        } else {
           x = window.innerWidth / 2;
           y = window.innerHeight / 2;
        }

        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        const transition = document.startViewTransition(() => {
          if (willBeDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          set({ isDarkMode: willBeDark });
        });

        transition.ready.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];
          document.documentElement.animate(
            {
              clipPath: clipPath,
            },
            {
              duration: 500,
              easing: 'ease-in-out',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        });
      },

      toggleSound: () => set((state) => ({ isSoundEnabled: !state.isSoundEnabled })),

      toggleHaptics: () => {
        const { isHapticEnabled } = get();
        const willBeEnabled = !isHapticEnabled;
        set({ isHapticEnabled: willBeEnabled });
        if (navigator.vibrate && willBeEnabled) {
          navigator.vibrate(50);
        }
      },

      toggleBgAnimations: () => {
        const { areBgAnimationsEnabled } = get();
        const willBeEnabled = !areBgAnimationsEnabled;
        if (willBeEnabled) {
          document.body.classList.add('background-animated');
        } else {
          document.body.classList.remove('background-animated');
        }
        set({ areBgAnimationsEnabled: willBeEnabled });
      },

      setTargetAudience: (audience) => {
        set({ targetAudience: audience });

        // When setting audience, we also want to optionally sync to DB if user is logged in
        // However, Zustand should mostly handle client-side. We will trigger the DB sync
        // from the component/hook that calls this to avoid cyclic dependencies with Supabase.
      }
    }),
    {
      name: 'mindflow-settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.isDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          if (state.areBgAnimationsEnabled) {
            document.body.classList.add('background-animated');
          } else {
            document.body.classList.remove('background-animated');
          }
        }
      },
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1) {
          return {
            ...persistedState,
            targetAudience: persistedState.targetAudience || null,
          } as SettingsState;
        }
        return persistedState;
      }
    }
  )
);
