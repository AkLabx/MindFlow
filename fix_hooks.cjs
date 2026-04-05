const fs = require('fs');

let content = fs.readFileSync('src/features/ows/hooks/useOWSProgress.ts', 'utf8');

content = content.replace(/wordObj\.properties\.id/g, 'wordObj.id');

fs.writeFileSync('src/features/ows/hooks/useOWSProgress.ts', content, 'utf8');

// fix imports in syncService.ts
let sync = fs.readFileSync('src/lib/syncService.ts', 'utf8');
sync = sync.replace(/import \{ db, SynonymInteraction \}/g, 'import { db, SynonymInteraction, OWSInteraction }');
fs.writeFileSync('src/lib/syncService.ts', sync, 'utf8');
