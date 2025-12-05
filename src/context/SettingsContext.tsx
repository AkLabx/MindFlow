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
  const [isDarkMode, setIsDarkMode] = useLocalStorageState('darkMode', false);
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

  /** Toggles the Dark Mode setting. */
  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

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
