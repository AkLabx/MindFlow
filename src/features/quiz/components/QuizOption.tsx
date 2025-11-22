
import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface QuizOptionProps {
    option: string;
    option_hi?: string;
    isSelected: boolean;
    isCorrect: boolean;
    isAnswered: boolean;
    isHidden: boolean;
    onClick: () => void;
}

export const QuizOption: React.FC<QuizOptionProps> = ({
    option,
    option_hi,
    isSelected,
    isCorrect,
    isAnswered,
    isHidden,
    onClick
}) => {
    // Visual State Logic
    let containerClass = "bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50";
    let icon = <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    let textClass = "text-gray-700";
    let animationClass = "";

    // 50-50 Elimination Logic (Visual Only)
    if (isHidden) {
        containerClass = "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed";
        textClass = "text-gray-400 line-through decoration-gray-400 decoration-2";
        // We render it, but disabled and styled as crossed out
    } else if (isAnswered) {
        if (isCorrect) {
            containerClass = "bg-green-50 border-green-500 ring-1 ring-green-500";
            icon = <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>;
            textClass = "text-green-800 font-medium";
            // Correct Answer Animation
            if (isSelected) animationClass = "scale-[1.02] shadow-md";
        } else if (isSelected) {
            // Incorrect Selected Answer
            containerClass = "bg-red-50 border-red-500 ring-1 ring-red-500";
            icon = <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"><X className="w-3 h-3 text-white" /></div>;
            textClass = "text-red-800 font-medium";
            // Incorrect Shake Animation
            animationClass = "animate-shake";
        } else if (isCorrect && !isSelected) {
             // Missed correct answer (Ghost view)
             containerClass = "bg-green-50/50 border-green-400 border-dashed";
             icon = <div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center"><Check className="w-3 h-3 text-green-500" /></div>;
             textClass = "text-green-700";
        } else {
             // Other incorrect options
             containerClass = "opacity-50 bg-gray-50";
        }
    } else if (isSelected) {
        containerClass = "bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600";
        icon = <div className="w-5 h-5 rounded-full border-[5px] border-indigo-600" />;
        textClass = "text-indigo-800 font-medium";
    }

    return (
        <button
            onClick={!isHidden ? onClick : undefined}
            disabled={isAnswered || isHidden}
            className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group relative overflow-hidden",
                containerClass,
                animationClass
            )}
            style={{
                // Ensure blur is applied if hidden
                filter: isHidden ? 'blur(0.5px)' : 'none'
            }}
        >
            <div className="flex-shrink-0">
                {icon}
            </div>
            <div className="flex-1">
                <div className={cn("leading-snug transition-colors text-[1em] font-poppins", textClass)}>
                    {option}
                </div>
                {option_hi && (
                    <div className={cn("mt-1 font-hindi opacity-80 group-hover:opacity-100 transition-opacity text-[0.9em]", isHidden && "line-through")}>
                        {option_hi}
                    </div>
                )}
            </div>
        </button>
    );
};
