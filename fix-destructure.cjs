const fs = require('fs');
const file = 'src/features/quiz/components/QuizNavigationPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'bookmarks, onSubmitAndReview, mode',
  'bookmarks, onSubmitAndReview, mode, onReorderQuestions'
);

fs.writeFileSync(file, code);
