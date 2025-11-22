
import React, { createContext, useEffect } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { SettingsContextType } from '../features/quiz/types';

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

export const SettingsProvider = ({ children }: { children?: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useLocalStorageState('darkMode', false);
  const [isSoundEnabled, setIsSoundEnabled] = useLocalStorageState('soundEnabled', true);
  const [isHapticEnabled, setIsHapticEnabled] = useLocalStorageState('hapticsEnabled', true);
  const [areBgAnimationsEnabled, setAreBgAnimationsEnabled] = useLocalStorageState('bgAnimationsEnabled', true);

  useEffect(() => {
    // Apply Dark Mode class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply Background Animation class
    if (areBgAnimationsEnabled) {
      document.body.classList.add('background-animated');
    } else {
      document.body.classList.remove('background-animated');
    }
  }, [isDarkMode, areBgAnimationsEnabled]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const toggleSound = () => setIsSoundEnabled(prev => !prev);
  
  const toggleHaptics = () => {
    setIsHapticEnabled(prev => !prev);
    if (navigator.vibrate && !isHapticEnabled) {
      navigator.vibrate(50);
    }
  };
  
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
