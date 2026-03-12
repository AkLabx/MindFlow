const fs = require('fs');
const path = require('path');

const mockPath = path.join(__dirname, 'src', 'features', 'quiz', 'mock', 'MockSession.tsx');
let content = fs.readFileSync(mockPath, 'utf8');

// Ensure correct imports
if (!content.includes('useAutoSave')) {
    content = content.replace(
        "import { useMockTimer } from '../hooks/useMockTimer';",
        "import { useMockTimer } from '../hooks/useMockTimer';\nimport { useAutoSave } from '../hooks/useAutoSave';\nimport { useAntiCheat } from '../hooks/useAntiCheat';"
    );
}

// Ensure Web Worker Timer, Auto-Save and Anti-Cheat initialization
if (!content.includes('const { clearSavedSession }')) {
    const hooksToInject = `
    // ENTERPRISE: Web Worker Timer (Replaces standard hook)
    const { timeLeft, formatTime } = useMockTimer({
        totalTime: totalExamTime,
        onTimeUp: () => finishSession()
    });

    // ENTERPRISE: Offline Auto-Save (IndexedDB Resilience)
    const { clearSavedSession } = useAutoSave({
        sessionId: 'mock_test_active',
        state: { answers, currentIndex, markedForReview, timeSpentPerQuestion }
    });

    // ENTERPRISE: Anti-Cheating System (Visibility change detection)
    useAntiCheat({
        isEnabled: true,
        maxViolations: 3,
        onViolation: (count) => {
            alert(\`⚠️ Warning! Tab switching or minimizing is not allowed during Mock Test. Violation \${count}/3\`);
        },
        onMaxViolationsReached: () => {
            alert('❌ Maximum violations reached. The test is being auto-submitted.');
            finishSession();
        }
    });
`;
    // Replace the old timer usage block
    const oldTimerBlockRegex = /const { timeLeft, formatTime } = useMockTimer\(\{\n\s*totalTime: totalExamTime,\n\s*onTimeUp: \(\) => finishSession\(\)\n\s*\}\);/;

    if (oldTimerBlockRegex.test(content)) {
        content = content.replace(oldTimerBlockRegex, hooksToInject);
    } else {
        // If the old block is slightly different, inject after totalExamTime
        content = content.replace(
            /(const totalExamTime =.*?;\n\s*\n)(.*finishSession)/s,
            `$1${hooksToInject}\n    $2`
        );
    }
}

// Ensure clearSavedSession is called before calling onComplete
if (!content.includes('clearSavedSession();')) {
     content = content.replace(
         /onComplete\(\{/g,
         `clearSavedSession();\n        onComplete({`
     );
}

fs.writeFileSync(mockPath, content, 'utf8');
console.log("MockSession patched to Enterprise Standard.");
