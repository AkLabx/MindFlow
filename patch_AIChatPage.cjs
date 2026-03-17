const fs = require('fs');

const filePath = 'src/features/ai/chat/AIChatPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Extract editMessage from useAIChat
content = content.replace(
    /        sendMessage,\n        startNewConversation,/,
    "        sendMessage,\n        editMessage,\n        startNewConversation,"
);

// Add onEdit to ChatMessage component
content = content.replace(
    /                                    onRegenerate=\{handleRegenerate\}\n                                    isGenerating=\{isLoading && message.id === messages\[messages.length - 1\].id && message.role === 'assistant'\}/,
    `                                    onRegenerate={handleRegenerate}
                                    onEdit={editMessage}
                                    isGenerating={isLoading && message.id === messages[messages.length - 1].id && message.role === 'assistant'}`
);

fs.writeFileSync(filePath, content);
