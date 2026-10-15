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

  if (bootstrapState.stage === 'FAILED') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <h2 className="text-2xl font-bold mb-2">Startup Failed</h2>
        <p className="text-sm opacity-70 mb-8 text-center max-w-md">{bootstrapState.error?.message || 'An unknown initialization error occurred.'}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 font-semibold text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all">
          Retry
        </button>
      </div>
    );
  }

  if (bootstrapState.stage === 'MAINTENANCE') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <h2 className="text-2xl font-bold mb-2">Under Maintenance</h2>
        <p className="text-sm opacity-70 mb-8 text-center max-w-md">MindFlow is currently undergoing scheduled maintenance. Please check back soon!</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 font-semibold text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all">
          Refresh
        </button>
      </div>
    );
  }

  if (bootstrapState.stage === 'UPDATE_REQUIRED') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <h2 className="text-2xl font-bold mb-2">Update Required</h2>
        <p className="text-sm opacity-70 mb-8 text-center max-w-md">Your app version is no longer supported. Please update to the latest version to continue using MindFlow.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 font-semibold text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all">
          Update Now
        </button>
      </div>
    );
  }

  if (!bootstrapState.isReady && bootstrapState.stage !== 'OFFLINE_INITIALIZATION') {
    // Show a blank screen while initializing to prevent flash.
    return <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950" />;
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
