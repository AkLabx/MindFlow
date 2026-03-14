import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Plus, Trash2, MessageSquare, Loader2, Search, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useAIChat, AI_PERSONAS } from './useAIChat';
import { MODEL_CONFIGS } from './useQuota';
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
        setActivePersona,
        includeAppData,
        setIncludeAppData,
        activeModel,
        setActiveModel,
        quota
    } = useAIChat();

    const [inputValue, setInputValue] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const quickStarters = [
        "Explain quantum computing in simple terms.",
        "Give me a 5-question vocabulary quiz.",
        "How do I prepare for the UPSC exam?",
        "What are some common English idioms?"
    ];

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const groupedHistory = useMemo(() => {
        const today: AIChatConversation[] = [];
        const last7Days: AIChatConversation[] = [];
        const last30Days: AIChatConversation[] = [];

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const filtered = conversations.filter(c =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filtered.forEach(c => {
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
    }, [conversations, searchQuery]);

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



    const [isExporting, setIsExporting] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const exportToPDF = async () => {
        if (!chatContainerRef.current || messages.length === 0) return;
        setIsExporting(true);

        try {
            const canvas = await html2canvas(chatContainerRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff' // Force white background for PDF readability
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const JsPDFClass = jsPDF as any;
            const pdf = new JsPDFClass({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Handle multi-page if chat is very long
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            while (position < pdfHeight) {
                pdf.addImage(imgData, 'JPEG', 0, -position, pdfWidth, pdfHeight);
                position += pageHeight;
                if (position < pdfHeight) {
                    pdf.addPage();
                }
            }

            const title = conversations.find(c => c.id === currentConversationId)?.title || 'MindFlow_Chat';
            pdf.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        } catch (error) {
            console.error('Failed to export PDF', error);
        } finally {
            setIsExporting(false);
        }
    };

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
        <div className="absolute inset-0 z-50 flex h-[100dvh] w-[100vw] flex-col bg-white dark:bg-slate-950 md:flex-row overflow-hidden">

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

                <div className="flex-1 overflow-y-auto p-2 flex flex-col">
                    <div className="px-2 mb-4 sticky top-0 bg-gray-50 dark:bg-slate-900 pt-2 pb-2 z-10">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 py-1.5 pl-8 pr-3 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
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
                    <div className="flex flex-1 items-center justify-between">

                        <div className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            <select
                                value={activePersona}
                                onChange={(e) => setActivePersona(e.target.value as any)}
                                className="bg-transparent font-semibold text-gray-900 dark:text-white border-0 outline-none focus:ring-0 p-0 text-base min-w-[120px]"
                            >
                                {Object.values(AI_PERSONAS).map(p => (
                                    <option key={p.id} value={p.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
                                        {p.name}
                                    </option>
                                ))}
                            </select>

                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-2 hidden sm:block"></div>

                            <div className="hidden sm:flex items-center gap-1">
                                <select
                                    value={activeModel}
                                    onChange={(e) => setActiveModel(e.target.value as any)}
                                    className="bg-transparent font-medium text-sm text-indigo-600 dark:text-indigo-400 border-0 outline-none focus:ring-0 p-0"
                                >
                                    {Object.values(MODEL_CONFIGS).map(m => (
                                        <option key={m.id} value={m.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
                                            {m.displayName}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                    {quota?.getRemainingUses()} left
                                </span>
                            </div>
                        </div>


                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">App Context</span>
                            <button
                                onClick={() => setIncludeAppData(!includeAppData)}
                                className={cn(
                                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                                    includeAppData ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                )}
                            >
                                <span className={cn(
                                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                                    includeAppData ? 'translate-x-5' : 'translate-x-1'
                                )} />
                            </button>

                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-2"></div>

                            <button
                                onClick={exportToPDF}
                                disabled={isExporting || messages.length === 0}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
                                title="Download as PDF"
                            >
                                {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div ref={chatContainerRef} className="flex flex-col min-h-full">
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
