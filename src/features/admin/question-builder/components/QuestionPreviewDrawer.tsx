import React, { useEffect, useState } from 'react';
import { RightDrawer } from '../../test-series/components/RightDrawer';
import { Question } from '@/types/models';
import { fetchQuestionPreview } from '../api/questionBuilderApi';
import { Loader2, AlertCircle } from 'lucide-react';
import DOMPurify from "dompurify";
const renderMathText = (text: string) => DOMPurify.sanitize(text);

interface Props {
    isOpen: boolean;
    onClose: () => void;
    questionId: string | null;
}

export const QuestionPreviewDrawer: React.FC<Props> = ({ isOpen, onClose, questionId }) => {
    const [question, setQuestion] = useState<Question | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && questionId) {
            loadQuestion();
        } else {
            setQuestion(null);
            setError(null);
        }
    }, [isOpen, questionId]);

    const loadQuestion = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchQuestionPreview(questionId!);
            setQuestion(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load question preview');
        } finally {
            setLoading(false);
        }
    };

    return (
        <RightDrawer isOpen={isOpen} onClose={onClose} title="Question Preview" width="lg">
            <div className="p-6 h-full overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <p>Loading full details...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        <p>{error}</p>
                    </div>
                ) : question ? (
                    <div className="space-y-6">

                        {/* Header Metadata */}
                        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">ID: {question.v1_id}</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Diff: {question.properties?.difficulty || 'N/A'}</span>
                            {question.classification?.subject && (
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{question.classification.subject}</span>
                            )}
                            {question.sourceInfo?.examName && (
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{question.sourceInfo.examName} {question.sourceInfo.examYear}</span>
                            )}
                        </div>

                        {/* Question Text */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question</h4>
                            <div
                                className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: renderMathText(question.question) }}
                            />
                        </div>

                        {/* Options */}
                        {question.options && question.options.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Options</h4>
                                {question.options.map((opt, idx) => {
                                    const isCorrect = question.correct === opt || question.correct === String.fromCharCode(65 + idx);
                                    return (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-lg border text-sm flex gap-3 ${
                                                isCorrect
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-100'
                                                    : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <span className="font-bold opacity-50">{String.fromCharCode(65 + idx)}.</span>
                                            <div dangerouslySetInnerHTML={{ __html: renderMathText(opt) }} />
                                            {isCorrect && <span className="ml-auto text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Correct</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Explanation */}
                        {question.explanation && Object.keys(question.explanation).length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 p-4 rounded-xl space-y-3">
                                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Explanation</h4>

                                {question.explanation.summary && (
                                    <div className="text-sm text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMathText(question.explanation.summary) }} />
                                )}

                                {question.explanation.analysis_correct && (
                                    <div className="text-sm text-emerald-700 dark:text-emerald-400 mt-2 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMathText(`<b>Correct Analysis:</b> ${question.explanation.analysis_correct}`) }} />
                                )}

                                {question.explanation.analysis_incorrect && (
                                    <div className="text-sm text-rose-700 dark:text-rose-400 mt-2 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMathText(`<b>Incorrect Analysis:</b> ${question.explanation.analysis_incorrect}`) }} />
                                )}
                            </div>
                        )}

                    </div>
                ) : null}
            </div>
        </RightDrawer>
    );
};
