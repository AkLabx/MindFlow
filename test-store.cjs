const fs = require('fs');
const content = fs.readFileSync('src/features/quiz/stores/useQuizSessionStore.ts', 'utf8');
if (content.includes('reorderActiveQuestions')) {
  console.log('Successfully found reorderActiveQuestions');
} else {
  console.log('Failed to find reorderActiveQuestions');
}
