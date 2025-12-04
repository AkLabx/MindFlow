import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Question } from '../../types';

interface AiExplanationButtonProps {
    question: Question;
    selectedAnswer?: string; // To check if user was correct/incorrect
}

interface AiResponse {
    explanation: string;
    correct_answer: string;
    interesting_facts: string[];
    fun_fact: string;
}

export const AiExplanationButton: React.FC<AiExplanationButtonProps> = ({ question, selectedAnswer }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<AiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const overlayRef = useRef<HTMLDivElement>(null);

    const handleExplain = async () => {
        setIsOpen(true);
        if (data) return; // Already fetched

        setIsLoading(true);
        setError(null);

        try {
            const apiKey = process.env.GOOGLE_AI_KEY;
            if (!apiKey) {
                throw new Error("AI API Key is missing. Please configure the GOOGLE_AI_KEY environment variable.");
            }

            const prompt = `
You are a knowledgeable and helpful tutor. Analyze this multiple-choice question and provide a detailed explanation.
Output must be strictly valid JSON.

Question: "${question.question}"
Options: ${JSON.stringify(question.options)}
Correct Answer: "${question.correct}"

JSON Schema:
{
  "explanation": "Detailed explanation of why the answer is correct and why others are wrong. Use markdown for formatting (bold, italic).",
  "correct_answer": "The correct answer text",
  "interesting_facts": ["Fact 1", "Fact 2"],
  "fun_fact": "A short fun fact related to the topic"
}
`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            responseMimeType: "application/json"
                        }
                    })
                }
            );

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || "Failed to fetch explanation");
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) throw new Error("Empty response from AI");

            const parsedData = JSON.parse(text);
            setData(parsedData);

        } catch (err: any) {
            console.error("AI Explanation Error:", err);
            setError(err.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    // Close on click outside
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
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 zoom-in-95 duration-300"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex items-center gap-2 text-indigo-700">
                                <Sparkles className="w-5 h-5" />
                                <h3 className="font-bold text-lg">AI Explanation</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-full hover:bg-white/50 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                                    <p className="text-gray-500 font-medium">Consulting the AI Tutor...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-red-500">
                                    <AlertCircle className="w-10 h-10 mb-2" />
                                    <p className="font-medium">Oops! Failed to load explanation.</p>
                                    <p className="text-sm opacity-80 mt-1">{error}</p>
                                    <button
                                        onClick={() => { setData(null); handleExplain(); }}
                                        className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : data ? (
                                <div className="space-y-6">
                                    {/* Explanation */}
                                    <div>
                                        <h4 className="text-sm uppercase tracking-wider text-gray-400 font-bold mb-2">Analysis</h4>
                                        <div
                                            className="text-gray-800 leading-relaxed text-[0.95rem] space-y-2 [&_strong]:text-indigo-700 [&_strong]:font-bold"
                                            dangerouslySetInnerHTML={{ __html: data.explanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} // Simple markdown bold parser
                                        />
                                    </div>

                                    {/* Facts */}
                                    {data.interesting_facts?.length > 0 && (
                                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                                                <span className="text-lg">💡</span> Did You Know?
                                            </h4>
                                            <ul className="space-y-2">
                                                {data.interesting_facts.map((fact, i) => (
                                                    <li key={i} className="text-amber-900 text-sm flex gap-2">
                                                        <span className="text-amber-400 mt-0.5">•</span>
                                                        <span>{fact}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                     {/* Fun Fact */}
                                     {data.fun_fact && (
                                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                            <h4 className="text-sm font-bold text-indigo-800 mb-1">Fun Fact</h4>
                                            <p className="text-indigo-900 text-sm italic">"{data.fun_fact}"</p>
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
