import { useNotificationStore } from './stores/useNotificationStore';
import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppProvider } from './providers/AppProvider';
import { AppRoutes } from './routes/AppRoutes';
import { useAppBootstrap } from './hooks/useAppBootstrap';
import { supabase } from './lib/supabase';
import { SynapticLoader } from './components/ui/SynapticLoader';
import { PWAUpdateManager } from './components/common/PWAUpdateManager';
import { PresenceProvider } from './providers/PresenceProvider';
import { useAppVisibilityReawakening } from './hooks/useAppVisibilityReawakening';
import { IntroEngine } from './features/intro/IntroEngine';
import { VersionBanner } from './components/common/VersionBanner';
import { ErrorBoundary } from './providers/ErrorBoundary';

const AppVisibilityWrapper = () => {
  useAppVisibilityReawakening();
  return null;
};

const App: React.FC = () => {
  const bootstrapState = useAppBootstrap();

  if (bootstrapState.stage === 'ERROR') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <h2 className="text-xl font-bold mb-2">Startup Failed</h2>
        <p className="text-sm opacity-70 mb-4">{bootstrapState.error?.message || 'An unknown error occurred.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!bootstrapState.isReady) {
    // Show a blank screen while initializing to prevent flash.
    return <div className="h-screen w-screen bg-white dark:bg-slate-900" />;
  }

  return (
    <ErrorBoundary>
      <IntroEngine>
        <HashRouter>
        <AppProvider>
          <AppVisibilityWrapper />
          <PresenceProvider>
            <PWAUpdateManager />
            <VersionBanner />
            <AppRoutes />
          </PresenceProvider>
        </AppProvider>
      </HashRouter>
      </IntroEngine>
    </ErrorBoundary>
  );
};

export default App;
