import React, { useEffect, useState, ComponentType } from 'react';
import { useAppConfigStore } from '@/stores/useAppConfigStore';
import { getIntroModule } from './registry';
import { IntroProps } from './registry/types';

export const IntroEngine: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config, initialize, previewConfig, previewNonce, clearPreview } = useAppConfigStore();
  const [hasPlayed, setHasPlayed] = useState(false);
  const [IntroComponent, setIntroComponent] = useState<ComponentType<IntroProps> | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Determine which config is currently active
  const activeIntroConfig = previewConfig || config.intro;

  // Initialize and check session on mount
  useEffect(() => {
    initialize();

    const sessionKey = 'mindflow_intro_played_v2';
    if (sessionStorage.getItem(sessionKey)) {
      setHasPlayed(true);
      return;
    }

    if (!activeIntroConfig.enabled) {
      sessionStorage.setItem(sessionKey, 'true');
      setHasPlayed(true);
      return;
    }

    // Mount the component
    let isMounted = true;
    const activeModule = getIntroModule(activeIntroConfig.active);

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
  }, []); // Run once on mount

  // Watch for preview nonce changes to trigger preview mode
  useEffect(() => {
    if (previewNonce > 0 && previewConfig) {
      setIsPreviewing(true);
      setIntroComponent(null); // Reset component to force re-mount

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

  const handleComplete = () => {
    if (isPreviewing) {
        setIsPreviewing(false);
        clearPreview();
    } else {
        sessionStorage.setItem('mindflow_intro_played_v2', 'true');
        setHasPlayed(true);
    }
  };

  const handleSkip = () => {
     handleComplete();
  };

  // When previewing, we render the children (app) underneath,
  // and the intro as a full screen overlay.
  // When NOT previewing and already played, just render the app.
  if (hasPlayed && !isPreviewing) {
    return <>{children}</>;
  }

  // Not played yet, or currently previewing but component not loaded
  if (!IntroComponent) {
     return <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[9999]" />;
  }

  return (
    <>
      {/* If previewing, keep the app running underneath so Admin Hub doesn't unmount */}
      {isPreviewing && children}

      <div className="fixed inset-0 z-[99999]">
          <IntroComponent config={activeIntroConfig} onComplete={handleComplete} />

          {/* Skip Button */}
          {activeIntroConfig.skipDelay > 0 && activeIntroConfig.skipDelay < activeIntroConfig.duration && (
            <div style={{ animation: `fadeIn 0.3s ease ${activeIntroConfig.skipDelay}ms both` }} className="fixed bottom-8 right-8 z-[100000]">
               <button
                  onClick={handleSkip}
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
