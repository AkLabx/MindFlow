const fs = require('fs');

const path = 'src/features/ai/chat/useAIChat.ts';
let code = fs.readFileSync(path, 'utf8');

const returnBlock = /return \{\s*messages,[\s\S]*?setIncludeAppData\s*\};/m;
code = code.replace(returnBlock, `return {
        messages,
        conversations,
        currentConversationId,
        isLoading,
        sendMessage,
        startNewConversation,
        loadConversation,
        deleteConversation,
        stopGenerating,
        activePersona,
        setActivePersona,
        includeAppData,
        setIncludeAppData,
        activeModel,
        setActiveModel,
        quota
    };`);
fs.writeFileSync(path, code);
