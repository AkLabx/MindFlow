const fs = require('fs');
const path = './src/features/ai/chat/ChatInput.tsx';

let content = fs.readFileSync(path, 'utf8');

// There's an extra closing </div> before the final one. Let's fix lines 255-261.
content = content.replace(
    /                    <\/div>\n                <\/div>\n            \)}<\/div>\n            <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">/g,
    `                    </div>\n                </div>\n            )}`
);

content = content.replace(
    /\)}<\/div>\n            <div className="mt-2 text-center text-xs/g,
    `)}\n            <div className="mt-2 text-center text-xs`
);

// Specifically handle the extra `</div>` at line 255 from the output
content = content.replace(
    /\n            \)}\n            <\/div>\n            <div className="mt-2 text-center/g,
    `\n            )}\n            <div className="mt-2 text-center`
);


fs.writeFileSync(path, content, 'utf8');
