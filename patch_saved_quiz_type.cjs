const fs = require('fs');
const file = 'src/features/quiz/types/index.ts';
let code = fs.readFileSync(file, 'utf8');

// Since we moved score and timeTaken out of QuizState, old saved quizzes will still have them in their state object,
// or we can type them explicitly on SavedQuiz to not break old db records
const regex = /\/\*\* The current progress state of the quiz\. \*\/\s*\n\s*state: QuizState;\s*\n\}/;
code = code.replace(regex, `/** The current progress state of the quiz. */
  state: QuizState & { score?: number, timeTaken?: Record<string, number>, bookmarks?: string[] };
}`);

fs.writeFileSync(file, code);
