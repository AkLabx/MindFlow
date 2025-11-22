
import React from 'react';
import { Question } from '../types';
import { QuizOption } from './QuizOption';

export function QuizQuestionDisplay({
    question,
    selectedAnswer,
    hiddenOptions = [],
    onAnswerSelect,
    zoomLevel
}: {
    question: Question;
    selectedAnswer?: string;
    hiddenOptions?: string[];
    onAnswerSelect: (answer: string) => void;
    zoomLevel: number;
}) {
    const isAnswered = !!selectedAnswer;
    
    return (
        <div className="space-y-6 zoom-container">
            {/* Question Text */}
            <div className="space-y-3 transition-all duration-200">
                <h2 className="font-bold text-gray-900 leading-snug text-[1.2em] font-poppins">
                    {question.question}
                </h2>
                {question.question_hi && (
                    <p className="text-gray-600 font-hindi leading-relaxed border-l-4 border-indigo-100 pl-3 text-[1.1em]">
                        {question.question_hi}
                    </p>
                )}
            </div>

            {/* Options Grid */}
            <div className="grid gap-3">
                {question.options.map((option, index) => (
                    <QuizOption
                        key={option}
                        option={option}
                        option_hi={question.options_hi?.[index]}
                        isSelected={selectedAnswer === option}
                        isCorrect={option === question.correct}
                        isAnswered={isAnswered}
                        isHidden={hiddenOptions.includes(option)}
                        onClick={() => onAnswerSelect(option)}
                    />
                ))}
            </div>
        </div>
    );
}
