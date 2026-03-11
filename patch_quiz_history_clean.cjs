const fs = require('fs');
let hookFile = 'src/features/quiz/hooks/useQuiz.ts';
let code = fs.readFileSync(hookFile, 'utf8');

if (!code.includes("import { useSyncStore }")) {
  code = code.replace(
    /import \{ useCallback \} from 'react';/,
    `import { useCallback } from 'react';\nimport { useSyncStore } from '../stores/useSyncStore';\nimport { useAnalyticsStore } from '../stores/useAnalyticsStore';`
  );
}

// We only want to replace the FIRST occurrence or exact string
const timeSearch = /const time = results\.timeTaken\[q\.id\] \|\| 0;/g;
code = code.replace(timeSearch, `const time = useAnalyticsStore.getState().timeTaken[q.id] || 0;`);

const saveSearch = /db\.saveQuizHistory\(historyRecord\)\.catch\(err => console\.error\("Failed to save quiz history", err\)\);/g;
code = code.replace(saveSearch, `db.saveQuizHistory(historyRecord).catch(err => console.error("Failed to save quiz history", err));
    useSyncStore.getState().addEvent({
      type: 'quiz_completed',
      payload: { history: historyRecord, attempts: [] }
    });`);

fs.writeFileSync(hookFile, code);
