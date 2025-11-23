
import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Home, RotateCcw } from 'lucide-react';
import { Button } from '../../../../components/Button/Button';
import { Flashcard } from './Flashcard';
import { Idiom, InitialFilters } from '../../types';
import { ProgressBar } from '../../../../components/ui/ProgressBar';

interface FlashcardSessionProps {
  idioms: Idiom[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  filters: InitialFilters;
}

export const FlashcardSession: React.FC<FlashcardSessionProps> = ({
  idioms,
  currentIndex,
  onNext,
  onPrev,
  onExit,
  filters
}) => {
  const currentIdiom = idioms[currentIndex];
  const progress = ((currentIndex + 1) / idioms.length) * 100;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === idioms.length - 1;

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') onNext();
        if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
         <div className="flex items-center gap-4">
            <button onClick={onExit} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
               <Home className="w-5 h-5" />
            </button>
            <div>
               <h1 className="font-bold text-gray-900 text-lg">Idioms Flashcards</h1>
               <p className="text-xs text-gray-500">
                  {filters.examName?.[0] || 'Mixed Set'} • {idioms.length} Cards
               </p>
            </div>
         </div>
         <div className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
            {currentIndex + 1} / {idioms.length}
         </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-gray-200">
         <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
         
         <div className="w-full max-w-md h-[500px] md:h-[600px] relative">
            {currentIdiom ? (
               <Flashcard idiom={currentIdiom} />
            ) : (
                <div className="h-full w-full flex items-center justify-center bg-white rounded-3xl shadow-sm">
                    <p className="text-gray-400">No flashcards available.</p>
                </div>
            )}
         </div>

      </div>

      {/* Footer Controls */}
      <div className="bg-white border-t border-gray-200 p-4 md:p-6 sticky bottom-0 z-20">
         <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <Button 
               variant="outline" 
               onClick={onPrev} 
               disabled={isFirst}
               className="flex-1 justify-center"
            >
               <ArrowLeft className="w-4 h-4 mr-2" /> Previous
            </Button>

            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:block">
               Tap card to flip
            </div>

            <Button 
               onClick={isLast ? onExit : onNext} 
               className="flex-1 justify-center bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-200"
            >
               {isLast ? (
                   <>Finish <RotateCcw className="w-4 h-4 ml-2" /></>
               ) : (
                   <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
               )}
            </Button>
         </div>
      </div>

    </div>
  );
};