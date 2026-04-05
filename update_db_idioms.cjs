const fs = require('fs');

let content = fs.readFileSync('src/lib/db.ts', 'utf8');

// 1. Add IdiomInteraction interface
const interfaceToAdd = `export interface IdiomInteraction {
  idiomId: string;
  isRead: boolean;
  lastInteractedAt: string;
}

`;
content = content.replace('export interface OWSInteraction', interfaceToAdd + 'export interface OWSInteraction');

// 2. Add IDIOM_STORE_NAME
content = content.replace('const OWS_STORE_NAME = \'ows_interactions\';', 'const OWS_STORE_NAME = \'ows_interactions\';\nconst IDIOM_STORE_NAME = \'idiom_interactions\';');

// 3. Update DB_VERSION and onupgradeneeded
content = content.replace('const DB_VERSION = 6;', 'const DB_VERSION = 7;');
content = content.replace(`if (!db.objectStoreNames.contains(OWS_STORE_NAME)) {
                db.createObjectStore(OWS_STORE_NAME, { keyPath: 'wordId' });
            }`, `if (!db.objectStoreNames.contains(OWS_STORE_NAME)) {
                db.createObjectStore(OWS_STORE_NAME, { keyPath: 'wordId' });
            }
            if (!db.objectStoreNames.contains(IDIOM_STORE_NAME)) {
                db.createObjectStore(IDIOM_STORE_NAME, { keyPath: 'idiomId' });
            }`);

// 4. Update clearAllUserData
content = content.replace('db.clearOWSInteractions()', 'db.clearOWSInteractions(),\n            db.clearIdiomInteractions()');

// 5. Update _pushToSupabase
content = content.replace(`type: 'quiz' | 'history' | 'bookmark' | 'synonym_interaction' | 'ows_interaction'`, `type: 'quiz' | 'history' | 'bookmark' | 'synonym_interaction' | 'ows_interaction' | 'idiom_interaction'`);
content = content.replace(`else if (type === 'ows_interaction') await syncService.pushOWSInteraction(session.user.id, data);`, `else if (type === 'ows_interaction') await syncService.pushOWSInteraction(session.user.id, data);\n            else if (type === 'idiom_interaction') await syncService.pushIdiomInteraction(session.user.id, data);`);

// 6. Add Idiom methods at the end of db object
const idiomMethods = `
    /**
     * Saves an Idiom interaction.
     */
    saveIdiomInteraction: async (interaction: IdiomInteraction): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(IDIOM_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(IDIOM_STORE_NAME);
            const request = store.put(interaction);

            request.onsuccess = () => {
                db._pushToSupabase('idiom_interaction', interaction);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all Idiom interactions.
     */
    getAllIdiomInteractions: async (): Promise<IdiomInteraction[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(IDIOM_STORE_NAME, 'readonly');
            const store = transaction.objectStore(IDIOM_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Clears all Idiom interactions.
     */
    clearIdiomInteractions: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(IDIOM_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(IDIOM_STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
`;

content = content.replace('getAllBookmarks: async (): Promise<Question[]> => {', idiomMethods + '\n    getAllBookmarks: async (): Promise<Question[]> => {');

fs.writeFileSync('src/lib/db.ts', content, 'utf8');
