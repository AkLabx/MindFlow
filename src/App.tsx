
import React from 'react';
import { AppProvider } from './providers/AppProvider';
import { QuizContainer } from './features/quiz/QuizContainer';

const App: React.FC = () => {
  return (
    <AppProvider>
      <QuizContainer />
    </AppProvider>
  );
};

export default App;
