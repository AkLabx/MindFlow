const fs = require('fs');
let content = fs.readFileSync('src/features/quiz/components/Dashboard.tsx', 'utf8');

// Change navigate('/blueprints') to navigate('/quiz/config')
// (Optionally we could pass state to auto-select god mode, but user can just click God Mode tab since it's the 3rd mode now. Wait, I should try to pass state if possible).
// Since QuizConfig.tsx uses a simple local state `const [mode, setMode] = useState<QuizMode>('learning');`, we can't easily set it via route without modifying QuizConfig to read from location.state.
// Let's modify QuizConfig to read from location.state.mode

content = content.replace(
  `onClick={() => handleNavigation('card-godmode', () => navigate('/blueprints'))}`,
  `onClick={() => handleNavigation('card-godmode', () => navigate('/quiz/config', { state: { initialMode: 'god' } }))}`
);

fs.writeFileSync('src/features/quiz/components/Dashboard.tsx', content);

let qc = fs.readFileSync('src/features/quiz/components/QuizConfig.tsx', 'utf8');

// Also update QuizConfig to use location state
qc = qc.replace(
  `import { useNavigate } from 'react-router-dom';`,
  `import { useNavigate, useLocation } from 'react-router-dom';`
);

qc = qc.replace(
  `const navigate = useNavigate();`,
  `const navigate = useNavigate();\n  const location = useLocation();`
);

qc = qc.replace(
  `const [mode, setMode] = useState<QuizMode>('learning');`,
  `const [mode, setMode] = useState<QuizMode>((location.state as any)?.initialMode || 'learning');`
);

fs.writeFileSync('src/features/quiz/components/QuizConfig.tsx', qc);
