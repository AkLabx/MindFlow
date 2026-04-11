#!/bin/bash
cat << 'INNER_EOF' > /tmp/patch.js
const fs = require('fs');
let code = fs.readFileSync('src/features/quiz/components/SavedQuizzes.tsx', 'utf8');

code = code.replace(
/        const handleSyncComplete = async \(\) => \{\n            await loadQuizzes\(\);\n            setIsSyncing\(false\);\n\n        \};/g,
`        const handleSyncComplete = () => {
            // Add a small delay to ensure IndexedDB transactions are fully committed
            // before we try to read the hydrated data.
            setTimeout(async () => {
                await loadQuizzes();
                setIsSyncing(false);
            }, 100);
        };`
);

fs.writeFileSync('src/features/quiz/components/SavedQuizzes.tsx', code);
INNER_EOF
node /tmp/patch.js
