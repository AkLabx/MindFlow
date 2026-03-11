const fs = require('fs');
const file = 'src/features/quiz/learning/LearningSession.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const navigate = useNavigate\(\);/,
  `const navigate = useNavigate();\n    const analyticsStore = useAnalyticsStore();\n    const bookmarkStore = useBookmarkStore();`
);

// Remove the `score` and `timeTaken` local references in onComplete since they belong to the store now.
const finishBlock = /        onComplete\(\{\s*\n\s*answers,\s*\n\s*score\s*\n\s*\}\);/;
const newFinishBlock = `        onComplete({ answers, score: analyticsStore.score });`;
code = code.replace(finishBlock, newFinishBlock);

fs.writeFileSync(file, code);
