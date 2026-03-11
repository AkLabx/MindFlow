import React, { useState, useEffect } from 'react';
import { SynonymWord } from '../../quiz/types';
import { useSynonymProgress } from '../hooks/useSynonymProgress';

interface SynonymFlashcardSessionProps {
  data: SynonymWord[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  onFinish: () => void;
  filters: any;
  onJump: (index: number) => void;
}

export const SynonymFlashcardSession: React.FC<SynonymFlashcardSessionProps> = ({
  data,
  currentIndex,
  onNext,
  onPrev,
  onExit,
  onFinish,
  onJump,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const onTouchEndEvent = (e: React.TouchEvent) => {
    if (!touchStart) return;

    // Use changedTouches for the end position as touches might be empty.
    const end = e.changedTouches[0].clientX;

    const distance = touchStart - end;

    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && !isLast) {
      handleNext();
    } else if (isRightSwipe && !isFirst) {
      onPrev();
    }

    // reset
    setTouchStart(null);
    setTouchEnd(null);
  };


  const { progress, markMastered, getStatus } = useSynonymProgress();

  const currentWord = data[currentIndex];
  const isLast = currentIndex === data.length - 1;
  const isFirst = currentIndex === 0;

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  if (!currentWord) return null;

  const status = getStatus(currentWord);

  const handleNext = () => {
    if (isLast) onFinish();
    else onNext();
  };

  const getHeatmapColor = (score: number) => {
    if (score > 10) return 'text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    if (score >= 5) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 w-full overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10">
        <button onClick={onExit} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-2">
          ← Exit
        </button>
        <div className="font-medium text-slate-800 dark:text-slate-200">
          {currentIndex + 1} / {data.length}
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative p-4 flex flex-col items-center justify-center" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEndEvent}>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / data.length) * 100}%` }} />

        {/* Card Container */}
        <div
          className="relative w-full max-w-lg aspect-[3/4] cursor-pointer group perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

            {/* FRONT OF CARD */}
            <div className={`absolute w-full h-full backface-hidden rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 text-center
              ${status === 'mastered' ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>

              <div className="absolute top-4 right-4 flex items-center gap-2">
                {currentWord.importance_score > 10 && <span className="text-2xl" title="High Frequency">🔥</span>}
                {currentWord.importance_score >= 5 && currentWord.importance_score <= 10 && <span className="text-xl" title="Medium Frequency">⭐</span>}
              </div>

              {status === 'familiar' && (
                <div className="absolute top-4 left-4 flex items-center gap-1 text-amber-500 font-medium bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md text-sm">
                  🟡 Familiar
                </div>
              )}
              {status === 'mastered' && (
                <div className="absolute top-4 left-4 flex items-center gap-1 text-green-600 font-medium bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md text-sm">
                  🟢 Mastered
                </div>
              )}

              <h2 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white mb-6">
                {currentWord.word}
              </h2>

              {currentWord.pos && (
                <span className="text-lg text-slate-500 dark:text-slate-400 italic mb-4">
                  {currentWord.pos}
                </span>
              )}

              <div className="text-sm text-slate-400 mt-auto">
                Tap to flip
              </div>
            </div>

            {/* BACK OF CARD */}
            <div className="absolute w-full h-full backface-hidden rounded-2xl shadow-xl p-6 md:p-8 flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rotate-y-180 overflow-y-auto">

               <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                 <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">{currentWord.word}</h3>
                 <p className="text-xl text-blue-600 dark:text-blue-400 font-medium mb-3">{currentWord.hindiMeaning}</p>
                 <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">{currentWord.meaning}</p>
               </div>

               <div className="flex-1">
                 <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Top Synonyms</h4>
                 <ul className="space-y-3">
                   {currentWord.synonyms?.map((syn, idx) => (
                     <li key={idx} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                       <span className="font-bold text-slate-800 dark:text-slate-200 mr-2">{syn.text}</span>
                       <span className="text-slate-500 dark:text-slate-400 text-sm">({syn.hindiMeaning})</span>
                     </li>
                   ))}
                 </ul>

                 {currentWord.confusable_with?.length > 0 && (
                   <div className="mt-6 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/50">
                     <span className="text-orange-800 dark:text-orange-300 text-sm font-medium">
                       ⚠️ Confusable with: <strong>{currentWord.confusable_with.join(', ')}</strong>
                     </span>
                   </div>
                 )}
               </div>

               {/* Action Buttons on Back */}
               <div className="mt-6 flex justify-center pt-4 border-t border-slate-100 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                 {status !== 'mastered' ? (
                   <button
                     onClick={() => {
                        markMastered(currentWord);
                        // automatically move to next card after a tiny delay
                        setTimeout(() => handleNext(), 400);
                     }}
                     className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-full font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 w-full justify-center"
                   >
                     ✓ Mark as Mastered
                   </button>
                 ) : (
                   <div className="text-green-600 dark:text-green-400 font-bold flex items-center justify-center gap-2 py-3 w-full border-2 border-green-200 dark:border-green-800 rounded-full">
                     🟢 Mastered
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-10 pb-10 md:pb-6">
        {isFirst ? (
          <div className="px-6 py-3 w-[120px]"></div> /* Placeholder to keep spacing */
        ) : (
          <button
            onClick={onPrev}
            className="px-6 py-3 rounded-xl font-bold transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 w-[120px]"
          >
            Previous
          </button>
        )}
        {isLast ? (
          <div className="px-8 py-3 w-[120px]"></div> /* Placeholder to keep spacing */
        ) : (
          <button
            onClick={handleNext}
            className="px-8 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md shadow-blue-500/30 w-[120px]"
          >
            Next
          </button>
        )}
      </div>

      {/* Custom CSS for 3D flip (if tailwind plugins missing) */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};
