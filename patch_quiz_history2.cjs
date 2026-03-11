const fs = require('fs');

let hookFile = 'src/features/quiz/hooks/useQuiz.ts';
let hookCode = fs.readFileSync(hookFile, 'utf8');

hookCode = hookCode.replace(
  /import \{ useCallback \} from 'react';/,
  `import { useCallback } from 'react';\nimport { useSyncStore } from '../stores/useSyncStore';`
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

// results.timeTaken doesn't exist on results anymore. Wait, the `submitSessionResults` signature changed, but `timeTaken` is in the `useAnalyticsStore`.
// We need to inject useAnalyticsStore inside useQuiz or get it from outside. Let's just grab it inline.
hookCode = hookCode.replace(
  /const time = results\.timeTaken\[q\.id\] \|\| 0;/,
  `const analyticsStore = (await import('../stores/useAnalyticsStore')).useAnalyticsStore.getState();\n      const time = analyticsStore.timeTaken[q.id] || 0;`
);

// We need to fix the async inline import inside the forEach. That won't work cleanly. Let's import the store at the top.
hookCode = hookCode.replace(
  /import \{ useSyncStore \} from '\.\.\/stores\/useSyncStore';/,
  `import { useSyncStore } from '../stores/useSyncStore';\nimport { useAnalyticsStore } from '../stores/useAnalyticsStore';`
);

hookCode = hookCode.replace(
  /const analyticsStore = \(await import\('\.\.\/stores\/useAnalyticsStore'\)\)\.useAnalyticsStore\.getState\(\);\s*\n      const time = analyticsStore\.timeTaken\[q\.id\] \|\| 0;/,
  `const time = useAnalyticsStore.getState().timeTaken[q.id] || 0;`
);

fs.writeFileSync(hookFile, hookCode);
