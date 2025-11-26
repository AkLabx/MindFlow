import React, { useState } from 'react';
import { AppProvider } from './providers/AppProvider';
import { MainLayout, TabID } from './layouts/MainLayout';
import { QuizContainer } from './features/quiz/QuizContainer';
import { AuthPage } from './features/auth';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './features/quiz/components/LandingPage';
import { signOut } from './lib/auth';
import { Spinner } from './components/ui/Spinner';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabID>('home');
  const [isAuthPage, setIsAuthPage] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  // If user is not logged in and we should show the auth page
  if (!user && isAuthPage) {
    return <AuthPage />;
  }

  // If user becomes available, no longer show auth page
  React.useEffect(() => {
    if (user) {
      setIsAuthPage(false);
    }
  }, [user]);


  return (
    <MainLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLoginClick={() => setIsAuthPage(true)}
    >
      {user ? (
        activeTab === 'profile' ? (
          // This is a temporary location for the ProfilePage
          // It should be moved to a proper features/profile directory
          <div className="p-4">
            <h1 className="text-2xl font-bold">Profile</h1>
            <p>Email: {user?.email}</p>
            <button
              onClick={signOut}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <QuizContainer />
        )
      ) : (
        <LandingPage onGetStarted={() => setIsAuthPage(true)} />
      )}
    </MainLayout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
