import React, { useEffect, useState, ComponentType, useCallback, useRef } from 'react';
import { useAppConfigStore, IntroConfig } from '../../stores/useAppConfigStore';
import { getIntroModule } from './registry';
import { IntroProps } from './registry/types';

export const IntroEngine: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config, initialize, previewConfig, previewNonce, clearPreview } = useAppConfigStore();
  const [hasPlayed, setHasPlayed] = useState(false);
  const [IntroComponent, setIntroComponent] = useState<ComponentType<IntroProps> | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // State for freezing the config during playback so live updates don't reset it
  const [frozenConfig, setFrozenConfig] = useState<IntroConfig | null>(null);

  // Idempotency ref to ensure completion only runs once
  const completedRef = useRef(false);

  // Initialize and check session on mount
  useEffect(() => {
    initialize();

    const sessionKey = 'mindflow_intro_played_v2';
    if (sessionStorage.getItem(sessionKey)) {
      setHasPlayed(true);
      return;
    }

    const startConfig = config.intro;
    if (!startConfig.enabled) {
      sessionStorage.setItem(sessionKey, 'true');
      setHasPlayed(true);
      return;
    }

    // Freeze config for this run
    setFrozenConfig(startConfig);
    completedRef.current = false;

    // Mount the component
    let isMounted = true;
    const activeModule = getIntroModule(startConfig.active);

    activeModule.load().then((mod) => {
      if (isMounted) {
        setIntroComponent(() => mod.default);
      }
    }).catch(err => {
      console.error("Failed to load intro module:", err);
      if (isMounted) {
         sessionStorage.setItem(sessionKey, 'true');
         setHasPlayed(true);
      }
    });

    return () => { isMounted = false; };
  // We intentionally only run this block once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch for preview nonce changes to trigger preview mode
  useEffect(() => {
    if (previewNonce > 0 && previewConfig) {
      setIsPreviewing(true);
      setIntroComponent(null); // Reset component to force re-mount
      setFrozenConfig(previewConfig); // Freeze the preview config
      completedRef.current = false;

      let isMounted = true;
      const activeModule = getIntroModule(previewConfig.active);

      activeModule.load().then((mod) => {
        if (isMounted) {
          setIntroComponent(() => mod.default);
        }
      }).catch(err => {
        console.error("Failed to load preview intro module:", err);
        if (isMounted) {
           setIsPreviewing(false);
           clearPreview();
        }
      });

      return () => { isMounted = false; };
    }
  }, [previewNonce, previewConfig, clearPreview]);

  // Idempotent and stable complete handler
  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    if (isPreviewing) {
        setIsPreviewing(false);
        clearPreview();
        setFrozenConfig(null);
    } else {
        sessionStorage.setItem('mindflow_intro_played_v2', 'true');
        setHasPlayed(true);
        setFrozenConfig(null);
    }
  }, [isPreviewing, clearPreview]);

  // Watchdog Timer:
  // Starts when a component actually mounts to render the intro.
  // We cap it to a maximum of 8000ms just in case.
  useEffect(() => {
    if (!IntroComponent || !frozenConfig) return;

    let watchdogDuration = frozenConfig.duration + 1500;
    if (watchdogDuration > 8000) {
      watchdogDuration = 8000;
    }

    // Minimum sane duration to prevent immediate skip on weird config
    if (watchdogDuration < 2000) {
        watchdogDuration = 3000;
    }

    const watchdogTimer = setTimeout(() => {
      console.warn(`[IntroEngine] Watchdog timeout triggered after ${watchdogDuration}ms. Forcing completion.`);
      handleComplete();
    }, watchdogDuration);

    return () => clearTimeout(watchdogTimer);
  }, [IntroComponent, frozenConfig, handleComplete]);

  // When previewing, we render the children (app) underneath,
  // and the intro as a full screen overlay.
  // When NOT previewing and already played, just render the app.
  if (hasPlayed && !isPreviewing) {
    return <>{children}</>;
  }

  // Not played yet, or currently previewing but component not loaded
  if (!IntroComponent || !frozenConfig) {
     return <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[9999]" />;
  }

  return (
    <>
      {/* If previewing, keep the app running underneath so Admin Hub doesn't unmount */}
      {isPreviewing && children}

      <div className="fixed inset-0 z-[99999]">
          <IntroComponent config={frozenConfig} onComplete={handleComplete} />

          {/* Skip Button */}
          {frozenConfig.skipDelay > 0 && frozenConfig.skipDelay < frozenConfig.duration && (
            <div style={{ animation: `fadeIn 0.3s ease ${frozenConfig.skipDelay}ms both` }} className="fixed bottom-8 right-8 z-[100000]">
               <button
                  onClick={handleComplete}
                  className="px-4 py-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm text-sm font-medium transition-colors"
               >
                  Skip
               </button>
            </div>
          )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; pointer-events: none; } to { opacity: 1; pointer-events: auto; } }
      `}</style>
    </>
  );
};
