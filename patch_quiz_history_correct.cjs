const fs = require('fs');
let hookFile = 'src/features/quiz/hooks/useQuiz.ts';
let code = fs.readFileSync(hookFile, 'utf8');

code = code.replace(
  /import \{ useCallback \} from 'react';/,
  `import { useCallback } from 'react';\nimport { useSyncStore } from '../stores/useSyncStore';\nimport { useAnalyticsStore } from '../stores/useAnalyticsStore';`
);

code = code.replace(
  /db\.saveQuizHistory\(historyRecord\)\.catch\(err => console\.error\("Failed to save quiz history", err\)\);/,
  `db.saveQuizHistory(historyRecord).catch(err => console.error("Failed to save quiz history", err));

    useSyncStore.getState().addEvent({
      type: 'quiz_completed',
      payload: { history: historyRecord, attempts: [] }
    });`
);

// We need to fix the time references. It loops over state.activeQuestions
const regex = /const time = results\.timeTaken\[q\.id\] \|\| 0;/g;
code = code.replace(regex, `const time = useAnalyticsStore.getState().timeTaken[q.id] || 0;`);

fs.writeFileSync(hookFile, code);
