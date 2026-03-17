const fs = require('fs');
const file = 'src/features/ai/chat/ChatMessage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Imports
content = content.replace(
    "import { User, Copy, Check, Volume2, Bot, Loader2, Edit2, RotateCcw } from 'lucide-react';",
    "import { User, Copy, Check, Volume2, Bot, Loader2, Edit2, RotateCcw, FileText } from 'lucide-react';"
);

// Add document rendering block
const documentBlock = `
                    {message.documents && message.documents.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {message.documents.map((doc: any, idx: number) => (
                                <div key={idx} className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border shadow-sm",
                                    isUser
                                        ? "bg-white/20 text-gray-900 border-white/30"
                                        : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50"
                                )}>
                                    <FileText className="h-4 w-4" />
                                    <span className="max-w-[150px] truncate">{doc.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
`;

content = content.replace(
    "{message.image && (",
    documentBlock.trim() + "\n\n                    {message.image && ("
);

fs.writeFileSync(file, content);
console.log("Patched ChatMessage.tsx successfully!");
