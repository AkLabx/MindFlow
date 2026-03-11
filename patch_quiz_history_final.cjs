const fs = require('fs');

let hookFile = 'src/features/quiz/hooks/useQuiz.ts';
let hookCode = fs.readFileSync(hookFile, 'utf8');

hookCode = hookCode.replace(
  /import \{ useCallback \} from 'react';/,
  `import { useCallback } from 'react';\nimport { useSyncStore } from '../stores/useSyncStore';\nimport { useAnalyticsStore } from '../stores/useAnalyticsStore';`
);

const saveHistoryBlock = `    // Save history to IndexedDB
    db.saveQuizHistory(historyRecord).catch(err => console.error("Failed to save quiz history", err));`;

const newSaveHistoryBlock = `    // Save history to IndexedDB
    db.saveQuizHistory(historyRecord).catch(err => console.error("Failed to save quiz history", err));

    useSyncStore.getState().addEvent({
      type: 'quiz_completed',
      payload: { history: historyRecord, attempts: [] }
    });`;

hookCode = hookCode.replace(saveHistoryBlock, newSaveHistoryBlock);

hookCode = hookCode.replace(
  /const time = results\.timeTaken\[q\.id\] \|\| 0;/,
  `const time = useAnalyticsStore.getState().timeTaken[q.id] || 0;`
);

fs.writeFileSync(hookFile, hookCode);
