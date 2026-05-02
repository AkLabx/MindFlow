const fs = require('fs');
const file = 'src/features/quiz/hooks/useQuiz.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'loadSavedQuiz: state.loadSavedQuiz',
  'loadSavedQuiz: state.loadSavedQuiz,\n    reorderActiveQuestions: state.reorderActiveQuestions'
);

fs.writeFileSync(file, code);
console.log('patched hook');
