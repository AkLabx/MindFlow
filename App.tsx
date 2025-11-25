import React, { useState } from 'react';
import { AppProvider } from './src/providers/AppProvider';
import { MainLayout, TabID } from './src/layouts/MainLayout';
import { QuizContainer } from './src/features/quiz/QuizContainer';
import { AuthPage } from './src/features/auth';
import { useAuth } from './src/context/AuthContext';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabID>('home');

  if (isLoading) {
    // TODO: Replace with a proper loading spinner/component
    return <div>Loading...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <MainLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'profile' ? (
        // This is a temporary location for the ProfilePage
        // It should be moved to a proper features/profile directory
        <div className="p-4">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p>Email: {user?.email}</p>
        </div>
      ) : (
        <QuizContainer />
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
