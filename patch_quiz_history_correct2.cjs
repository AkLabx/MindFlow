const fs = require('fs');
let hookFile = 'src/features/quiz/hooks/useQuiz.ts';
let code = fs.readFileSync(hookFile, 'utf8');

code = code.replace(
  /import \{ useReducer, useCallback, useEffect, useState \} from 'react';/,
  `import { useReducer, useCallback, useEffect, useState } from 'react';\nimport { useSyncStore } from '../stores/useSyncStore';\nimport { useAnalyticsStore } from '../stores/useAnalyticsStore';`
);

fs.writeFileSync(hookFile, code);
