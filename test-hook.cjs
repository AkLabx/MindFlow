const fs = require('fs');
const content = fs.readFileSync('src/features/quiz/hooks/useQuiz.ts', 'utf8');
if (content.includes('reorderActiveQuestions')) {
  console.log('Successfully found reorderActiveQuestions in hook');
} else {
  console.log('Failed to find reorderActiveQuestions in hook');
}
