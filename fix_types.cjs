const fs = require('fs');

let content = fs.readFileSync('src/features/quiz/types/index.ts', 'utf8');

// The replacement failed earlier probably because it didn't match the exact text.
// Let's do a more robust replace for InitialFilters
const interfaceRegex = /(export interface InitialFilters \{[\s\S]*?)(\})/;
content = content.replace(interfaceRegex, (match, p1, p2) => {
    if (p1.includes('readStatus:')) return match;
    return p1 + '    readStatus?: (\'read\' | \'unread\')[];\n' + p2;
});

fs.writeFileSync('src/features/quiz/types/index.ts', content, 'utf8');
