const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

content = content.replace(`            if (!db.objectStoreNames.contains(OWS_STORE_NAME)) {
                db.createObjectStore(OWS_STORE_NAME, { keyPath: 'wordId' });
            });
                messageStore.createIndex('conversation_id', 'conversation_id', { unique: false });
            }`, `            if (!db.objectStoreNames.contains(OWS_STORE_NAME)) {
                db.createObjectStore(OWS_STORE_NAME, { keyPath: 'wordId' });
            }`);

fs.writeFileSync('src/lib/db.ts', content, 'utf8');
