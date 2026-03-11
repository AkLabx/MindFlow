const fs = require('fs');

let hookFile = 'src/features/quiz/hooks/useQuiz.ts';
let hookCode = fs.readFileSync(hookFile, 'utf8');

// When submitSessionResults is called, it should also add to queue
hookCode = hookCode.replace(
  /import \{ useCallback \} from 'react';/,
  `import { useCallback } from 'react';\nimport { useSyncStore } from '../stores/useSyncStore';`
);

const logEventBlock = `logEvent('quiz_completed', {
      score: results.score,
      total_questions: state.activeQuestions.length,
      mode: state.mode
    });`;

const newLogEventBlock = `logEvent('quiz_completed', {
      score: results.score,
      total_questions: state.activeQuestions.length,
      mode: state.mode
    });

    // Create history record
    const historyRecord = {
      id: crypto.randomUUID(),
      date: Date.now(),
      score: results.score,
      totalQuestions: state.activeQuestions.length,
      mode: state.mode,
      filters: state.filters || {} as any
    };

    // Add to sync queue for reliable offline submission
    useSyncStore.getState().addEvent({
      type: 'quiz_completed',
      payload: { history: historyRecord, attempts: [] }
    });`;

hookCode = hookCode.replace(logEventBlock, newLogEventBlock);
fs.writeFileSync(hookFile, hookCode);
