import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { AppProvider } from './providers/AppProvider';
import { AppRoutes } from './routes/AppRoutes';
import { useAppBootstrap } from './hooks/useAppBootstrap';
import { PWAUpdateManager } from './components/common/PWAUpdateManager';
import { PresenceProvider } from './providers/PresenceProvider';
import { useAppVisibilityReawakening } from './hooks/useAppVisibilityReawakening';
import { IntroEngine } from './features/intro/IntroEngine';
import { VersionBanner } from './components/common/VersionBanner';
import { RecoveryBanner } from './components/common/RecoveryBanner';
import { ErrorBoundary } from './providers/ErrorBoundary';

const AppVisibilityWrapper = () => {
  useAppVisibilityReawakening();
  return null;
};

const BOOTSTRAP_WATCHDOG_MS = 8000;

const App: React.FC = () => {
  const bootstrapState = useAppBootstrap();
  const [watchdogTimedOut, setWatchdogTimedOut] = useState(false);

  const isTerminalStage =
    bootstrapState.stage === 'FAILED' ||
    bootstrapState.stage === 'MAINTENANCE' ||
    bootstrapState.stage === 'UPDATE_REQUIRED';

  const isRouterReady =
    bootstrapState.isReady ||
    bootstrapState.stage === 'OFFLINE_INITIALIZATION' ||
    watchdogTimedOut;

  // 8-second maximum watchdog timer (ADR-0005 / Option B): guarantees stalled bootstrap never traps the user
  useEffect(() => {
    if (isRouterReady || isTerminalStage) return;

    const timer = setTimeout(() => {
      console.warn(`[App] Bootstrap watchdog expired after ${BOOTSTRAP_WATCHDOG_MS}ms; mounting router for recovery.`);
      setWatchdogTimedOut(true);
    }, BOOTSTRAP_WATCHDOG_MS);

    return () => clearTimeout(timer);
  }, [isRouterReady, isTerminalStage]);

  // Ensure native Android SplashScreen never blocks terminal diagnostic views
  useEffect(() => {
    if (isTerminalStage && Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch(() => {});
    }
  }, [isTerminalStage]);

  if (bootstrapState.stage === 'FAILED') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <h2 className="text-2xl font-bold mb-2">Startup Failed</h2>
        <p className="text-sm opacity-70 mb-8 text-center max-w-md">{bootstrapState.error?.message || 'An unknown initialization error occurred.'}</p>
        <button onClick={() => window.location.reload()} className="min-h-[44px] px-6 py-3 bg-indigo-600 font-semibold text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all">
          Retry
        </button>
      </div>
    );
  }

  if (bootstrapState.stage === 'MAINTENANCE') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <h2 className="text-2xl font-bold mb-2">Under Maintenance</h2>
        <p className="text-sm opacity-70 mb-8 text-center max-w-md">MindFlow is currently undergoing scheduled maintenance. Please check back soon!</p>
        <button onClick={() => window.location.reload()} className="min-h-[44px] px-6 py-3 bg-indigo-600 font-semibold text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all">
          Refresh
        </button>
      </div>
    );
  }

  if (bootstrapState.stage === 'UPDATE_REQUIRED') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <h2 className="text-2xl font-bold mb-2">Update Required</h2>
        <p className="text-sm opacity-70 mb-8 text-center max-w-md">Your app version is no longer supported. Please update to the latest version to continue using MindFlow.</p>
        <button onClick={() => window.location.reload()} className="min-h-[44px] px-6 py-3 bg-indigo-600 font-semibold text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all">
          Update Now
        </button>
      </div>
    );
  }

  // Option B (ADR-0005): Render IntroEngine immediately on Frame 0 with zero loader flash;
  // defer HashRouter until useAppBootstrap completes OAuth hash extraction + session hydration (or 8s watchdog).
  return (
    <ErrorBoundary>
      <IntroEngine isBootstrapReady={isRouterReady}>
        {isRouterReady ? (
          <HashRouter>
            <AppProvider>
              <AppVisibilityWrapper />
              <PresenceProvider>
                <PWAUpdateManager />
                <VersionBanner />
                <RecoveryBanner />
                <AppRoutes />
              </PresenceProvider>
            </AppProvider>
          </HashRouter>
        ) : null}
      </IntroEngine>
    </ErrorBoundary>
  );
};

export default App;
