import React from 'react';
import { Bookmark } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Question } from '../../../types/models';
import { cn } from '../../../utils/cn';

export interface QuestionSolutionCardProps {
    question: Question;
    displayIndex: number;
    userAnswer?: string;
    isBookmarked?: boolean;
}

export const QuestionSolutionCard: React.FC<QuestionSolutionCardProps> = ({
    question,
    displayIndex,
    userAnswer,
    isBookmarked
}) => {
    const isCorrect = userAnswer === question.correct;
    const isUnattempted = !userAnswer;

    return (
        <Card className={cn(
            "p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm",
            isUnattempted ? "border-slate-200 dark:border-slate-800"
                        : isCorrect ? "border-emerald-200 dark:border-emerald-900/50"
                                    : "border-rose-200 dark:border-rose-900/50"
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider",
                        isUnattempted ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                      : isCorrect ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                                  : "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                    )}>
                        {isUnattempted ? 'Unattempted (0)' : isCorrect ? 'Correct (+1)' : 'Incorrect (-0.5)'}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Q.{displayIndex} • {question.subject || question.classification?.subject || 'General'}
                    </span>
                </div>
                {isBookmarked && (
                    <Bookmark className="w-5 h-5 text-indigo-500 dark:text-indigo-400 fill-current shrink-0" />
                )}
            </div>

            <p className="text-slate-800 dark:text-slate-200 font-medium mb-6 leading-relaxed">
                {question.question}
            </p>

            <div className="space-y-3">
                {question.options.map((opt, optIdx) => {
                    const isUserChoice = opt === userAnswer;
                    const isCorrectOption = opt === question.correct;

                    let optionClass = "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300";
                    let tagLabel = null;

                    if (isCorrectOption) {
                        optionClass = "border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200";
                        tagLabel = <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Correct</span>;
                    } else if (isUserChoice && !isCorrect) {
                        optionClass = "border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200";
                        tagLabel = <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Your Choice</span>;
                    }

                    const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                    return (
                        <div key={optIdx} className={cn(
                            "flex items-center justify-between p-3.5 rounded-xl border transition-all",
                            optionClass
                        )}>
                            <div className="flex items-center gap-3">
                                <span className="font-bold opacity-70">({letter})</span>
                                <span className="font-medium">{opt}</span>
                            </div>
                            {tagLabel}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};
