
import React from 'react';
import { Question } from '../types';
import { QuizOption } from './QuizOption';
import { Clock } from 'lucide-react';

export function QuizQuestionDisplay({
    question,
    selectedAnswer,
    hiddenOptions = [],
    onAnswerSelect,
    zoomLevel,
    isMockMode = false, // New prop with default
    userTime // Optional time spent
}: {
    question: Question;
    selectedAnswer?: string;
    hiddenOptions?: string[];
    onAnswerSelect: (answer: string) => void;
    zoomLevel: number;
    isMockMode?: boolean;
    userTime?: number;
}) {
    const isAnswered = !!selectedAnswer;
    
    return (
        <div className="space-y-6 zoom-container">
            {/* Question Text */}
            <div className="space-y-3 transition-all duration-200 selectable-text">
                <div className="flex justify-between items-start">
                    <h2 className="font-bold text-gray-900 leading-snug text-[1.2em] font-poppins flex-1">
                        {question.question}
                    </h2>
                    
                    {/* Show Time Spent in Review Mode (if userTime provided) */}
                    {userTime !== undefined && (
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-2 whitespace-nowrap select-none">
                            <Clock className="w-3 h-3" /> {userTime}s
                        </div>
                    )}
                </div>

                {question.question_hi && (
                    <p className="text-gray-600 font-hindi leading-relaxed border-l-4 border-indigo-100 pl-3 text-[1.1em]">
                        {question.question_hi}
                    </p>
                )}
            </div>

            {/* Options Grid */}
            <div className="grid gap-3 selectable-text">
                {question.options.map((option, index) => (
                    <QuizOption
                        key={option}
                        option={option}
                        option_hi={question.options_hi?.[index]}
                        isSelected={selectedAnswer === option}
                        isCorrect={option === question.correct}
                        isAnswered={isAnswered}
                        isHidden={hiddenOptions.includes(option)}
                        isMockMode={isMockMode}
                        onClick={() => onAnswerSelect(option)}
                    />
                ))}
            </div>
        </div>
    );
}
