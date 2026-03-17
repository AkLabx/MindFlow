const fs = require('fs');

const filePath = 'src/features/ai/chat/useAIChat.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Add editMessage to the return object
content = content.replace(
    /return\s*{\s*messages,/g,
    "return {\n        messages,\n        editMessage,"
);

fs.writeFileSync(filePath, content);
