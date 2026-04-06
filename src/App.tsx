import { useRegisterSW } from 'virtual:pwa-register/react';
import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppProvider } from './providers/AppProvider';
import { AppRoutes } from './routes/AppRoutes';
import { supabase } from './lib/supabase';
import { SynapticLoader } from './components/ui/SynapticLoader';

/**
 * Root Application Component.
 *
 * Responsibilities:
 * 1. Initializes the Supabase authentication session.
 * 2. Sets up the Router (HashRouter for GitHub Pages compatibility).
 * 3. Wraps the app in the global `AppProvider`.
 * 4. Renders the main `AppRoutes`.
 *
 * @returns {JSX.Element} The mounted application.
 */
const App: React.FC = () => {
  // PWA Auto Update Logic
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      // Background logic to handle auto update safely
      const checkAndReload = async () => {
        try {
          const quizStateStr = localStorage.getItem('mindflow-quiz-session');
          if (quizStateStr) {
             const quizState = JSON.parse(quizStateStr);
             if (quizState.status === 'quiz') {
               // We are in middle of quiz, let's pause and save it first
               const { db } = await import('./lib/db');
               const { supabase } = await import('./lib/supabase');
               const { data } = await supabase.auth.getSession();
               if (data.session) {
                 const currentTimer = quizState.quizTimeRemaining;
                 const pausedState = { ...quizState, isPaused: true };
                 localStorage.setItem('mindflow-quiz-session', JSON.stringify(pausedState));
                 await db.saveActiveSession(data.session.user.id, pausedState);
               }
             }
          }
        } catch (e) {
          console.error('Failed to parse or save quiz state before update:', e);
        } finally {
          // Perform the actual update and reload
          updateServiceWorker(true);
        }
      };

      checkAndReload();
    },
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Check for active session on app mount (Before Router mounts completely)
    const initAuth = async () => {
      // getSession() parses the URL hash for tokens if present (OAuth redirect)
      await supabase.auth.getSession();
      
      // Set ready state to render the router
      setIsReady(true);
    };

    initAuth();
  }, []);

  if (!isReady) {
    // Show a loading spinner while Supabase initializes, UNLESS we are on the entry page
    // where the CinematicIntro will handle the initial visual experience.
    const isEntryPage = window.location.hash === '' || window.location.hash === '#/';
    if (isEntryPage) {
      return <div className="h-screen w-screen bg-white dark:bg-slate-900" />;
    }
    return <div className="h-screen flex items-center justify-center"><SynapticLoader size="xl" /></div>;
  }

  return (
    <HashRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </HashRouter>
  );
};

export default App;
