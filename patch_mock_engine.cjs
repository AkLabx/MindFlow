const fs = require('fs');

let mockFile = 'src/features/quiz/mock/MockSession.tsx';
let mockCode = fs.readFileSync(mockFile, 'utf8');

// The original mock logic just stored the answer. Validation happened on complete.
// Wait, I updated it in Phase 2 to: `const isCorrect = option === question.correct; analyticsStore.answerQuestion(...)`
// Let's see exactly what's there now.
