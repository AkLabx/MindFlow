const fs = require('fs');

const filePath = 'src/features/ai/chat/useAIChat.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Modify sendMessage signature to accept customHistory
content = content.replace(
    /const sendMessage = useCallback\(async \(content: string, imageBase64\?: string, audioData\?: \{ data: string, mimeType: string \}\) => \{/,
    "const sendMessage = useCallback(async (content: string, imageBase64?: string, audioData?: { data: string, mimeType: string }, customHistory?: AIChatMessage[]) => {"
);

// Modify how historyToSent is constructed
content = content.replace(
    /\/\/ Format history for Gemini \(Exclude the empty one we just pushed\)\n\s*const historyToSent = messages\.map\(m => \(\{\n\s*role: m\.role === 'user' \? 'user' : 'model',\n\s*parts: \[\{ text: m\.content \}\]\n\s*\}\)\);/,
    `// Format history for Gemini (Exclude the empty one we just pushed)
            const baseMessages = customHistory || messages;
            const historyToSent = baseMessages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));`
);

// Modify editMessage to pass preservedMessages as customHistory
content = content.replace(
    /\/\/ Use the original message's properties, but update the text\. We will resend this\.\n\s*await sendMessage\(newContent, originalMessage\.image\);/,
    `// Use the original message's properties, but update the text. We will resend this.
        // Pass preservedMessages so sendMessage doesn't use the stale messages array.
        await sendMessage(newContent, originalMessage.image, undefined, preservedMessages);`
);

fs.writeFileSync(filePath, content);
