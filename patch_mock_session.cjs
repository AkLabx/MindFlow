const fs = require('fs');

const targetPath = 'src/features/quiz/mock/MockSession.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add context imports if they don't exist
if (!content.includes('SettingsContext')) {
    content = content.replace(
        "import { ActiveQuizLayout } from '../layouts/ActiveQuizLayout';",
        "import { ActiveQuizLayout } from '../layouts/ActiveQuizLayout';\nimport { SettingsContext } from '../../../context/SettingsContext';\nimport { SettingsContextType } from '../types';"
    );
    // If we missed because the line wasn't exactly right, fallback to top of file imports:
    if (!content.includes('SettingsContext')) {
       content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef, useContext } from 'react';\nimport { SettingsContext } from '../../../context/SettingsContext';\nimport { SettingsContextType } from '../types';");
    }
}

// Ensure useContext is imported
if (!content.includes('useContext')) {
     content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef, useContext } from 'react';");
}

// 2. Add isHapticEnabled to the component
if (!content.includes('const { isHapticEnabled }')) {
    content = content.replace(
        "const attemptedCount = Object.keys(answers).length;",
        "const { isHapticEnabled } = useContext(SettingsContext) as SettingsContextType;\n\n    const attemptedCount = Object.keys(answers).length;"
    );
}

// 3. Add vibration to handleAnswer
if (!content.includes('navigator.vibrate')) {
    content = content.replace(
        "setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: option }));",
        "if (isHapticEnabled && 'vibrate' in navigator) navigator.vibrate(50);\n        setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: option }));"
    );
}

fs.writeFileSync(targetPath, content);
console.log('MockSession patched!');
