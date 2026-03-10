import React, { createContext, useEffect } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { SettingsContextType } from '../features/quiz/types';
/**
 * Context for managing global application settings.
 *
 * Provides access to user preferences such as Dark Mode, Sound, Haptic Feedback,
 * and Background Animations.
 */
export const SettingsContext = createContext<SettingsContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  isSoundEnabled: true,
  toggleSound: () => {},
  isHapticEnabled: true,
  toggleHaptics: () => {},
  areBgAnimationsEnabled: true,
  toggleBgAnimations: () => {},
});
/**
 * Provider component for the SettingsContext.
 *
 * This component wraps the application (or part of it) and manages the state of user settings.
 * It persists settings to `localStorage` using the `useLocalStorageState` hook and
 * applies side effects like adding CSS classes to the document body (e.g., 'dark' mode).
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} [props.children] - The child components that will consume the settings context.
 * @returns {JSX.Element} The Provider component wrapping its children.
 */
export const SettingsProvider = ({ children }: { children?: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useLocalStorageState('mindflow_settings_v1_darkMode', false);
  const [isSoundEnabled, setIsSoundEnabled] = useLocalStorageState('soundEnabled', true);
  const [isHapticEnabled, setIsHapticEnabled] = useLocalStorageState('hapticsEnabled', true);
  const [areBgAnimationsEnabled, setAreBgAnimationsEnabled] = useLocalStorageState('bgAnimationsEnabled', true);
  useEffect(() => {
    // Apply Dark Mode class to the HTML element
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Apply Background Animation class to the body
    if (areBgAnimationsEnabled) {
      document.body.classList.add('background-animated');
    } else {
      document.body.classList.remove('background-animated');
    }
  }, [isDarkMode, areBgAnimationsEnabled]);
  /** Toggles the Dark Mode setting with a View Transition splash effect. */
  const toggleDarkMode = (event?: any) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Fallback for browsers without View Transitions or users who prefer reduced motion
    if (!document.startViewTransition || prefersReducedMotion || !event) {
      setIsDarkMode(prev => !prev);
      return;
    }
    // Get click coordinates
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
    const willBeDark = !isDarkMode;
    const transition = document.startViewTransition(() => {
      if (willBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      setIsDarkMode(willBeDark);
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
  };
  /** Toggles the Sound Enabled setting. */
  const toggleSound = () => setIsSoundEnabled(prev => !prev);
  /**
   * Toggles the Haptic Feedback setting.
   * If enabled, triggers a short vibration as confirmation.
   */
  const toggleHaptics = () => {
    setIsHapticEnabled(prev => !prev);
    if (navigator.vibrate && !isHapticEnabled) {
      navigator.vibrate(50);
    }
  };
  /** Toggles the Background Animations setting. */
  const toggleBgAnimations = () => setAreBgAnimationsEnabled(prev => !prev);
  return (
    <SettingsContext.Provider value={{ 
      isDarkMode, toggleDarkMode,
      isSoundEnabled, toggleSound,
      isHapticEnabled, toggleHaptics,
      areBgAnimationsEnabled, toggleBgAnimations
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
