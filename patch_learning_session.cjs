const fs = require('fs');
const targetPath = 'src/features/quiz/learning/LearningSession.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// First replace the old haptic feedback logic that happens AFTER state update.
// We remove the navigator.vibrate calls from inside if(option === currentQuestion.correct) blocks
content = content.replace(/if\s*\(isHapticEnabled\s*&&\s*'vibrate'\s*in\s*navigator\)\s*\{\s*navigator\.vibrate\(50\);\s*\}/g, '');

// Now we inject it at the top of handleAnswerSelect
content = content.replace(
    /const handleAnswerSelect = \(option: string\) => \{\s*if \(isAnswered\) return;/,
    "const handleAnswerSelect = (option: string) => {\n        if (isAnswered) return;\n        if (isHapticEnabled && window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);"
);

// We should also replace it in handleTimeUp just to be safe
content = content.replace(
    /if\s*\(isHapticEnabled\s*&&\s*'vibrate'\s*in\s*navigator\)\s*\{\s*navigator\.vibrate\(50\);\s*\}/,
    "if (isHapticEnabled && window.navigator && window.navigator.vibrate) {\n            window.navigator.vibrate(50);\n        }"
);

fs.writeFileSync(targetPath, content);
console.log('LearningSession patched!');
