
import React, { useMemo, useEffect } from 'react';
import { Question } from '../types';
import { QuizOption } from './QuizOption';
import { AiExplanationButton } from './AiExplanationButton';
import { Clock, Hash, Calendar, FileText, Volume2, Square, Loader2 } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

// --- Basic Client-Side Sanitizer ---
// Prevents XSS by stripping scripts and event handlers while keeping formatting.
const sanitizeHTML = (html: string) => {
    if (!html) return "";
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 1. Remove dangerous tags completely
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'link', 'style', 'meta'];
    dangerousTags.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach(el => el.remove());
    });

    // 2. Remove dangerous attributes (on* events, javascript: links)
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
        const attributes = Array.from(el.attributes);
        attributes.forEach(attr => {
            if (attr.name.startsWith('on')) {
                el.removeAttribute(attr.name); // Remove onclick, onerror, etc.
            }
            if (attr.name === 'href' && attr.value.toLowerCase().includes('javascript:')) {
                el.removeAttribute('href'); // Remove javascript: links
            }
        });
    });

    return doc.body.innerHTML;
};

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
    const { speak, stop, isPlaying, isLoading } = useTextToSpeech();

    // Stop audio when question changes
    useEffect(() => {
        stop();
    }, [question.id, stop]);
    
    // Helper to safely render HTML content after sanitization
    const createSafeMarkup = (html: string) => {
        return { __html: sanitizeHTML(html) };
    };

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
                    {/* Exam Shift Detail - Now visible on all screens and beside exam name */}
                    {question.sourceInfo?.examDateShift && (
                        <span className="flex items-center gap-1 text-gray-400 border-l border-gray-200 pl-2 ml-1">
                            <Calendar className="w-3 h-3" />
                            {question.sourceInfo.examDateShift}
                        </span>
                    )}
                </div>
                
                {/* Right side intentionally left empty for future use or balancing */}
            </div>

            {/* Question Text */}
            <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                    {/* Removed font-bold, standardized to text-base/text-lg via zoomLevel.
                        Updated styles to be consistent with options. 
                        Added relative z-10 and stopPropagation to ensure text selection works robustly on mobile.
                    */}
                    <div 
                        className="text-gray-900 leading-relaxed font-poppins flex-1 selectable-text relative z-10 [&_pre]:whitespace-pre-wrap [&_pre]:font-inherit [&_pre]:my-2 [&_pre]:bg-gray-50 [&_pre]:p-2 [&_pre]:rounded-md [&_pre]:border [&_pre]:border-gray-200"
                        dangerouslySetInnerHTML={createSafeMarkup(question.question)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    />
                    
                    {/* Show Time Spent in Review Mode (if userTime provided) */}
                    {userTime !== undefined && (
                        <div className="flex items-center gap-1 text-[0.7em] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap select-none self-start">
                            <Clock className="w-3 h-3" /> {userTime}s
                        </div>
                    )}
                </div>

                {/* AI Explanation Button - Only in Learning Mode after answering */}
                {isAnswered && !isMockMode && (
                   <div className="flex justify-end -mt-2 mb-2">
                       <AiExplanationButton question={question} selectedAnswer={selectedAnswer} />
                   </div>
                )}

                {question.question_hi && (
                    <div className="relative group">
                        <div
                            className="text-gray-800 font-hindi leading-relaxed border-l-4 border-indigo-100 pl-4 pr-12 selectable-text relative z-10 [&_pre]:whitespace-pre-wrap [&_pre]:font-inherit [&_pre]:my-2 [&_pre]:bg-gray-50 [&_pre]:p-2 [&_pre]:rounded-md [&_pre]:border [&_pre]:border-gray-200"
                            dangerouslySetInnerHTML={createSafeMarkup(question.question_hi)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={() => {
                                if (isPlaying) {
                                    stop();
                                } else {
                                    // Use a temporary element to strip HTML and decode entities
                                    const tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = question.question_hi || '';
                                    const textContent = tempDiv.textContent || tempDiv.innerText || '';
                                    speak(textContent);
                                }
                            }}
                            disabled={isLoading}
                            className={`absolute top-0 right-0 p-2 rounded-full transition-all shadow-sm border ${
                                isPlaying
                                    ? 'text-red-600 bg-red-100 border-red-200 hover:bg-red-200 shadow-red-100'
                                    : 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 shadow-indigo-100'
                            } active:scale-95`}
                            title={isPlaying ? "Stop reading" : "Read question in Hindi"}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isPlaying ? (
                                <Square className="w-5 h-5 fill-current" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </button>
                    </div>
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
                        isMockMode={isMockMode}
                        onClick={() => onAnswerSelect(option)}
                    />
                ))}
            </div>
        </div>
    );
}
