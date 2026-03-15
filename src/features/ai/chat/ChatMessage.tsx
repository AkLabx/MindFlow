import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Bot, User, Copy, Check, Volume2, RotateCcw, Brain } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { cn } from '../../../utils/cn';
import { AIChatMessage } from '../../../lib/db';

interface ChatMessageProps {
    isGenerating?: boolean;
    message: AIChatMessage;
    onRegenerate?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate, isGenerating }) => {
    const isUser = message.role === 'user';
    const [isCopied, setIsCopied] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleTTS = () => {
        if (!window.speechSynthesis) return;

        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
    };

    // Helper function to format timestamp
    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutesStr} ${ampm}`;
    };

    const timestamp = message.created_at ? formatTime(message.created_at) : '';

    return (
        <div className={cn(
            "flex w-full px-4 py-2", // Reduced padding for bubble style
            isUser ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "flex max-w-[85%] md:max-w-[75%] gap-3 items-start",
                isUser ? "flex-row-reverse" : "flex-row"
            )}>
                <div className="flex-shrink-0 mb-1">
                    {isUser ? (
                        <div className="hidden">
                            <User className="h-5 w-5 text-white" />
                        </div>
                    ) : (
                        <div className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full overflow-hidden shrink-0 mt-1",
                            "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400",
                            isGenerating ? "animate-pulse" : "" // We'll add custom throbbing class if needed, but animate-pulse + spin works well
                        )}>
                            <Brain className={cn(
                                "h-4 w-4",
                                isGenerating ? "animate-[spin_3s_linear_infinite,pulse_1.5s_ease-in-out_infinite]" : ""
                            )} />
                        </div>
                    )}
                </div>

                <div className={cn(
                    "relative flex flex-col min-w-0 py-2",
                    isUser
                        ? "bg-indigo-50 dark:bg-indigo-900/40 text-gray-900 dark:text-gray-100 rounded-[20px] rounded-br-[4px] px-4 shadow-sm" // User Bubble
                        : "bg-transparent text-gray-900 dark:text-gray-100" // AI Borderless
                )}>
                    <div className={cn(
                        "prose prose-sm md:prose-base max-w-none break-words",
                        "dark:prose-invert"
                    )}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
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
                                            {String(children).replace(/\n$/, '')}
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

                    <div className={cn(
                        "flex items-center mt-1 space-x-2 text-[10px]",
                        isUser ? "justify-end text-gray-500 dark:text-gray-400" : "justify-between text-gray-500 dark:text-gray-400"
                    )}>
                        {/* Action Bar for AI Messages */}
                        {!isUser && message.content && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleCopy}
                                    className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title="Copy message"
                                >
                                    {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                </button>
                                <button
                                    onClick={handleTTS}
                                    className={cn(
                                        "rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                        isPlaying && "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                                    )}
                                    title={isPlaying ? "Stop listening" : "Listen"}
                                >
                                    <Volume2 className="h-3 w-3" />
                                </button>
                                {onRegenerate && (
                                    <button
                                        onClick={onRegenerate}
                                        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title="Regenerate response"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        )}
                        {/* Timestamp */}
                        {timestamp && (
                            <span className={cn(
                                "flex-shrink-0 pt-1",
                                !isUser && "ml-auto" // Push timestamp to right in AI bubble
                            )}>
                                {timestamp}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
