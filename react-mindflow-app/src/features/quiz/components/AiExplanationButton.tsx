import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Loader2, Sparkles, AlertCircle, Copy, Download } from 'lucide-react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { useNotification } from '../../../stores/useNotificationStore';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Question } from '../types';

interface AiExplanationButtonProps {
    question: Question;
    selectedAnswer?: string;
}

interface AiResponse {
    correct_answer: string;
    reasoning: string;
    exam_facts: string[];
    recent_news: string;
    interesting_facts: string[];
    fun_fact: string;
}

/**
 * A button component that triggers an AI-powered explanation for the current question.
 */
export const AiExplanationButton: React.FC<AiExplanationButtonProps> = ({ question, selectedAnswer }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<AiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const { showToast } = useNotification();

    const handleCopy = () => {
        if (!data) return;
        const textToCopy = `
Correct Answer: ${data.correct_answer}

Reasoning: ${data.reasoning}

Exam Facts:
${data.exam_facts?.map(f => '- ' + f).join('\n')}

Recent News: ${data.recent_news}

Did You Know:
${data.interesting_facts?.map(f => '- ' + f).join('\n')}

Fun Fact: ${data.fun_fact}
`.trim();
        navigator.clipboard.writeText(textToCopy);
        showToast({ title: 'Copied!', message: 'Explanation copied to clipboard.', variant: 'success', duration: 2000 });
    };

    const handleDownload = async () => {
        if (!contentRef.current) return;
        showToast({ title: 'Downloading...', message: 'Preparing image, please wait.', variant: 'info', duration: 2000 });
        try {
            const element = contentRef.current;
            const originalScrollTop = element.scrollTop;
            // A common workaround for html2canvas to capture full scrolling content:
            // Temporarily set height to max-content and overflow to visible.
            const originalHeight = element.style.height;
            const originalOverflow = element.style.overflow;
            element.style.height = 'max-content';
            element.style.overflow = 'visible';

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                windowHeight: element.scrollHeight,
                height: element.scrollHeight,
                scrollY: -window.scrollY
            });

            // Restore original styles
            element.style.height = originalHeight;
            element.style.overflow = originalOverflow;
            element.scrollTop = originalScrollTop;

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'ai-explanation.png';
            link.href = dataUrl;
            link.click();
            showToast({ title: 'Success!', message: 'Image downloaded successfully.', variant: 'success', duration: 2000 });
        } catch (error) {
            console.error('Download failed:', error);
            showToast({ title: 'Error', message: 'Failed to download image.', variant: 'error', duration: 2000 });
        }
    };

    const handleExplain = async () => {
        setIsOpen(true);
        if (data) return; // Cache: Don't re-fetch if we already have it for this instance

        setIsLoading(true);
        setError(null);

        try {
            // Environment Variable check
            const apiKey = process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
            if (!apiKey) {
                throw new Error("AI API Key is missing. Please configure the GOOGLE_AI_KEY environment variable.");
            }

            const todayDate = new Date().toISOString().split('T')[0];
            const prompt = `
You are a knowledgeable and helpful tutor. Analyze this multiple-choice question and provide a detailed explanation.
You must use the Google Search tool to find recent news about the topic (Today's date is ${todayDate}).
Output must be strictly valid JSON.

Question: "${question.question}"
Options: ${JSON.stringify(question.options)}
Correct Answer: "${question.correct}"

JSON Schema:
{
  "correct_answer": "The exact correct answer text",
  "reasoning": "Detailed explanation of why the answer is correct and why others are wrong. Use markdown for formatting (bullet points, bold, math equations if any).",
  "exam_facts": ["PYQ Fact 1 based on SSC CGL/UPSC/NDA/CDS etc.", "Fact 2", "Fact 3", "Fact 4", "Fact 5", "Fact 6"],
  "recent_news": "A short summary of recent news related to the topic. Use the Google Search tool to find this.",
  "interesting_facts": ["Fact 1", "Fact 2"],
  "fun_fact": "A short fun fact related to the topic"
}
`;

            const modelsToTry = [
                'gemini-3.1-flash-lite-preview',
                'gemini-2.5-flash-lite',
                'gemini-2.5-flash'
            ];

            let response;
            let lastErrorMsg = "Failed to fetch explanation";

            for (const model of modelsToTry) {
                try {
                    response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{ text: prompt }]
                                }],
                                tools: [{ googleSearch: {} }]
                                                            })
                        }
                    );

                    if (response.ok) {
                        break; // Success, stop trying models
                    } else {
                        const errData = await response.json();
                        console.warn(`Model ${model} failed:`, errData.error?.message);
                        lastErrorMsg = errData.error?.message || `Failed with ${model}`;
                    }
                } catch (e: any) {
                    console.warn(`Network error with ${model}:`, e.message);
                    lastErrorMsg = e.message;
                }
            }

            if (!response || !response.ok) {
                throw new Error(lastErrorMsg);
            }

            const result = await response.json();
            let text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) throw new Error("Empty response from AI");

            // Clean up potential markdown blocks if responseMimeType wasn't used
            text = text.trim();
            if (text.startsWith('```json')) {
                text = text.slice(7);
            } else if (text.startsWith('```')) {
                text = text.slice(3);
            }
            if (text.endsWith('```')) {
                text = text.slice(0, -3);
            }
            text = text.trim();

            try {
                const parsedData = JSON.parse(text);
                setData(parsedData);
            } catch (parseError) {
                console.error("JSON Parse Error on:", text);
                throw new Error("AI returned invalid data format.");
            }

        } catch (err: any) {
            console.error("AI Explanation Error:", err);
            setError(err.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    // Close modal on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <>
            <button
                onClick={handleExplain}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all hover:scale-105"
                title="Get AI Explanation"
            >
                <Bot className="w-4 h-4" />
                Ask AI Tutor
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        ref={overlayRef}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 zoom-in-95 duration-300"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40">
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                <Sparkles className="w-5 h-5" />
                                <h3 className="font-bold text-lg">AI Explanation</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {data && !isLoading && !error && (
                                    <>
                                        <button
                                            onClick={handleCopy}
                                            className="p-1.5 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow shadow-sm transition-all border border-gray-200 dark:border-gray-700"
                                            title="Copy Text"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleDownload}
                                            className="p-1.5 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow shadow-sm transition-all border border-gray-200 dark:border-gray-700 mr-2"
                                            title="Download as Image"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div ref={contentRef} className="p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">Consulting the AI Tutor...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-red-500">
                                    <AlertCircle className="w-10 h-10 mb-2" />
                                    <p className="font-medium">Oops! Failed to load explanation.</p>
                                    <p className="text-sm opacity-80 mt-1">{error}</p>
                                    <button
                                        onClick={() => { setData(null); handleExplain(); }}
                                        className="mt-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-100"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : data ? (
                                <div className="space-y-6">
                                    {/* 1. Correct Answer */}
                                    {data.correct_answer && (
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/50">
                                            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                                <span>✅</span> Correct Answer
                                            </h4>
                                            <div className="text-emerald-900 dark:text-emerald-100 text-lg font-bold leading-relaxed">
                                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{data.correct_answer}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Reasoning */}
                                    {data.reasoning && (
                                        <div>
                                            <h4 className="text-sm uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-bold mb-2 flex items-center gap-2">
                                                <span>🧠</span> Analysis & Reasoning
                                            </h4>
                                            <div className="text-gray-800 dark:text-gray-100 leading-relaxed text-[0.95rem] prose dark:prose-invert max-w-none prose-sm sm:prose-base prose-p:my-1 prose-li:my-0">
                                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{data.reasoning}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Exam Facts */}
                                    {data.exam_facts && data.exam_facts.length > 0 && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                                            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
                                                <span className="text-lg">📚</span> Exam Special Facts (PYQs)
                                            </h4>
                                            <ul className="space-y-2 list-none pl-1">
                                                {data.exam_facts.map((fact, i) => (
                                                    <li key={i} className="text-blue-900 dark:text-blue-100 text-sm flex gap-2 items-start">
                                                        <span className="text-blue-500 mt-0.5 font-bold">✓</span>
                                                        <span className="flex-1">
                                                             <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{fact}</ReactMarkdown>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* 4. Recent News */}
                                    {data.recent_news && (
                                         <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-100 dark:border-rose-800/30">
                                            <h4 className="text-sm font-bold text-rose-800 dark:text-rose-400 mb-2 flex items-center gap-2">
                                                <span className="text-lg">📰</span> Recent News & Updates
                                            </h4>
                                            <div className="text-rose-900 dark:text-rose-100 text-sm prose dark:prose-invert max-w-none prose-sm">
                                                 <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{data.recent_news}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* 5. Interesting Facts */}
                                    {data.interesting_facts && data.interesting_facts.length > 0 && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30">
                                            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                                                <span className="text-lg">💡</span> Did You Know?
                                            </h4>
                                            <ul className="space-y-2 list-none pl-1">
                                                {data.interesting_facts.map((fact, i) => (
                                                    <li key={i} className="text-amber-900 dark:text-amber-100 text-sm flex gap-2 items-start">
                                                        <span className="text-amber-400 mt-0.5 font-bold">•</span>
                                                        <span className="flex-1">
                                                            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{fact}</ReactMarkdown>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                     {/* 6. Fun Fact */}
                                     {data.fun_fact && (
                                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30">
                                            <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-2">
                                                <span>🎉</span> Fun Fact
                                            </h4>
                                            <div className="text-purple-900 dark:text-purple-200 text-sm italic prose dark:prose-invert max-w-none prose-sm">
                                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{data.fun_fact}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
