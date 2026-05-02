const fs = require('fs');

const sessions = [
  'src/features/quiz/mock/MockSession.tsx',
  'src/features/quiz/mock/GodModeSession.tsx',
  'src/features/quiz/learning/LearningSession.tsx'
];

for (const file of sessions) {
  let code = fs.readFileSync(file, 'utf8');

  if (!code.includes('onReorderQuestions')) {
    // Add useQuizSessionStore import if it doesn't exist
    if (!code.includes('useQuizSessionStore')) {
      code = "import { useQuizSessionStore } from '../stores/useQuizSessionStore';\n" + code;
    }

    // Add the store hook inside the component
    code = code.replace(
      '    const [isNavOpen, setIsNavOpen] = useState(false);',
      '    const [isNavOpen, setIsNavOpen] = useState(false);\n    const reorderActiveQuestions = useQuizSessionStore(s => s.reorderActiveQuestions);'
    );

    // Pass it to QuizNavigationPanel
    code = code.replace(
      'mode="mock"',
      'mode="mock"\n                            onReorderQuestions={reorderActiveQuestions}'
    ).replace(
      "mode='learning'",
      "mode='learning'\n                onReorderQuestions={reorderActiveQuestions}"
    );

    fs.writeFileSync(file, code);
    console.log(`Patched ${file}`);
  }
}
