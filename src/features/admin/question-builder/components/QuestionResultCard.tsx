import React from 'react';
import { QuestionLightweight } from '../types/questionBuilder.types';
import { Eye, Check } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface Props {
    question: QuestionLightweight;
    isSelected: boolean;
    isLeftSelected?: boolean;
    onToggleSelect: (id: string, checked: boolean) => void;
    onToggleLeftSelect?: (id: string, checked: boolean) => void;
    onPreview: (id: string) => void;
}

export const QuestionResultCard: React.FC<Props> = ({
    question,
    isSelected,
    isLeftSelected,
    onToggleSelect,
    onToggleLeftSelect,
    onPreview
}) => {
    // Check for quality warnings
    const hasExplanation = !!question.explanation?.summary || !!question.explanation?.analysis_correct || !!question.explanation?.analysis_incorrect || !!question.explanation?.fact;
    const hasOptions = Array.isArray(question.options) && question.options.length > 0;
    const hasCorrect = !!question.correct;

    const warnings = [];
    if (!hasExplanation) warnings.push("No explanation");
    if (!hasOptions && question.questionType !== 'Subjective') warnings.push("No options");
    if (!hasCorrect) warnings.push("No correct answer");

    return (
        <div
            className={`p-4 border-b border-slate-100 dark:border-slate-700/50 transition-all flex gap-3
            ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}
            ${isLeftSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}
            `}
        >
            <div className="flex flex-col gap-1 items-center">
                {/* Left panel bulk select checkbox */}
                {onToggleLeftSelect && !isSelected && (
                    <label
                        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Select for bulk add"
                    >
                        <input
                            type="checkbox"
                            aria-label="Select question for bulk add"
                            checked={isLeftSelected || false}
                            onChange={(e) => onToggleLeftSelect(question.id, e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer dark:border-slate-600 dark:bg-slate-800 transition-colors"
                        />
                    </label>
                )}

                {/* Direct Add/Remove button */}
                <div className="relative flex items-center justify-center mt-auto">
                    <button
                        type="button"
                        onClick={() => onToggleSelect(question.id, !isSelected)}
                        aria-label={isSelected ? 'Remove question from test' : 'Add question to test'}
                        aria-pressed={isSelected}
                        title={isSelected ? 'Remove from test' : 'Add to test'}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all active:scale-95 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                                isSelected
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent hover:border-indigo-400 hover:text-indigo-200'
                            }`}
                        >
                            <Check className="w-4 h-4" aria-hidden="true" />
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                        {question.v1_id || 'NO-ID'}
                    </span>
                    {question.subject && <span>• {question.subject}</span>}
                    {question.subTopic && <span>• {question.subTopic}</span>}
                    {question.difficulty && <span>• {question.difficulty}</span>}
                    {question.examName && <span>• {question.examName} {question.examYear}</span>}
                    {question.examDateShift && <span>• {question.examDateShift}</span>}

                    {isSelected && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] ml-auto font-bold uppercase tracking-wide">
                            Added
                        </span>
                    )}
                </div>

                <div className="text-sm text-slate-900 dark:text-white line-clamp-3">
                    <MarkdownRenderer content={question.question} className="prose-sm" />
                </div>

                {warnings.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                        {warnings.map(w => (
                            <span key={w} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50">
                                ⚠ {w}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center justify-start">
                <button
                    type="button"
                    aria-label="Preview question"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview(question.id);
                    }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                    title="Preview Question"
                >
                    <Eye className="w-5 h-5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};
