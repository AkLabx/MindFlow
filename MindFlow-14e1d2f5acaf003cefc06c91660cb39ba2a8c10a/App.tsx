import React from 'react';
import { AppProvider } from './providers/AppProvider';
import { MainLayout } from './layouts/MainLayout';
import { QuizContainer } from './features/quiz/QuizContainer';

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout>
        <QuizContainer />
      </MainLayout>
    </AppProvider>
  );
};

export default App;