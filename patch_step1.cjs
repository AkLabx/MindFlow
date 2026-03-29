const fs = require('fs');

const filePath = 'src/features/quiz/components/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add imports
if (!content.includes('import { motion }')) {
    content = content.replace("import React from 'react';", "import React, { useEffect } from 'react';\nimport { motion } from 'framer-motion';");
} else if (!content.includes('useEffect')) {
    content = content.replace("import React from 'react';", "import React, { useEffect } from 'react';");
}

const useEffectLogic = `
    useEffect(() => {
        // Injecting simple keyframes for mesh gradient moving if not exists
        if (!document.getElementById('mesh-keyframes')) {
            const style = document.createElement('style');
            style.id = 'mesh-keyframes';
            style.innerHTML = \`
                @keyframes flow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-flow {
                    background-size: 200% 200%;
                    animation: flow 15s ease infinite;
                }
            \`;
            document.head.appendChild(style);
        }
    }, []);
`;

// Insert the useEffect inside the Dashboard component
content = content.replace("const getGreeting = () => {", `${useEffectLogic}\n    const getGreeting = () => {`);

// Update the wrapper div
const wrapperRegex = /<div className="flex flex-col">/;
const newWrapper = `<div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 animate-flow transition-colors duration-700 relative overflow-hidden">`;
content = content.replace(wrapperRegex, newWrapper);

fs.writeFileSync(filePath, content);
console.log('Step 1 complete');
