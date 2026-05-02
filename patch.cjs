const fs = require('fs');
const file = 'src/features/quiz/stores/useQuizSessionStore.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Add `reorderActiveQuestions` to the interface
code = code.replace(
  'loadSavedQuiz: (savedState: QuizState) => void;',
  'loadSavedQuiz: (savedState: QuizState) => void;\n  reorderActiveQuestions: (newOrder: Question[]) => void;'
);

// 2. Add implementation
code = code.replace(
  '  loadSavedQuiz: (savedState) => set((state) => {',
  `  reorderActiveQuestions: (newOrder) => set((state) => {
    const currentQuestion = state.activeQuestions[state.currentQuestionIndex];
    let newIndex = state.currentQuestionIndex;

    if (currentQuestion) {
      const foundIndex = newOrder.findIndex(q => q.id === currentQuestion.id);
      if (foundIndex !== -1) {
        newIndex = foundIndex;
      }
    }

    return {
      activeQuestions: newOrder,
      currentQuestionIndex: newIndex
    };
  }),\n\n  loadSavedQuiz: (savedState) => set((state) => {`
);

fs.writeFileSync(file, code);
console.log('patched store');
