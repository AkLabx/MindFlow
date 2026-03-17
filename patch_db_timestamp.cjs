const fs = require('fs');

const filePath = 'src/lib/db.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
    /if \(new Date\(message.created_at\).getTime\(\) > new Date\(timestamp\).getTime\(\)\) \{/,
    "if (new Date(message.created_at).getTime() >= new Date(timestamp).getTime()) {"
);

fs.writeFileSync(filePath, content);
