import React from 'react';
import { FileText, Cpu, AlertTriangle, Check, X, Edit2 } from 'lucide-react';
import type { ExtractedQuestion } from '../types/review';

interface Props {
    question: ExtractedQuestion;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onEdit: (q: ExtractedQuestion) => void;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
}

export const AdminReviewCard: React.FC<Props> = ({ question, onApprove, onReject, onEdit, isSelected, onSelect }) => {

    // Safety checks for rendering
    const score = question.ai_metadata?.confidence_score;
    const isLowConfidence = score !== undefined && score < 0.85;

    const isMalformed = !question.correct || !question.options || question.options.length < 2 || !question.options.includes(question.correct);

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all ${
            isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-800'
        } p-5 flex gap-4`}>

            {onSelect && (
                <div className="pt-1">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(question.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                </div>
            )}

            <div className="flex-1 min-w-0">
                {/* Meta Header */}
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                    {question.source_documents?.filename && (
                        <div className="flex items-center gap-1 text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            <FileText className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{question.source_documents.filename}</span>
                        </div>
                    )}

                    {question.ai_metadata?.extraction?.model && (
                        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                            <Cpu className="w-3 h-3" />
                            <span>{question.ai_metadata.extraction.model}</span>
                            <span className="opacity-50">v{question.ai_metadata.extraction.prompt_version?.split('_v').pop()}</span>
                        </div>
                    )}

                    {score !== undefined && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded font-medium ${
                            isLowConfidence ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                            Score: {(score * 100).toFixed(0)}%
                        </div>
                    )}

                    {isMalformed && (
                        <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
                            <AlertTriangle className="w-3 h-3" /> Schema Risk
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="mb-4">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed mb-3">
                        {question.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {question.options?.map((opt, i) => (
                            <div
                                key={i}
                                className={`p-2 rounded-lg border ${
                                    opt === question.correct
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
                                    : 'bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400'
                                }`}
                            >
                                {opt}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => onApprove(question.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-lg font-medium transition-colors text-sm"
                    >
                        <Check className="w-4 h-4" /> Approve
                    </button>
                    <button
                        onClick={() => onEdit(question)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors flex items-center justify-center"
                        title="Edit Question"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onReject(question.id)}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg font-medium transition-colors flex items-center justify-center"
                        title="Reject Question"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
