const fs = require('fs');
const file = 'src/features/quiz/learning/LearningSession.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /import \{ useNavigate \} from 'react-router-dom';/,
  `import { useNavigate } from 'react-router-dom';\nimport { useAnalyticsStore } from '../stores/useAnalyticsStore';\nimport { useBookmarkStore } from '../stores/useBookmarkStore';`
);

fs.writeFileSync(file, code);
