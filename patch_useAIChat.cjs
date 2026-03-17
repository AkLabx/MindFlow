const fs = require('fs');

const filePath = 'src/features/ai/chat/useAIChat.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Add the import for deleteChatMessagesAfter
content = content.replace(
    /deleteChatConversation as dbDeleteConversation\s*}\s*from '\.\.\/\.\.\/\.\.\/lib\/db';/,
    "deleteChatConversation as dbDeleteConversation,\n    deleteChatMessagesAfter\n} from '../../../lib/db';"
);

// Add the editMessage function before the return statement of the hook
const editMessageCode = `
    const editMessage = async (messageId: string, newContent: string) => {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        const originalMessage = messages[messageIndex];

        // Stop current generation if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }

        // Delete all messages after the edited message from the database
        await deleteChatMessagesAfter(originalMessage.conversation_id, originalMessage.created_at);

        // Keep messages up to the edited message, but excluding the edited message itself
        // because we will resend it
        const preservedMessages = messages.slice(0, messageIndex);
        setMessages(preservedMessages);

        // Use the original message's properties, but update the text. We will resend this.
        await sendMessage(newContent, originalMessage.image);
    };

    return {
        messages,`;

content = content.replace(/\s*return\s*{\s*messages,/, editMessageCode);

fs.writeFileSync(filePath, content);
