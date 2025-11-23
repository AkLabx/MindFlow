
import React from 'react';
import { Question } from '../types';
import { QuizOption } from './QuizOption';
import { Clock, Hash, Calendar, FileText } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

export function QuizQuestionDisplay({
    question,
    selectedAnswer,
    hiddenOptions = [],
    onAnswerSelect,
    zoomLevel,
    isMockMode = false,
    userTime
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
        <div 
            className="space-y-6 transition-all duration-200 ease-out"
            style={{ fontSize: `${zoomLevel}rem` }} // Applies zoom to everything inside
        >
            {/* Metadata Header - Visible in all modes */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100 text-[0.75rem] text-gray-400 font-medium select-none">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">
                         <Hash className="w-3 h-3" /> {question.id}
                    </span>
                    {question.sourceInfo?.examName && (
                        <span className="flex items-center gap-1 text-indigo-400">
                            <FileText className="w-3 h-3" />
                            {question.sourceInfo.examName} {question.sourceInfo.examYear}
                        </span>
                    )}
                </div>
                {question.sourceInfo?.examDateShift && (
                    <span className="flex items-center gap-1 text-gray-400 hidden sm:flex">
                        <Calendar className="w-3 h-3" />
                        {question.sourceInfo.examDateShift}
                    </span>
                )}
            </div>

            {/* Question Text */}
            <div className="space-y-4 selectable-text">
                <div className="flex justify-between items-start gap-4">
                    <h2 className="font-bold text-gray-900 leading-relaxed text-[1.15em] font-poppins flex-1">
                        {question.question}
                    </h2>
                    
                    {/* Show Time Spent in Review Mode (if userTime provided) */}
                    {userTime !== undefined && (
                        <div className="flex items-center gap-1 text-[0.7em] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap select-none self-start">
                            <Clock className="w-3 h-3" /> {userTime}s
                        </div>
                    )}
                </div>

                {question.question_hi && (
                    <p className="text-gray-600 font-hindi leading-relaxed border-l-4 border-indigo-100 pl-4 text-[1.1em]">
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
