const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'lib', 'db.ts');
let content = fs.readFileSync(dbPath, 'utf8');

// Update DB Version
content = content.replace(/const DB_VERSION = 3;/g, "const DB_VERSION = 4;");

// Add STORE_NAME if missing
if (!content.includes("const ACTIVE_SESSION_STORE = 'active_test_session';")) {
  content = content.replace(/const SYNONYM_STORE_NAME = 'synonym_progress';/, "const SYNONYM_STORE_NAME = 'synonym_progress';\nconst ACTIVE_SESSION_STORE = 'active_test_session';");
}

// Add the store creation logic
if (!content.includes("db.createObjectStore(ACTIVE_SESSION_STORE, { keyPath: 'sessionId' });")) {
   content = content.replace(
       /if \(!db\.objectStoreNames\.contains\(SYNONYM_STORE_NAME\)\) \{\n\s*db\.createObjectStore\(SYNONYM_STORE_NAME, \{ keyPath: 'id' \}\);\n\s*\}/,
       `if (!db.objectStoreNames.contains(SYNONYM_STORE_NAME)) {\n                db.createObjectStore(SYNONYM_STORE_NAME, { keyPath: 'id' });\n            }\n            if (!db.objectStoreNames.contains(ACTIVE_SESSION_STORE)) {\n                db.createObjectStore(ACTIVE_SESSION_STORE, { keyPath: 'sessionId' });\n            }`
   );
}

// Add methods
if (!content.includes("saveActiveSession")) {
  const newMethods = `
    /**
     * Enterprise: Saves active test session state for offline resilience
     */
    saveActiveSession: async (sessionId: string, state: any): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(ACTIVE_SESSION_STORE, 'readwrite');
            const store = transaction.objectStore(ACTIVE_SESSION_STORE);
            const request = store.put({ sessionId, state, updatedAt: new Date().toISOString() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Enterprise: Retrieves active test session
     */
    getActiveSession: async (sessionId: string): Promise<any> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(ACTIVE_SESSION_STORE, 'readonly');
            const store = transaction.objectStore(ACTIVE_SESSION_STORE);
            const request = store.get(sessionId);

            request.onsuccess = () => resolve(request.result?.state || null);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Enterprise: Clears active session upon successful submit
     */
    clearActiveSession: async (sessionId: string): Promise<void> => {
         const dbInstance = await openDB();
         return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(ACTIVE_SESSION_STORE, 'readwrite');
            const store = transaction.objectStore(ACTIVE_SESSION_STORE);
            const request = store.delete(sessionId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
`;
  content = content.replace(/export const db = {/, `export const db = {${newMethods}`);
}

fs.writeFileSync(dbPath, content, 'utf8');
console.log("DB Patched Successfully.");
