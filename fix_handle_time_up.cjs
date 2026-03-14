const fs = require('fs');
const targetPath = 'src/features/quiz/learning/LearningSession.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

content = content.replace(
    /onAnswer\(currentQuestion\.id, 'TIME_UP', 0\);\s*playWrong\(\);\s*\}, \[currentQuestion\.id, playWrong, onAnswer, isHapticEnabled\]\);/g,
    "if (isHapticEnabled && window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);\n        onAnswer(currentQuestion.id, 'TIME_UP', 0);\n        playWrong();\n    }, [currentQuestion.id, playWrong, onAnswer, isHapticEnabled]);"
);

fs.writeFileSync(targetPath, content);
console.log('Fixed handleTimeUp in LearningSession');
