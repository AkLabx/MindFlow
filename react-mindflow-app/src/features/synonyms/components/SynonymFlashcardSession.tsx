import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Home, RotateCcw, Maximize2, Minimize2, RotateCw, Menu } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Button } from '../../../components/Button/Button';
import { SynonymCard } from './SynonymCard';
import { SynonymNavigationPanel } from './SynonymNavigationPanel';
import { SynonymWord } from '../../quiz/types';
import { cn } from '../../../utils/cn';

interface PanInfo {
  point: { x: number; y: number };
  delta: { x: number; y: number };
  offset: { x: number; y: number };
  velocity: { x: number; y: number };
}

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
  filters
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Motion Values for Physics
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Tilt card based on horizontal drag
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  // Fade out opacity near edges
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);

  const currentItem = data[currentIndex];
  const progress = ((currentIndex + 1) / data.length) * 100;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === data.length - 1;

  // Reset card position on index change
  useEffect(() => {
    x.set(0);
  }, [currentIndex, x]);

  // Keyboard navigation
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

  const handleManualNavigation = async (direction: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);

    try {
      if (direction === 'next') {
        if (isLast) {
          onFinish();
        } else {
          // Animate out left
          await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
          setIsFlipped(false);
          onNext();
          // Reset right
          x.set(500);
          await controls.start({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } });
        }
      } else {
        if (!isFirst) {
          // Animate out right
          await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } });
          setIsFlipped(false);
          onPrev();
          // Reset left
          x.set(-500);
          await controls.start({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } });
        }
      }
    } finally {
      setIsAnimating(false);
    }
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const threshold = 100;
    const swipePower = Math.abs(info.offset.x) * info.velocity.x;

    const isIntentionalSwipe = Math.abs(info.offset.x) > threshold || Math.abs(swipePower) > 10000;

    if (isIntentionalSwipe) {
      const isRightSwipe = info.offset.x > 0;
      const isLeftSwipe = info.offset.x < 0;

      if (isLeftSwipe) {
        if (!isLast) {
          setIsAnimating(true);
          await controls.start({ x: -1000, opacity: 0, transition: { duration: 0.2 } });
          setIsFlipped(false);
          onNext();
          x.set(1000);
          await controls.start({ x: 0, opacity: 1 });
          setIsAnimating(false);
        } else {
          await controls.start({ x: -1000, opacity: 0 });
          onFinish();
        }
      } else if (isRightSwipe) {
        if (!isFirst) {
          setIsAnimating(true);
          await controls.start({ x: 1000, opacity: 0, transition: { duration: 0.2 } });
          setIsFlipped(false);
          onPrev();
          x.set(-1000);
          await controls.start({ x: 0, opacity: 1 });
          setIsAnimating(false);
        } else {
          controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
        }
      }
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
    }
  };

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      setIsFullScreen(true);
      document.documentElement.requestFullscreen?.().catch(console.warn);
    } else {
      setIsFullScreen(false);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(console.warn);
    }
  };

  const handleJump = (index: number) => {
    setIsFlipped(false);
    onJump(index);
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-gray-100 dark:bg-gray-800 flex flex-col overflow-hidden">

      <SynonymNavigationPanel
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        data={data}
        currentIndex={currentIndex}
        onJump={handleJump}
      />

      {/* Header */}
      {!isFullScreen && (
        <div className="flex-none z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onExit} className="p-2 hover:bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                <Home className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Synonym Master</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filters?.phase ? `Phase ${filters.phase}` : 'Mixed Set'} • {data.length} Cards
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg text-sm hidden sm:block">
                {currentIndex + 1} / {data.length}
              </div>
              <button onClick={() => setIsNavOpen(true)} className="p-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors" aria-label="Open Map">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={toggleFullScreen} className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300">
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Card Arena */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">

        {isFullScreen && (
          <button onClick={toggleFullScreen} className="absolute top-4 right-4 z-30 p-3 bg-white dark:bg-gray-800/20 backdrop-blur-md rounded-full text-gray-800 dark:text-gray-100 shadow-lg hover:bg-white dark:hover:bg-gray-800/40 transition-colors">
            <Minimize2 className="w-6 h-6" />
          </button>
        )}

        <div className={cn(
          "relative w-full max-w-md transition-all duration-300 perspective-1000 z-10",
          isFullScreen ? "h-[80vh] md:h-[70vh] max-w-lg" : "h-[60vh] max-h-[600px]"
        )}
        >
          {currentItem ? (
            <motion.div
              key={currentItem.word} // Use word as key since synonym data might not have unique ID
              style={{
                x,
                rotate,
                opacity,
                touchAction: 'pan-y',
                cursor: isAnimating ? 'default' : 'grab'
              } as any}
              animate={controls}
              drag={isAnimating ? false : "x"}
              dragDirectionLock={false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd as any}
              onTap={() => !isAnimating && setIsFlipped(!isFlipped)}
              className="absolute w-full h-full select-none touch-callout-none active:cursor-grabbing"
            >
              <SynonymCard data={currentItem} serialNumber={currentIndex + 1} isFlipped={isFlipped} />
            </motion.div>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm">
              <p className="text-gray-400">No cards available.</p>
            </div>
          )}
        </div>

        {/* Hint */}
        <div className="absolute bottom-8 text-gray-400 text-xs font-medium uppercase tracking-widest animate-pulse pointer-events-none select-none z-0">
          {isFlipped ? "Scroll to read • Swipe to Next" : "Tap to flip"}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex-none z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 md:p-6 pb-safe">
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
            className="p-3 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer active:scale-95 transition-transform"
          >
            <RotateCw className={cn("w-6 h-6", isAnimating && "opacity-50")} />
          </div>

          <Button
            onClick={() => handleManualNavigation('next')}
            disabled={isAnimating}
            className="flex-1 justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
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
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1.5rem); }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};
