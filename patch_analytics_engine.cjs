const fs = require('fs');

// We want LearningSession and MockSession to use the quiz engine to validate answers.
// MockSession
let mockFile = 'src/features/quiz/mock/MockSession.tsx';
let mockCode = fs.readFileSync(mockFile, 'utf8');

// Inject engine import
mockCode = mockCode.replace(
  /import \{ useBookmarkStore \} from '\.\.\/stores\/useBookmarkStore';/,
  `import { useBookmarkStore } from '../stores/useBookmarkStore';\nimport { quizEngine } from '../engine';`
);

const mockAnswerBlock = `const isCorrect = option === question.correct;`;
const newMockAnswerBlock = `const isCorrect = quizEngine.getPlugin('mcq').validateAnswer(question, option);`;
mockCode = mockCode.replace(mockAnswerBlock, newMockAnswerBlock);

fs.writeFileSync(mockFile, mockCode);

// LearningSession
let learningFile = 'src/features/quiz/learning/LearningSession.tsx';
let learningCode = fs.readFileSync(learningFile, 'utf8');

learningCode = learningCode.replace(
  /import \{ useBookmarkStore \} from '\.\.\/stores\/useBookmarkStore';/,
  `import { useBookmarkStore } from '../stores/useBookmarkStore';\nimport { quizEngine } from '../engine';`
);

const learningAnswerBlock = `const isCorrect = option === currentQuestion.correct;`;
const newLearningAnswerBlock = `const isCorrect = quizEngine.getPlugin('mcq').validateAnswer(currentQuestion, option);`;
learningCode = learningCode.replace(learningAnswerBlock, newLearningAnswerBlock);

fs.writeFileSync(learningFile, learningCode);

// We should also replace the hardcoded NEXT_QUESTION logic in quizReducer using the engine
// But the reducer doesn't have access to the whole array unless we pass it. It has `state.activeQuestions`.
// Let's modify the NEXT_QUESTION action inside useQuiz to rely on the engine? Or keep it simple inside the reducer.
let reducerFile = 'src/features/quiz/stores/quizReducer.ts';
let reducerCode = fs.readFileSync(reducerFile, 'utf8');

reducerCode = reducerCode.replace(
  /const nextIndex = state\.currentQuestionIndex \+ 1;/,
  `// In a fully decoupled state, we'd use quizEngine.getPlugin(state.type).getNextQuestionIndex(...)
      // But we maintain the linear index for now since the reducer state holds MCQ standard flow.
      const nextIndex = state.currentQuestionIndex + 1;`
);

fs.writeFileSync(reducerFile, reducerCode);
