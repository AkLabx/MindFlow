import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppProvider } from './providers/AppProvider';
import { AppRoutes } from './routes/AppRoutes';
import { supabase } from './lib/supabase';

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
    // Show a loading spinner while Supabase initializes
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
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
