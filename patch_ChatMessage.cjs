const fs = require('fs');

const filePath = 'src/features/ai/chat/ChatMessage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add edit props to interface
content = content.replace(
    /interface ChatMessageProps {\n\s*isGenerating\?: boolean;\n\s*message: AIChatMessage;\n\s*onRegenerate\?: \(\) => void;\n}/,
    `interface ChatMessageProps {
    isGenerating?: boolean;
    message: AIChatMessage;
    onRegenerate?: () => void;
    onEdit?: (messageId: string, newContent: string) => void;
}`
);

// Add onEdit to component params
content = content.replace(
    /export const ChatMessage: React.FC<ChatMessageProps> = \(\{ message, onRegenerate, isGenerating \}\) => \{/,
    "export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate, isGenerating, onEdit }) => {"
);

// Add Edit lucide icon import
content = content.replace(
    /Bot, User, Copy, Check, Volume2, RotateCcw, Brain/,
    "Bot, User, Copy, Check, Volume2, RotateCcw, Brain, Edit2"
);

// Add state for editing
content = content.replace(
    /const \[isPlaying, setIsPlaying\] = useState\(false\);/,
    "const [isPlaying, setIsPlaying] = useState(false);\n    const [isEditing, setIsEditing] = useState(false);\n    const [editValue, setEditValue] = useState(message.content);"
);

// Replace the content block with edit UI support
const contentBlockTarget = /<div className=\{cn\(\n\s*"prose prose-sm md:prose-base max-w-none break-words",\n\s*"dark:prose-invert"\n\s*\)\}>[\s\S]*?<\/ReactMarkdown>\n\s*<\/div>/;

const editBlock = `
                    {isEditing ? (
                        <div className="flex flex-col gap-2 w-full mt-2 min-w-[200px] sm:min-w-[300px]">
                            <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 p-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                rows={Math.max(3, editValue.split('\\n').length)}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditValue(message.content);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (editValue.trim() !== message.content && onEdit) {
                                            onEdit(message.id, editValue.trim());
                                        }
                                        setIsEditing(false);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                                >
                                    Save & Submit
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={cn(
                            "prose prose-sm md:prose-base max-w-none break-words",
                            "dark:prose-invert"
                        )}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                    a: ({ node, ...props }) => <a {...props} className={cn(isUser ? "text-blue-600 hover:text-blue-500" : "text-indigo-600 hover:text-indigo-500 dark:text-indigo-400")} target="_blank" rel="noopener noreferrer" />,
                                    table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className={cn("min-w-full divide-y rounded-lg border", isUser ? "divide-gray-400 border-gray-400" : "divide-gray-300 dark:divide-gray-700 border-gray-200 dark:border-gray-800")} {...props} /></div>,
                                    thead: ({ node, ...props }) => <thead className={isUser ? "bg-black/5" : "bg-gray-50 dark:bg-gray-800/80"} {...props} />,
                                    tbody: ({ node, ...props }) => <tbody className={cn("divide-y", isUser ? "divide-gray-400 bg-transparent" : "divide-gray-200 dark:divide-gray-800 bg-white dark:bg-slate-900")} {...props} />,
                                    tr: ({ node, ...props }) => <tr className={cn("transition-colors", isUser ? "hover:bg-black/5" : "hover:bg-gray-50 dark:hover:bg-gray-800/50")} {...props} />,
                                    th: ({ node, ...props }) => <th className={cn("px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider", isUser ? "text-gray-800 dark:text-gray-200" : "text-gray-900 dark:text-gray-100")} {...props} />,
                                    td: ({ node, ...props }) => <td className={cn("px-3 py-4 text-sm whitespace-pre-wrap", isUser ? "text-gray-800 dark:text-gray-200" : "text-gray-700 dark:text-gray-300")} {...props} />,
                                    code({ node, className, children, ...props }: any) {
                                        const match = /language-(w+)/.exec(className || '');
                                        return match ? (
                                            <SyntaxHighlighter
                                                {...props}
                                                style={vscDarkPlus}
                                                language={match[1]}
                                                PreTag="div"
                                                className="rounded-md my-4 shadow-sm"
                                            >
                                                {String(children).replace(/\\n$/, '')}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code {...props} className={cn("px-1.5 py-0.5 rounded-md text-sm", isUser ? "bg-black/10 text-gray-900 dark:text-gray-100" : "bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400", className)}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />
                                }}
                            >
                                {message.content + (isGenerating ? " ●" : "")}
                            </ReactMarkdown>
                        </div>
                    )}`;
content = content.replace(contentBlockTarget, editBlock);

// Add the edit button to user messages
const actionBarTarget = /\{\/\* Action Bar for AI Messages \*\/\}\n\s*\{!isUser && message\.content && \(/;

const userEditBlock = `{/* Action Bar for User Messages */}
                        {isUser && onEdit && !isEditing && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="rounded p-1 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Edit message"
                                >
                                    <Edit2 className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                        {/* Action Bar for AI Messages */}
                        {!isUser && message.content && (`;

content = content.replace(actionBarTarget, userEditBlock);

// Add group class to user bubble wrapper to make edit button show on hover
content = content.replace(
    /className=\{cn\(\n\s*"relative flex flex-col min-w-0 py-2",/,
    `className={cn(
                    "group relative flex flex-col min-w-0 py-2",`
);

fs.writeFileSync(filePath, content);
