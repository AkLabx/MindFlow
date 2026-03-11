const fs = require('fs');

let reviewFile = 'src/features/quiz/components/QuizReview.tsx';
let reviewCode = fs.readFileSync(reviewFile, 'utf8');

reviewCode = reviewCode.replace(
  /import \{ useQuizContext \} from '\.\.\/context\/QuizContext';/,
  `import { useQuizContext } from '../context/QuizContext';\nimport { quizEngine } from '../engine';`
);

const isCorrectBlock = `const isCorrect = currentQuestion && currentAns === currentQuestion.correct;`;
const newIsCorrectBlock = `const isCorrect = currentQuestion && currentAns && quizEngine.getPlugin('mcq').validateAnswer(currentQuestion, currentAns);`;

reviewCode = reviewCode.replace(isCorrectBlock, newIsCorrectBlock);

fs.writeFileSync(reviewFile, reviewCode);
