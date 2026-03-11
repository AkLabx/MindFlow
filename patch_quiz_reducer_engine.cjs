const fs = require('fs');
const file = 'src/features/quiz/stores/quizReducer.ts';
let code = fs.readFileSync(file, 'utf8');

// Import engine
code = code.replace(
  /import \{ QuizState, QuizAction \} from '\.\.\/types\/store';/,
  `import { QuizState, QuizAction } from '../types/store';\nimport { quizEngine } from '../engine';`
);

// We didn't finish cleaning up ANSWER_QUESTION in the reducer in the previous step?
// Wait, I did patch it with `const { questionId, answer } = action.payload;`. Let me check.
