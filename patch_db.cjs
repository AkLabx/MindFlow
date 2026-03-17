const fs = require('fs');

const filePath = 'src/lib/db.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newFunction = `
export const deleteChatMessagesAfter = async (conversationId: string, timestamp: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_MESSAGES_STORE], 'readwrite');
        const store = transaction.objectStore(CHAT_MESSAGES_STORE);
        const index = store.index('conversation_id');
        const request = index.openCursor(IDBKeyRange.only(conversationId));

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
                const message = cursor.value as AIChatMessage;
                // Delete if the message was created strictly after the given timestamp
                if (new Date(message.created_at).getTime() > new Date(timestamp).getTime()) {
                    cursor.delete();
                }
                cursor.continue();
            }
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};
`;

content += newFunction;
fs.writeFileSync(filePath, content);
