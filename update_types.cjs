const fs = require('fs');

let content = fs.readFileSync('src/features/quiz/types/index.ts', 'utf8');

// Add readStatus to InitialFilters
content = content.replace('tags: string[];', 'tags: string[];\n    readStatus?: (\'read\' | \'unread\')[];');

fs.writeFileSync('src/features/quiz/types/index.ts', content, 'utf8');
