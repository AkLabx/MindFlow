const fs = require('fs');

let content = fs.readFileSync('src/lib/db.ts', 'utf8');

// 1. Add OWSInteraction interface
const interfaceToAdd = `export interface OWSInteraction {
  wordId: string;
  isRead: boolean;
  lastInteractedAt: string;
}

`;
content = content.replace('const DB_NAME', interfaceToAdd + 'const DB_NAME');

// 2. Add OWS_STORE_NAME
content = content.replace('const ACTIVE_SESSION_STORE = \'active_test_session\';', 'const ACTIVE_SESSION_STORE = \'active_test_session\';\nconst OWS_STORE_NAME = \'ows_interactions\';');

// 3. Update DB_VERSION and onupgradeneeded
content = content.replace('const DB_VERSION = 5;', 'const DB_VERSION = 6;');
content = content.replace(/if \(\!db\.objectStoreNames\.contains\(CHAT_MESSAGES_STORE\)\) \{([\s\S]*?)\}/, `if (!db.objectStoreNames.contains(CHAT_MESSAGES_STORE)) {
                const messageStore = db.createObjectStore(CHAT_MESSAGES_STORE, { keyPath: 'id' });
                messageStore.createIndex('conversation_id', 'conversation_id', { unique: false });
            }
            if (!db.objectStoreNames.contains(OWS_STORE_NAME)) {
                db.createObjectStore(OWS_STORE_NAME, { keyPath: 'wordId' });
            }`);

// 4. Update clearAllUserData
content = content.replace('db.clearSynonymInteractions()', 'db.clearSynonymInteractions(),\n            db.clearOWSInteractions()');

// 5. Update _pushToSupabase
content = content.replace(`type: 'quiz' | 'history' | 'bookmark' | 'synonym_interaction'`, `type: 'quiz' | 'history' | 'bookmark' | 'synonym_interaction' | 'ows_interaction'`);
content = content.replace(`else if (type === 'synonym_interaction') await syncService.pushSynonymInteraction(session.user.id, data);`, `else if (type === 'synonym_interaction') await syncService.pushSynonymInteraction(session.user.id, data);\n            else if (type === 'ows_interaction') await syncService.pushOWSInteraction(session.user.id, data);`);

// 6. Add OWS methods at the end of db object
const owsMethods = `
    /**
     * Saves an OWS interaction.
     */
    saveOWSInteraction: async (interaction: OWSInteraction): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(OWS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(OWS_STORE_NAME);
            const request = store.put(interaction);

            request.onsuccess = () => {
                db._pushToSupabase('ows_interaction', interaction);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all OWS interactions.
     */
    getAllOWSInteractions: async (): Promise<OWSInteraction[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(OWS_STORE_NAME, 'readonly');
            const store = transaction.objectStore(OWS_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Clears all OWS interactions.
     */
    clearOWSInteractions: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(OWS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(OWS_STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
`;

content = content.replace('getAllBookmarks: async (): Promise<Question[]> => {', owsMethods + '\n    getAllBookmarks: async (): Promise<Question[]> => {');

fs.writeFileSync('src/lib/db.ts', content, 'utf8');
