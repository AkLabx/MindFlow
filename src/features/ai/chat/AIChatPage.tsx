import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Plus, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useAIChat, AI_PERSONAS } from './useAIChat';
import { cn } from '../../../utils/cn';
import { AIChatConversation } from '../../../lib/db';

export const AIChatPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        messages,
        conversations,
        currentConversationId,
        isLoading,
        sendMessage,
        startNewConversation,
        loadConversation,
        deleteConversation,
        stopGenerating,
        activePersona,
        setActivePersona
    } = useAIChat();

    const [inputValue, setInputValue] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const quickStarters = [
        "Explain quantum computing in simple terms.",
        "Give me a 5-question vocabulary quiz.",
        "How do I prepare for the UPSC exam?",
        "What are some common English idioms?"
    ];

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const groupConversations = () => {
        const today: AIChatConversation[] = [];
        const last7Days: AIChatConversation[] = [];
        const last30Days: AIChatConversation[] = [];

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        conversations.forEach(c => {
            const date = new Date(c.updated_at);
            date.setHours(0, 0, 0, 0);
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                today.push(c);
            } else if (diffDays <= 7) {
                last7Days.push(c);
            } else {
                last30Days.push(c);
            }
        });

        return { today, last7Days, last30Days };
    };

    const groupedHistory = groupConversations();

    const SidebarGroup = ({ title, items }: { title: string, items: AIChatConversation[] }) => {
        if (items.length === 0) return null;
        return (
            <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">{title}</h3>
                <div className="space-y-1">
                    {items.map((conv) => (
                        <div
                            key={conv.id}
                            className={cn(
                                "group relative flex items-center justify-between gap-2 rounded-lg p-2.5 text-sm transition-colors cursor-pointer",
                                currentConversationId === conv.id
                                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300 font-medium"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                            )}
                            onClick={() => {
                                loadConversation(conv.id);
                                setIsSidebarOpen(false);
                            }}
                        >
                            <span className="truncate flex-1">{conv.title}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteConversation(conv.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0"
                                title="Delete chat"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);


    const handleRegenerate = () => {
        // Find the last user message
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg && !isLoading) {
            sendMessage(lastUserMsg.content);
        }
    };

    const handleSubmit = (image?: string) => {
        if ((!inputValue.trim() && !image) || isLoading) return;
        sendMessage(inputValue, image);
        setInputValue('');
    };

    return (
        <div className="flex h-[100dvh] w-full flex-col bg-white dark:bg-slate-950 md:flex-row">

            {/* Sidebar (Desktop & Mobile Slide-in) */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 transform bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-4 flex gap-2">
                     <button
                        onClick={startNewConversation}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-3 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Chat
                    </button>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                         <ArrowLeft className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    <SidebarGroup title="Today" items={groupedHistory.today} />
                    <SidebarGroup title="Previous 7 Days" items={groupedHistory.last7Days} />
                    <SidebarGroup title="Previous 30 Days" items={groupedHistory.last30Days} />

                    {conversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-500">
                            <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No recent chats</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col h-full min-w-0">
                {/* Header */}
                <header className="flex h-14 items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-slate-950/80 px-4 backdrop-blur-sm shrink-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <button
                         onClick={() => setIsSidebarOpen(true)}
                         className="md:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                    >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <select
                            value={activePersona}
                            onChange={(e) => setActivePersona(e.target.value as any)}
                            className="bg-transparent font-semibold text-gray-900 dark:text-white border-0 outline-none focus:ring-0 p-0 text-base"
                        >
                            {Object.values(AI_PERSONAS).map(p => (
                                <option key={p.id} value={p.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </header>

                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    {messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-fade-in">
                            <div className="mb-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 p-4 ring-1 ring-indigo-100 dark:ring-indigo-800">
                                <Brain className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">How can I help you learn today?</h2>
                            <p className="max-w-md text-gray-500 dark:text-gray-400 mb-8">
                                Ask a question, request an explanation, or practice your vocabulary with MindFlow AI.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4 md:px-0">
                                {quickStarters.map((starter, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (!isLoading) {
                                                sendMessage(starter);
                                            }
                                        }}
                                        className="flex items-start text-left gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all duration-200 group"
                                    >
                                        <div className="mt-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 p-2 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <MessageSquare className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-900 dark:group-hover:text-indigo-300">
                                            {starter}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col pb-4">
                            {messages.map((message) => (
                                <ChatMessage
                                    key={message.id}
                                    message={message}
                                    onRegenerate={handleRegenerate}
                                />
                            ))}
                            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                                <div className="flex w-full px-4 py-6 bg-gray-50 dark:bg-gray-800/50 animate-fade-in">
                                    <div className="mx-auto flex w-full max-w-3xl gap-4 items-start">
                                        <div className="flex-shrink-0">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-indigo-600/20 dark:bg-indigo-500/20">
                                                <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 h-8 text-sm text-gray-500 dark:text-gray-400 italic">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            MindFlow AI is thinking...
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="bg-gradient-to-t from-white via-white to-transparent pt-4 pb-2 dark:from-slate-950 dark:via-slate-950 px-2 shrink-0">
                    <ChatInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        onStopGenerating={stopGenerating}
                    />
                </div>
            </div>
        </div>
    );
};
