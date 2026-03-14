const fs = require('fs');

let content = fs.readFileSync('src/features/ai/chat/AIChatPage.tsx', 'utf-8');

// Replace the specific line that hides features on mobile
content = content.replace(
    '<div className="hidden md:flex items-center gap-2">',
    '<div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">'
);

// Allow wrapping in the header or just keep it scrolling horizontally
// Alternatively, maybe adjust spacing
content = content.replace(
    '<header className="flex h-14 items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-slate-950/80 px-4 backdrop-blur-sm shrink-0">',
    '<header className="flex h-14 items-center gap-2 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-slate-950/80 px-2 sm:px-4 backdrop-blur-sm shrink-0 overflow-x-auto no-scrollbar">'
);

content = content.replace(
    '<div className="flex flex-1 items-center justify-between">',
    '<div className="flex flex-1 items-center justify-between min-w-max gap-4">'
)


// Pass isGenerating down to ChatMessage
content = content.replace(
    /<ChatMessage\s+key=\{message\.id\}\s+message=\{message\}\s+onRegenerate=\{handleRegenerate\}\s+\/>/g,
    `<ChatMessage
                                    key={message.id}
                                    message={message}
                                    onRegenerate={handleRegenerate}
                                    isGenerating={isLoading && message.id === messages[messages.length - 1].id && message.role === 'assistant'}
                                />`
);


fs.writeFileSync('src/features/ai/chat/AIChatPage.tsx', content);
