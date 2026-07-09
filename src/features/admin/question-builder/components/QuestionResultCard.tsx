import React from 'react';
import { QuestionLightweight } from '../types/questionBuilder.types';
import { Eye } from 'lucide-react';
import DOMPurify from "dompurify";
const renderMathText = (text: string) => DOMPurify.sanitize(text);

interface Props {
    question: QuestionLightweight;
    isSelected: boolean;
    onToggleSelect: (id: string, checked: boolean) => void;
    onPreview: (id: string) => void;
}

export const QuestionResultCard: React.FC<Props> = ({ question, isSelected, onToggleSelect, onPreview }) => {

    // Minimal rendering for the question text
    const truncate = (str: string, max = 120) => str.length > max ? str.substring(0, max) + '...' : str;

    // Check for quality warnings
    const hasExplanation = !!question.explanation?.summary || !!question.explanation?.analysis_correct || !!question.explanation?.analysis_incorrect || !!question.explanation?.fact;
    const hasOptions = Array.isArray(question.options) && question.options.length > 0;
    const hasCorrect = !!question.correct;

    const warnings = [];
    if (!hasExplanation) warnings.push("No explanation");
    if (!hasOptions && question.questionType !== 'Subjective') warnings.push("No options");
    if (!hasCorrect) warnings.push("No correct answer");

    return (
        <div className={`p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex gap-4 ${isSelected ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>

            <div className="pt-1">
                <div className="relative flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onToggleSelect(question.id, e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer dark:border-slate-600 dark:bg-slate-800"
                    />
                </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                        {question.v1_id || 'NO-ID'}
                    </span>
                    {question.subject && <span>• {question.subject}</span>}
                    {question.difficulty && <span>• {question.difficulty}</span>}
                    {question.examName && <span>• {question.examName} {question.examYear}</span>}

                    {isSelected && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] ml-auto font-bold uppercase tracking-wide">
                            Selected
                        </span>
                    )}
                </div>

                <div
                    className="text-sm text-slate-900 dark:text-white line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: truncate(renderMathText(question.question)) }}
                />

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
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview(question.id);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Preview Question"
                >
                    <Eye className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
