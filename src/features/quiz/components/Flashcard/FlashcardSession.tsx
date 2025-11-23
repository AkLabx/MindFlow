
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Home, RotateCcw, Maximize2, Minimize2, RotateCw } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
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
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // Prevent interaction spam
  
  // Motion Values for Physics
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  // Physics: Rotate card based on X distance (x / 15 degrees)
  // Example: Drag 150px right -> Rotate 10deg
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  
  // Opacity fade on extreme edges to cue exit
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);

  const currentIdiom = idioms[currentIndex];
  const progress = ((currentIndex + 1) / idioms.length) * 100;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === idioms.length - 1;

  // Reset position when index changes. 
  // Note: Flip reset is handled in navigation functions to avoid render flash.
  useEffect(() => {
    x.set(0); 
  }, [currentIndex, x]);

  // --- KEYBOARD SUPPORT ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (isAnimating) return;
        if (e.key === 'ArrowRight') handleManualNavigation('next');
        if (e.key === 'ArrowLeft') handleManualNavigation('prev');
        if (e.key === ' ' || e.key === 'Enter') setIsFlipped(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isLast, isFirst, isAnimating]); 

  // --- MANUAL NAVIGATION (Buttons) ---
  const handleManualNavigation = async (direction: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);

    try {
        if (direction === 'next') {
            if (isLast) {
                onFinish();
            } else {
                // Animate off screen right
                await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
                
                // Critical: Reset flip state BEFORE changing index to prevent "back side" flash
                setIsFlipped(false);
                onNext();
                
                // Reset instantly off-screen then spring back in
                x.set(500); 
                await controls.start({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } });
            }
        } else {
            if (!isFirst) {
                // Animate off screen left
                await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } });
                
                setIsFlipped(false);
                onPrev();
                
                x.set(-500);
                await controls.start({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } });
            }
        }
    } finally {
        setIsAnimating(false);
    }
  };

  // --- SWIPE LOGIC ---
  const handleDragEnd = async (event: any, info: PanInfo) => {
    const threshold = 100; // Pixel distance to commit
    const swipePower = Math.abs(info.offset.x) * info.velocity.x;

    const isIntentionalSwipe = Math.abs(info.offset.x) > threshold || Math.abs(swipePower) > 10000;

    if (isIntentionalSwipe) {
        const isRightSwipe = info.offset.x > 0; // Dragging Right -> Prev
        const isLeftSwipe = info.offset.x < 0;  // Dragging Left -> Next

        if (isLeftSwipe) {
            if (!isLast) {
                setIsAnimating(true);
                // Commit: Fly away to left
                await controls.start({ x: -1000, opacity: 0, transition: { duration: 0.2 } });
                
                setIsFlipped(false);
                onNext();
                
                // Reset position for next card (enter from right)
                x.set(1000); 
                await controls.start({ x: 0, opacity: 1 });
                setIsAnimating(false);
            } else {
                // Last card: Fly away and Finish
                await controls.start({ x: -1000, opacity: 0 });
                onFinish();
            }
        } else if (isRightSwipe) {
            if (!isFirst) {
                setIsAnimating(true);
                // Commit: Fly away to right
                await controls.start({ x: 1000, opacity: 0, transition: { duration: 0.2 } });
                
                setIsFlipped(false);
                onPrev();
                
                // Reset position for next card (enter from left)
                x.set(-1000);
                await controls.start({ x: 0, opacity: 1 });
                setIsAnimating(false);
            } else {
                // First card: Spring back (cannot go prev)
                controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
            }
        }
    } else {
        // Reset: Spring back to center if threshold not met
        controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
    }
  };

  // --- FULL SCREEN ---
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      setIsFullScreen(true);
      document.documentElement.requestFullscreen?.().catch(console.warn);
    } else {
      setIsFullScreen(false);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(console.warn);
    }
  };

  return (
    // Native Feel: Fixed inset, no body scroll, flex column layout
    <div className="fixed inset-0 h-[100dvh] w-full bg-gray-100 flex flex-col overflow-hidden">
      
      {/* Header - Sticky/Fixed at top via flex layout */}
      {!isFullScreen && (
        <div className="flex-none z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
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
               <button onClick={toggleFullScreen} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600">
                 <Maximize2 className="w-5 h-5" />
               </button>
             </div>
          </div>
          <div className="h-1 w-full bg-gray-200">
             <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Card Arena - Takes all available space */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
         
         {isFullScreen && (
           <button onClick={toggleFullScreen} className="absolute top-4 right-4 z-30 p-3 bg-white/20 backdrop-blur-md rounded-full text-gray-800 shadow-lg">
             <Minimize2 className="w-6 h-6" />
           </button>
         )}

         <div className={cn(
             "relative w-full max-w-md transition-all duration-300 perspective-1000 z-10",
             isFullScreen ? "h-[80vh] md:h-[70vh] max-w-lg" : "h-[60vh] max-h-[600px]"
           )}
         >
            {currentIdiom ? (
                <motion.div
                    key={currentIdiom.id}
                    style={{ 
                        x, 
                        rotate, 
                        opacity,
                        touchAction: 'pan-y', // CRITICAL: Browser handles vertical scroll, JS handles horizontal
                        cursor: isAnimating ? 'default' : 'grab'
                    }}
                    animate={controls}
                    
                    // Drag Configuration
                    drag={isAnimating ? false : "x"} // Disable drag during animation
                    dragDirectionLock={true} 
                    dragConstraints={{ left: 0, right: 0 }} 
                    dragElastic={0.7} 
                    
                    // Event Handlers
                    onDragEnd={handleDragEnd}
                    onTap={() => !isAnimating && setIsFlipped(!isFlipped)} // Prevent tap during transition
                    
                    // CSS Hardening for Ghost Clicks
                    className="absolute w-full h-full select-none touch-callout-none active:cursor-grabbing"
                >
                    <Flashcard idiom={currentIdiom} isFlipped={isFlipped} />
                </motion.div>
            ) : (
                <div className="h-full w-full flex items-center justify-center bg-white rounded-3xl shadow-sm">
                    <p className="text-gray-400">No flashcards available.</p>
                </div>
            )}
         </div>
         
         {/* Hint for user */}
         <div className="absolute bottom-8 text-gray-400 text-xs font-medium uppercase tracking-widest animate-pulse pointer-events-none select-none z-0">
            {isFlipped ? "Scroll to read • Swipe to Next" : "Tap to flip"}
         </div>
      </div>

      {/* Footer Controls - Sticky/Fixed at bottom */}
      <div className="flex-none z-30 bg-white border-t border-gray-200 p-4 md:p-6 pb-safe">
         <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <Button 
               variant="outline" 
               onClick={() => handleManualNavigation('prev')} 
               disabled={isFirst || isAnimating}
               className="flex-1 justify-center"
            >
               <ArrowLeft className="w-4 h-4 mr-2" /> Previous
            </Button>

            <div 
                onClick={() => !isAnimating && setIsFlipped(!isFlipped)}
                className="p-3 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 cursor-pointer active:scale-95 transition-transform"
            >
                <RotateCw className={cn("w-6 h-6", isAnimating && "opacity-50")} />
            </div>

            <Button 
               onClick={() => handleManualNavigation('next')} 
               disabled={isAnimating}
               className="flex-1 justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
            >
               {isLast ? (
                   <>Finish <RotateCcw className="w-4 h-4 ml-2" /></>
               ) : (
                   <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
               )}
            </Button>
         </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .touch-callout-none { -webkit-touch-callout: none; }
        /* Safe area padding for iOS home indicator */
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1.5rem); }
      `}</style>
    </div>
  );
};
