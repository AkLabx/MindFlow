
import React from 'react';
import { Check, X, EyeOff } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface QuizOptionProps {
    option: string;
    option_hi?: string;
    isSelected: boolean;
    isCorrect: boolean;
    isAnswered: boolean;
    isHidden: boolean;
    isMockMode: boolean;
    onClick: () => void;
}

export const QuizOption: React.FC<QuizOptionProps> = ({
    option,
    option_hi,
    isSelected,
    isCorrect,
    isAnswered,
    isHidden,
    isMockMode,
    onClick
}) => {
    // Default / Mock Mode Styles
    let containerClass = "bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50 cursor-pointer relative";
    let icon = <div className="w-5 h-5 rounded-full border-2 border-gray-300 transition-colors group-hover:border-indigo-400 flex-shrink-0" />;
    let textClass = "text-gray-700";
    let animationClass = "";

    // --- MOCK MODE ---
    if (isMockMode) {
        if (isSelected) {
            containerClass = "bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600 relative";
            icon = <div className="w-5 h-5 rounded-full border-[5px] border-indigo-600 flex-shrink-0" />;
            textClass = "text-indigo-800 font-medium";
        }
    } 
    // --- LEARNING MODE ---
    else {
        // In Learning Mode, we remove the left circle dot. 
        // So we set icon to null initially for this mode.
        icon = null;

        if (isHidden) {
             containerClass = "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed shadow-none relative"; 
             textClass = "text-gray-400 line-through decoration-gray-300 decoration-2 select-none";
             // Keep EyeOff absolute as it's a special overlay state
             icon = <div className="absolute right-4"><EyeOff className="w-5 h-5 text-gray-300" /></div>;
        }
        else if (isAnswered) {
            containerClass = "cursor-default relative"; 
            
            if (isCorrect) {
                // Correct Answer (Green)
                containerClass = "bg-green-50 border-green-500 ring-1 ring-green-500 relative";
                textClass = "text-green-900 font-medium"; 
                // Icon as Flex Item (Robust Positioning)
                icon = (
                    <div className="flex-shrink-0 bg-green-500 rounded-full p-1 shadow-sm">
                        <Check className="w-4 h-4 text-white" />
                    </div>
                );
                
                if (isSelected) animationClass = "scale-[1.02] shadow-md";

            } else if (isSelected) {
                // Incorrect Selected (Red)
                containerClass = "bg-red-50 border-red-500 ring-1 ring-red-500 relative";
                textClass = "text-red-900 font-medium";
                // Icon as Flex Item
                icon = (
                    <div className="flex-shrink-0 bg-red-500 rounded-full p-1 shadow-sm">
                        <X className="w-4 h-4 text-white" />
                    </div>
                );
                // Shake Effect
                animationClass = "animate-shake";

            } else if (isCorrect && !isSelected) {
                 // Ghost view of correct answer when user picked wrong
                 containerClass = "bg-green-50/50 border-green-400 border-dashed relative";
                 textClass = "text-green-800";
                 // Icon as Flex Item
                 icon = (
                    <div className="flex-shrink-0 border-2 border-green-500 rounded-full p-0.5">
                         <Check className="w-3 h-3 text-green-500" />
                    </div>
                 );
            } else {
                 // Irrelevant options fade out
                 containerClass = "opacity-50 bg-gray-50 border-gray-200 relative";
            }
        } else if (isSelected) {
            // Should rarely happen in immediate learning mode, but fallback
            containerClass = "bg-indigo-50 border-indigo-600 relative";
            textClass = "text-indigo-900 font-medium";
        }
    }

    return (
        <button
            onClick={!isHidden ? onClick : undefined}
            disabled={isHidden}
            className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group",
                containerClass,
                animationClass
            )}
        >
            {/* Left Icon (Only for Mock Mode) */}
            {isMockMode && (
                <div className="flex-shrink-0">
                    {icon}
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className={cn("leading-snug transition-colors text-[1em] font-poppins selectable-text", textClass)}>
                    {option}
                </div>
                {option_hi && (
                    <div className={cn("mt-1 font-hindi opacity-80 group-hover:opacity-100 transition-opacity text-[0.95em] selectable-text", isHidden && "line-through")}>
                        {option_hi}
                    </div>
                )}
            </div>

            {/* Right Icon / Overlay (Only for Learning Mode) */}
            {!isMockMode && icon}
        </button>
    );
};