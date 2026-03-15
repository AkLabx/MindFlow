const fs = require('fs');
const path = './src/features/ai/chat/ChatMessage.tsx';

let content = fs.readFileSync(path, 'utf8');

// Update imports to include Brain for the AI Avatar
content = content.replace(
    /import \{ Bot, User, Copy, Check, Volume2, RotateCcw \} from 'lucide-react';/,
    `import { Bot, User, Copy, Check, Volume2, RotateCcw, Brain } from 'lucide-react';`
);

// 1. Update AI Avatar
const aiAvatarRegex = /<div className="flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">[\s\S]*?<img src="\/mindflow-icon\.svg" alt="AI" className="h-4 w-4" \/>[\s\S]*?<\/div>/;

const newAiAvatar = `<div className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full overflow-hidden shrink-0 mt-1",
                            "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400",
                            isGenerating ? "animate-pulse" : "" // We'll add custom throbbing class if needed, but animate-pulse + spin works well
                        )}>
                            <Brain className={cn(
                                "h-4 w-4",
                                isGenerating ? "animate-[spin_3s_linear_infinite,pulse_1.5s_ease-in-out_infinite]" : ""
                            )} />
                        </div>`;

content = content.replace(aiAvatarRegex, newAiAvatar);

// 2. Adjust alignment and spacing for the main message container
content = content.replace(
    /<div className=\{cn\(\s*"flex max-w-\[85%\] md:max-w-\[75%\] gap-2 items-end",/g,
    `<div className={cn(\n                "flex max-w-[85%] md:max-w-[75%] gap-3 items-start",`
);

// 3. Update Message Bubble Styling (Borderless AI, User bubble adjustments)
const bubbleStylingRegex = /<div className=\{cn\(\s*"relative flex flex-col min-w-0 rounded-2xl px-4 py-3 shadow-sm",\s*isUser\s*\?\s*"bg-\[#dcf8c6\] dark:bg-\[#005c4b\] text-gray-900 dark:text-gray-100 rounded-br-sm" \/\/ WhatsApp style right bubble colors\s*:\s*"bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm" \/\/ WhatsApp style left bubble colors\s*\)\}>/;

const newBubbleStyling = `<div className={cn(
                    "relative flex flex-col min-w-0 py-2",
                    isUser
                        ? "bg-indigo-50 dark:bg-indigo-900/40 text-gray-900 dark:text-gray-100 rounded-[20px] rounded-br-[4px] px-4 shadow-sm" // User Bubble
                        : "bg-transparent text-gray-900 dark:text-gray-100" // AI Borderless
                )}>`;

content = content.replace(bubbleStylingRegex, newBubbleStyling);


// 4. Update Markdown components to fit borderless design
// Adjust code block background for AI messages to ensure contrast since background is now transparent
content = content.replace(
    /code\(\{ node, className, children, \.\.\.props \}: any\) \{([\s\S]*?)\} \? \(([\s\S]*?)\) : \(([\s\S]*?)<code \{\.\.\.props\} className=\{cn\("px-1\.5 py-0\.5 rounded-md text-sm", isUser \? "bg-black\/10 text-gray-900 dark:text-gray-100" : "bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400", className\)\}>([\s\S]*?)<\/code>([\s\S]*?)\);/g,
    `code({ node, className, children, ...props }: any) {$1} ? ($2) : ($3<code {...props} className={cn("px-1.5 py-0.5 rounded-md text-sm", isUser ? "bg-black/10 text-gray-900 dark:text-gray-100" : "bg-gray-100 dark:bg-gray-800/60 text-indigo-600 dark:text-indigo-400", className)}>$4</code>$5);`
);

// Add custom spin+pulse animation to tailwind config? (Handled directly in the className using arbitrary values above)

fs.writeFileSync(path, content, 'utf8');
console.log('Patched ChatMessage.tsx successfully.');
