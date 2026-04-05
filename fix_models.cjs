const fs = require('fs');

let content = fs.readFileSync('src/types/models.ts', 'utf8');

const interfaceRegex = /(export interface InitialFilters \{[\s\S]*?)(\})/;
content = content.replace(interfaceRegex, (match, p1, p2) => {
    if (p1.includes('readStatus?:')) return match;
    return p1 + '    readStatus?: (\'read\' | \'unread\')[];\n' + p2;
});

// Fix OWS properties id issue
const propertiesRegex = /(export interface OneWordProperties \{[\s\S]*?)(\})/;
content = content.replace(propertiesRegex, (match, p1, p2) => {
    if (p1.includes('id: string;')) return match;
    return p1 + '    id: string;\n' + p2;
});

fs.writeFileSync('src/types/models.ts', content, 'utf8');

// Also need to import OWSInteraction in syncService.ts from db.ts
let syncContent = fs.readFileSync('src/lib/syncService.ts', 'utf8');
syncContent = syncContent.replace('SynonymInteraction } from \'./db\';', 'SynonymInteraction, OWSInteraction } from \'./db\';');
fs.writeFileSync('src/lib/syncService.ts', syncContent, 'utf8');
