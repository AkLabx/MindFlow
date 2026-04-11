const fs = require('fs');
let content = fs.readFileSync('src/features/quiz/components/BlueprintPreviewWrapper.tsx', 'utf8');

content = content.replace(
  `// Mode is mock because God Mode Blueprints simulate real strict exams
    startQuiz(questions, { subject: [], topic: [], subTopic: [], difficulty: [], isGodMode: true } as any, 'mock');
    navigate('/quiz');`,
  `// Launching in native God Mode for strict exam simulation
    startQuiz(questions, { subject: [], topic: [], subTopic: [], difficulty: [], isGodMode: true } as any, 'god');
    navigate('/quiz/session/god');`
);

// We should also change fallback from /blueprints to /quiz/config
content = content.replace(
  `navigate('/blueprints');`,
  `navigate('/quiz/config');`
);
content = content.replace(
  `onBack={() => navigate('/blueprints')}`,
  `onBack={() => navigate('/quiz/config')}`
);

fs.writeFileSync('src/features/quiz/components/BlueprintPreviewWrapper.tsx', content);
