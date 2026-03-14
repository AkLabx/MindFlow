const fs = require('fs');

let content = fs.readFileSync('src/features/ai/chat/ChatInput.tsx', 'utf-8');

// The black outline in the dark mode/light mode might be the focus-within:ring-2
// Let's remove the ring on the container or set it to focus-within:ring-0
content = content.replace(
    'focus-within:ring-2 focus-within:ring-indigo-500',
    'focus-within:ring-0 focus-within:border-indigo-500/50'
);

content = content.replace(
    'className="max-h-[200px] min-h-[44px] w-full resize-none border-0 bg-transparent p-3 py-3 text-gray-900 placeholder:text-gray-500 focus:ring-0 dark:text-white dark:placeholder:text-gray-400 sm:text-sm"',
    'className="max-h-[200px] min-h-[44px] w-full resize-none border-0 bg-transparent p-3 py-3 text-gray-900 placeholder:text-gray-500 focus:ring-0 outline-none focus:outline-none dark:text-white dark:placeholder:text-gray-400 sm:text-sm"'
);

fs.writeFileSync('src/features/ai/chat/ChatInput.tsx', content);
