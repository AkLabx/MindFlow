import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Bot, User, Copy, Check, Volume2, RotateCcw } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { cn } from '../../../utils/cn';
import { AIChatMessage } from '../../../lib/db';

interface ChatMessageProps {
    message: AIChatMessage;
    onRegenerate?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate }) => {
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

    return (
        <div className={cn(
            "flex w-full px-4 py-6",
            isUser ? "bg-transparent" : "bg-gray-50 dark:bg-gray-800/50"
        )}>
            <div className="mx-auto flex w-full max-w-3xl gap-4">
                <div className="flex-shrink-0">
                    {isUser ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-indigo-600">
                            <User className="h-5 w-5 text-white" />
                        </div>
                    ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-600">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1 space-y-2 overflow-hidden prose dark:prose-invert prose-sm md:prose-base max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            a: ({ node, ...props }) => <a {...props} className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400" target="_blank" rel="noopener noreferrer" />,
                            table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-200 dark:border-gray-800 rounded-lg" {...props} /></div>,
                            thead: ({ node, ...props }) => <thead className="bg-gray-50 dark:bg-gray-800/80" {...props} />,
                            tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-slate-900" {...props} />,
                            tr: ({ node, ...props }) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" {...props} />,
                            th: ({ node, ...props }) => <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider" {...props} />,
                            td: ({ node, ...props }) => <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap" {...props} />,
                            code({ node, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
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
                                    <code {...props} className={cn("bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md text-sm", className)}>
                                        {children}
                                    </code>
                                );
                            }
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>

                    {/* Action Bar for AI Messages */}
                    {!isUser && message.content && (
                        <div className="flex items-center gap-2 pt-2 text-gray-500 dark:text-gray-400">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 rounded-md p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                title="Copy message"
                            >
                                {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                <span className="text-xs">{isCopied ? "Copied" : "Copy"}</span>
                            </button>
                            <button
                                onClick={handleTTS}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-md p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors",
                                    isPlaying && "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                                )}
                                title={isPlaying ? "Stop listening" : "Listen"}
                            >
                                <Volume2 className="h-4 w-4" />
                                <span className="text-xs">{isPlaying ? "Stop" : "Listen"}</span>
                            </button>
                            {onRegenerate && (
                                <button
                                    onClick={onRegenerate}
                                    className="flex items-center gap-1.5 rounded-md p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                    title="Regenerate response"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    <span className="text-xs">Regenerate</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
