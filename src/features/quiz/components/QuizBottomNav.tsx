import React from 'react';
import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Button } from '../../../components/Button/Button';

export function QuizBottomNav({ 
    onPrevious, 
    onNext, 
    onToggleMarkForReview, 
    isMarked, 
    isFirst, 
    isLast, 
    isAnswered 
}: {
    onPrevious: () => void;
    onNext: () => void;
    onToggleMarkForReview: () => void;
    isMarked: boolean;
    isFirst: boolean;
    isLast: boolean;
    isAnswered: boolean;
}) {
    return (
        <div className="flex items-center justify-between pt-6 mt-auto border-t border-gray-100 bg-white z-10">
            <Button 
                variant="ghost" 
                onClick={onPrevious} 
                disabled={isFirst}
                className="text-gray-500 hover:text-indigo-600"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Prev
            </Button>

            <button 
                onClick={onToggleMarkForReview}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    isMarked 
                        ? "bg-purple-100 text-purple-700 border border-purple-200" 
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent"
                )}
            >
                <Flag className={cn("w-4 h-4", isMarked ? "fill-current" : "")} />
                {isMarked ? 'Marked for Review' : 'Mark for Review'}
            </button>

            <Button 
                onClick={onNext} 
                disabled={!isAnswered} // Enforce answering before moving next? Or allow skipping? Original code disabled it.
                className={cn(
                    "pl-6 pr-4", 
                    isLast ? "bg-green-600 hover:bg-green-700" : ""
                )}
            >
                {isLast ? 'Finish Quiz' : 'Next'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
    );
}