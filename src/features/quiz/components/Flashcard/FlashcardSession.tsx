
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Home, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Button } from '../../../../components/Button/Button';
import { Flashcard } from './Flashcard';
import { Idiom, InitialFilters } from '../../types';
import { cn } from '../../../../utils/cn';

interface FlashcardSessionProps {
  idioms: Idiom[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  onFinish: () => void;
  filters: InitialFilters;
}

// Animation variants for the slide effect
const variants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.8,
    rotate: direction > 0 ? 10 : -10, // Subtle rotation on entry
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.8,
    rotate: direction < 0 ? 10 : -10, // Subtle rotation on exit
    transition: { duration: 0.2 }
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const FlashcardSession: React.FC<FlashcardSessionProps> = ({
  idioms,
  currentIndex,
  onNext,
  onPrev,
  onExit,
  onFinish,
  filters
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  // Direction: 1 for Next (Left Swipe), -1 for Prev (Right Swipe)
  const [direction, setDirection] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentIdiom = idioms[currentIndex];
  const progress = ((currentIndex + 1) / idioms.length) * 100;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === idioms.length - 1;

  // Helper to handle navigation with direction
  const paginate = (newDirection: number) => {
    if (newDirection > 0) {
        if (!isLast) {
            setIsFlipped(false); // Reset flip state
            setDirection(newDirection);
            onNext();
        } else {
            // Is last, trigger finish
            onFinish();
        }
    } else {
        if (!isFirst) {
            setIsFlipped(false); // Reset flip state
            setDirection(newDirection);
            onPrev();
        }
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') paginate(1);
        if (e.key === 'ArrowLeft') paginate(-1);
        if (e.key === ' ' || e.key === 'Enter') setIsFlipped(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, isLast, isFirst, onFinish]); 

  // Full Screen Logic
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      setIsFullScreen(true);
      document.documentElement.requestFullscreen?.().catch((e) => console.warn(e));
    } else {
      setIsFullScreen(false);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch((e) => console.warn(e));
      }
    }
  };

  // Sync state with browser native fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Handle Drag End
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: { offset: { x: number, y: number }, velocity: { x: number, y: number } }) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      paginate(1); // Swipe Left -> Next
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1); // Swipe Right -> Prev
    }
  };

  // Calculate Drag Elasticity to restrict movement on edges
  const dragElastic = {
      top: 0,
      bottom: 0,
      // If it's the first card, prevent dragging right (positive x) which triggers Prev
      right: isFirst ? 0 : 0.7,
      // If it's the last card, prevent dragging left (negative x) which triggers Next
      left: isLast ? 0 : 0.7
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col transition-colors duration-300">
      
      {/* Header - Hidden in Full Screen */}
      {!isFullScreen && (
        <>
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
             <div className="flex items-center gap-4">
                <button onClick={onExit} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                   <Home className="w-5 h-5" />
                </button>
                <div>
                   <h1 className="font-bold text-gray-900 text-lg leading-tight">Idioms Flashcards</h1>
                   <p className="text-xs text-gray-500">
                      {filters.examName?.[0] || 'Mixed Set'} • {idioms.length} Cards
                   </p>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
               <div className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-sm">
                  {currentIndex + 1} / {idioms.length}
               </div>
               <button 
                 onClick={toggleFullScreen}
                 className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                 aria-label="Enter Full Screen"
               >
                 <Maximize2 className="w-5 h-5" />
               </button>
             </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 w-full bg-gray-200">
             <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative bg-gray-100">
         
         {/* Floating Exit Full Screen Button */}
         {isFullScreen && (
           <button 
             onClick={toggleFullScreen}
             className="absolute top-4 right-4 z-30 p-3 bg-white/20 backdrop-blur-md hover:bg-white/40 border border-white/30 rounded-full text-gray-600 shadow-lg transition-all"
             aria-label="Exit Full Screen"
           >
             <Minimize2 className="w-6 h-6 text-gray-800" />
           </button>
         )}

         <div className={cn(
             "relative w-full max-w-md transition-all duration-300",
             isFullScreen ? "h-[80vh] md:h-[70vh] max-w-lg" : "h-[500px] md:h-[600px]"
           )}
         >
            <AnimatePresence initial={false} custom={direction}>
              {currentIdiom ? (
                 <motion.div
                    key={currentIdiom.id}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={dragElastic}
                    dragDirectionLock={true} // CRITICAL: Locks drag to X-axis to allow vertical scrolling
                    onDragEnd={handleDragEnd}
                    onTap={() => setIsFlipped(!isFlipped)} // Detects taps only (not drags)
                    className="absolute w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
                    style={{ touchAction: 'pan-y' }} // Explicitly allow vertical scroll
                 >
                    <Flashcard idiom={currentIdiom} isFlipped={isFlipped} />
                 </motion.div>
              ) : (
                  <div className="h-full w-full flex items-center justify-center bg-white rounded-3xl shadow-sm">
                      <p className="text-gray-400">No flashcards available.</p>
                  </div>
              )}
            </AnimatePresence>
         </div>

      </div>

      {/* Footer Controls - Always Visible */}
      <div className="bg-white border-t border-gray-200 p-4 md:p-6 sticky bottom-0 z-20 safe-area-bottom">
         <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <Button 
               variant="outline" 
               onClick={() => paginate(-1)} 
               disabled={isFirst}
               className="flex-1 justify-center"
            >
               <ArrowLeft className="w-4 h-4 mr-2" /> Previous
            </Button>

            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:block">
               Tap flip • Swipe nav
            </div>

            <Button 
               onClick={() => isLast ? onFinish() : paginate(1)} 
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
