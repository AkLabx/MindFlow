import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Home, RotateCcw, Maximize2, Minimize2, RotateCw, Menu } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Button } from '../../../components/Button/Button';
import { OWSCard } from './OWSCard';
import { OWSNavigationPanel } from './OWSNavigationPanel';
import { OneWord, InitialFilters } from '../../quiz/types';
import { cn } from '../../../utils/cn';

/**
 * Interface for Framer Motion pan gesture info.
 */
interface PanInfo {
  point: { x: number; y: number };
  delta: { x: number; y: number };
  offset: { x: number; y: number };
  velocity: { x: number; y: number };
}

/**
 * Props for the OWSSession component.
 */
interface OWSSessionProps {
  /** The list of OWS data items for the session. */
  data: OneWord[];
  /** The current index in the list. */
  currentIndex: number;
  /** Callback for moving to the next card. */
  onNext: () => void;
  /** Callback for moving to the previous card. */
  onPrev: () => void;
  /** Callback to exit the session. */
  onExit: () => void;
  /** Callback to finish the session. */
  onFinish: () => void;
  /** Callback to jump to a specific index. */
  onJump: (index: number) => void;
  /** Active filters for display. */
  filters: InitialFilters;
}

/**
 * The main container for the One Word Substitution learning session.
 *
 * This component mirrors the `FlashcardSession` logic but is specialized for OWS data.
 * It features:
 * - Tinder-like card swiping (Next/Previous).
 * - Animated 3D flipping.
 * - Progress tracking.
 * - Fullscreen toggle.
 * - Keyboard shortcuts.
 *
 * @param {OWSSessionProps} props - The component props.
 * @returns {JSX.Element} The rendered OWS Session.
 */
export const OWSSession: React.FC<OWSSessionProps> = ({
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

  /**
   * Handles click-based navigation with animations.
   * @param {'next' | 'prev'} direction
   */
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

  /**
   * Handles gesture-based navigation (swipes).
   */
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
    <div className="fixed inset-0 h-[100dvh] w-full bg-gray-100 flex flex-col overflow-hidden">

      <OWSNavigationPanel
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        data={data}
        currentIndex={currentIndex}
        onJump={handleJump}
      />

      {/* Header */}
      {!isFullScreen && (
        <div className="flex-none z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onExit} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <Home className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">One Word Substitution</h1>
                <p className="text-xs text-gray-500">
                  {filters.examName?.[0] || 'Mixed Set'} • {data.length} Cards
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="font-mono font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-lg text-sm hidden sm:block">
                {currentIndex + 1} / {data.length}
              </div>
              <button onClick={() => setIsNavOpen(true)} className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg transition-colors" aria-label="Open Map">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={toggleFullScreen} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600">
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-200">
            <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Card Arena */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">

        {isFullScreen && (
          <button onClick={toggleFullScreen} className="absolute top-4 right-4 z-30 p-3 bg-white/20 backdrop-blur-md rounded-full text-gray-800 shadow-lg hover:bg-white/40 transition-colors">
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
              key={currentItem.id}
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
              <OWSCard data={currentItem} isFlipped={isFlipped} />
            </motion.div>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-white rounded-3xl shadow-sm">
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
            className="flex-1 justify-center bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200"
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
      `}</style>
    </div>
  );
};
