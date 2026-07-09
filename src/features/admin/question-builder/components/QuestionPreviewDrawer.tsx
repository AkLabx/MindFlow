import React, { useState, useEffect } from 'react';
import { fetchQuestionPreview } from '../api/questionBuilderApi';
import { Question } from '@/types/models';
import { RightDrawer } from '../../test-series/components/RightDrawer';
import { Loader2, AlertCircle } from 'lucide-react';
import DOMPurify from "dompurify";
import 'katex/dist/katex.min.css';

const renderMathText = (text: string) => DOMPurify.sanitize(text);

interface Props {
    isOpen: boolean;
    onClose: () => void;
    questionId: string | null;
}

export const QuestionPreviewDrawer: React.FC<Props> = ({ isOpen, onClose, questionId }) => {
    const [question, setQuestion] = useState<Question | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            if (!questionId || !isOpen) return;
            setLoading(true);
            setError('');
            try {
                const q = await fetchQuestionPreview(questionId);
                setQuestion(q);
            } catch (err: any) {
                setError(err.message || 'Failed to load preview');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [questionId, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <RightDrawer isOpen={isOpen} onClose={onClose} title="Question Preview" width="lg">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-slate-500 text-sm">Loading complete question data...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 text-red-500">
                    <AlertCircle className="w-8 h-8" />
                    <p>{error}</p>
                </div>
            ) : question ? (
                <div className="space-y-6 pb-20">
                    {/* Meta */}
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-mono">
                            {question.v1_id}
                        </span>
                        {question.subject && <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md">{question.subject}</span>}
                        {(question as any).difficulty && <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md">{(question as any).difficulty}</span>}
                    </div>

                    {/* Question Text */}
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question</h4>
                        <div dangerouslySetInnerHTML={{ __html: renderMathText(question.question) }} />
                    </div>

                    {/* Options */}
                    {question.options && question.options.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Options</h4>
                            {question.options.map((opt: any) => {
                                const isCorrect = question.correct === opt.key;
                                return (
                                    <div
                                        key={opt.key}
                                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                                            isCorrect
                                            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-900/20'
                                            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                                        }`}
                                    >
                                        <span className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                            isCorrect
                                            ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                            {opt.key}
                                        </span>
                                        <div
                                            className="prose prose-sm dark:prose-invert text-sm mt-0.5"
                                            dangerouslySetInnerHTML={{ __html: renderMathText(opt.value) }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Explanation</h4>

                            {question.explanation.fact && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg">
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 block">Key Fact</span>
                                    <div className="text-sm text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: renderMathText(question.explanation.fact) }} />
                                </div>
                            )}

                            {question.explanation.summary && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-400 mb-1 block">Summary</span>
                                    <div className="text-sm text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: renderMathText(question.explanation.summary) }} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : null}

            <div className="absolute top-4 right-14">
                <kbd className="hidden md:inline-block px-2 py-1 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
                    Esc
                </kbd>
            </div>
        </RightDrawer>
    );
};
