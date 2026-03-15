const fs = require('fs');
const path = './src/features/ai/chat/ChatInput.tsx';

let content = fs.readFileSync(path, 'utf8');
content = content.replace(
    /setActiveModel\?: \(modelId: string\) => void;/,
    `setActiveModel?: (modelId: any) => void;`
);

fs.writeFileSync(path, content, 'utf8');
