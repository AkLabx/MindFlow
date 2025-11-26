
import React from 'react';
import { AppProvider } from './providers/AppProvider';
import { QuizContainer } from './features/quiz/QuizContainer';
import AuthGuard from './features/auth/AuthGuard';

const App: React.FC = () => {
  return (
    <AppProvider>
      <AuthGuard>
        <QuizContainer />
      </AuthGuard>
    </AppProvider>
  );
};

export default App;
