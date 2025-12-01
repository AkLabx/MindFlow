import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppProvider } from './providers/AppProvider';
import { AppRoutes } from './routes/AppRoutes';
import { supabase } from './lib/supabase'; // Ensure this path is correct

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. App start hote hi Session check karo (Before Router mounts completely)
    const initAuth = async () => {
      // Yeh line URL hash se token nikaal legi agar wo waha hai
      await supabase.auth.getSession();
      
      // Thoda delay taaki Supabase apna kaam kar le
      setIsReady(true);
    };

    initAuth();
  }, []);

  if (!isReady) {
    // Optional: Loading screen jab tak Supabase URL check na kar le
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

