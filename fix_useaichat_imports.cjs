const fs = require('fs');

const path = 'src/features/ai/chat/useAIChat.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import { useQuota")) {
  code = `import { useQuota, MODEL_CONFIGS, ModelId } from './useQuota';\n` + code;
}
fs.writeFileSync(path, code);

const returnBlock = /return \{\s*messages,[\s\S]*?setIncludeAppData\s*\};/m;
if (!code.includes("activeModel,")) {
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
}
