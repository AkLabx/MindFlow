import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

interface KeyboardAwareBottomBarProps {
  children: React.ReactNode;
  className?: string;
  hasGlobalFooter?: boolean;
  position?: 'fixed' | 'relative';
  fullWidth?: boolean;
}

/**
 * A generalized Viewport-Aware Surface System for fixed-bottom components.
 * Handles safe-area insets, global footer offsets, and Android/mobile WebView keyboard resizing.
 * No component should use ad-hoc bottom-[calc(...)] classes directly.
 */
export const KeyboardAwareBottomBar: React.FC<KeyboardAwareBottomBarProps> = ({
  children,
  className,
  hasGlobalFooter = false,
  position = 'fixed',
  fullWidth = false
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (position !== 'fixed') {
      setKeyboardHeight(0);
      return;
    }
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;
    const handleViewportChange = () => {
      const overlaid = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardHeight(overlaid > 100 ? overlaid : 0);
    };

    handleViewportChange();
    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, [position]);

  return (
    <div
      className={cn(
        position === 'fixed'
          ? cn(
              "fixed left-0 right-0 w-full z-[60] shadow-[0_-10px_20px_rgba(255,255,255,1)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.5)]",
              !fullWidth && "max-w-3xl mx-auto"
            )
          : "relative w-full",
        "bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 transition-all duration-200 ease-out shrink-0",
        position === 'fixed' && keyboardHeight === 0 && hasGlobalFooter ? "bottom-[calc(56px_+_env(safe-area-inset-bottom))] md:bottom-0" : "",
        position === 'fixed' && keyboardHeight === 0 && !hasGlobalFooter ? "bottom-0" : "",
        "pb-[calc(0.5rem_+_env(safe-area-inset-bottom))] pt-3 px-4",
        className
      )}
      style={position === 'fixed' && keyboardHeight > 0 ? { bottom: `${keyboardHeight}px` } : undefined}
    >
      {children}
    </div>
  );
};
