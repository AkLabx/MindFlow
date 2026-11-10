import React, { useEffect, useState, ComponentType, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { useAppConfigStore, IntroConfig } from '../../stores/useAppConfigStore';
import { getIntroModule } from './registry';
import { IntroProps } from './registry/types';

interface IntroEngineProps {
  children: React.ReactNode;
  isBootstrapReady?: boolean;
}

export const IntroEngine: React.FC<IntroEngineProps> = ({
  children,
  isBootstrapReady = true,
}) => {
  const { config, initialize, previewConfig, previewNonce, clearPreview } = useAppConfigStore();
  const [hasPlayed, setHasPlayed] = useState(false);
  const [IntroComponent, setIntroComponent] = useState<ComponentType<IntroProps> | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [moduleCompleted, setModuleCompleted] = useState(false);

  // State for freezing the config during playback so live updates don't reset it
  const [frozenConfig, setFrozenConfig] = useState<IntroConfig | null>(null);

  // Idempotency ref to ensure completion only runs once
  const completedRef = useRef(false);

  // Hand off smoothly from native OS splash screen once Frame 0 paints
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const rafId = requestAnimationFrame(() => {
      SplashScreen.hide().catch((err) => {
        console.warn('[IntroEngine] SplashScreen.hide warning:', err);
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Initialize and check session on mount
  useEffect(() => {
    initialize();

    const sessionKey = 'mindflow_intro_played_v2';
    if (sessionStorage.getItem(sessionKey) || sessionStorage.getItem('mindflow_booted') === 'true' || window.location.hash.includes('access_token=')) {
      setHasPlayed(true);
      sessionStorage.setItem('mindflow_booted', 'true');
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
    setModuleCompleted(false);
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
    if (previewNonce > 0 && previewConfig && previewConfig.intro) {
      setIsPreviewing(true);
      setModuleCompleted(false);
      setIntroComponent(null); // Reset component to force re-mount
      setFrozenConfig(previewConfig.intro); // Freeze the preview config
      completedRef.current = false;

      let isMounted = true;
      const activeModule = getIntroModule(previewConfig.intro.active);

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
  const finalizeIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    if (isPreviewing) {
        setIsPreviewing(false);
        clearPreview();
        setFrozenConfig(null);
    } else {
        sessionStorage.setItem('mindflow_intro_played_v2', 'true');
        sessionStorage.setItem('mindflow_booted', 'true');
        setHasPlayed(true);
        setFrozenConfig(null);
    }
  }, [isPreviewing, clearPreview]);

  // Signal from active intro animation (or skip tap) that playback met its duration
  const handleModuleComplete = useCallback(() => {
    setModuleCompleted(true);
  }, []);

  // Finish intro only after BOTH minimum playback duration AND bootstrap readiness (Option B)
  useEffect(() => {
    if (!moduleCompleted) return;
    if (isPreviewing || isBootstrapReady) {
      finalizeIntro();
    }
  }, [moduleCompleted, isPreviewing, isBootstrapReady, finalizeIntro]);

  // Watchdog Timer:
  // Starts when a component actually mounts to render the intro.
  // Capped at 8000ms so stalled intro or bootstrap never blocks entry.
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
      setModuleCompleted(true);
      if (isPreviewing || isBootstrapReady) {
        finalizeIntro();
      }
    }, watchdogDuration);

    return () => clearTimeout(watchdogTimer);
  }, [IntroComponent, frozenConfig, isPreviewing, isBootstrapReady, finalizeIntro]);

  // When NOT previewing and already played:
  // Render app once bootstrapReady (prevents premature HashRouter mount during OAuth exchange).
  if (hasPlayed && !isPreviewing) {
    if (!isBootstrapReady) {
      return <div aria-hidden="true" className="fixed inset-0 bg-slate-50 dark:bg-slate-950" />;
    }
    return <>{children}</>;
  }

  // Not played yet, or currently previewing while async chunk loads
  if (!IntroComponent || !frozenConfig) {
     return (
       <>
         {children}
         <div aria-hidden="true" className="fixed inset-0 bg-slate-950 z-[9999]" />
       </>
     );
  }

  return (
    <>
      {/* Mounts children seamlessly underneath once bootstrap is ready (HashRouter stays deferred until ready) */}
      {children}

      <div className="fixed inset-0 z-[99999]">
          {/* Keep seamless opaque canvas beneath vanishing/exiting intro animations while bootstrap runs */}
          {!isBootstrapReady && !isPreviewing && (
            <div aria-hidden="true" className="fixed inset-0 bg-slate-950 -z-10" />
          )}

          <IntroComponent config={frozenConfig} onComplete={handleModuleComplete} />

          {/* Keep seamless opaque canvas if animation finished slightly before background bootstrap */}
          {moduleCompleted && !isBootstrapReady && !isPreviewing && (
            <div aria-hidden="true" className="fixed inset-0 bg-slate-950 z-[99998]" />
          )}

          {/* Skip Button */}
          {frozenConfig.skipDelay > 0 && frozenConfig.skipDelay < frozenConfig.duration && (
            <div style={{ animation: `fadeIn 0.3s ease ${frozenConfig.skipDelay}ms both` }} className="fixed bottom-8 right-8 z-[100000]">
               <button
                  type="button"
                  onClick={handleModuleComplete}
                  aria-label="Skip intro"
                  className="min-w-[44px] min-h-[44px] px-4 py-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm text-sm font-medium transition-colors"
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
