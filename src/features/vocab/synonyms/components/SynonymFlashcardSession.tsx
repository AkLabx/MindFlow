import React, { useEffect, useState } from 'react';
import { triggerHaptic } from '../../../../lib/haptics';
import { useFlashcardStore } from '../../../../features/quiz/stores/useFlashcardStore';
import { Edit, Target, CheckCircle } from 'lucide-react';

import { ArrowLeft, ArrowRight, Home, RotateCcw, Maximize2, Minimize2, RotateCw, Menu } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Button } from '../../../../components/Button/Button';
import { SynonymCard } from './SynonymCard';
import { SynonymNavigationPanel } from './SynonymNavigationPanel';
import { SynonymWord } from '../../../../features/quiz/types';
import { cn } from '../../../../utils/cn';

interface PanInfo {
  point: { x: number; y: number };
  delta: { x: number; y: number };
  offset: { x: number; y: number };
  velocity: { x: number; y: number };
}

interface SynonymFlashcardSessionProps {
  data: any[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  onFinish: () => void;
  filters: any;
  onJump: (index: number) => void;
  onSwipe?: (wordId: string, status: string, timeSpentMs: number) => void;
}

export const SynonymFlashcardSession: React.FC<SynonymFlashcardSessionProps> = ({
  data,
  currentIndex,
  onNext,
  onPrev,
  onExit,
  onFinish,
  onJump,
  filters,
  onSwipe
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const mode = useFlashcardStore(state => state.mode) || 'review';
  const updateSwipeStats = useFlashcardStore(state => state.updateSwipeStats);
  const swipeStats = useFlashcardStore(state => state.swipeStats);

  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(
    localStorage.getItem('synonym_tutorial_seen') === 'true'
  );

  const dismissTutorial = () => {
    setHasSeenTutorial(true);
    localStorage.setItem('synonym_tutorial_seen', 'true');
  };


  const controls = useAnimation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);

  const currentItem = data[currentIndex];
  const progress = data.length > 0 ? ((currentIndex + 1) / data.length) * 100 : 0;
  const isLast = currentIndex === data.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return;
      if (mode === 'review') {
        if (e.key === '1') handleAction('clueless', 0);
        if (e.key === '2') handleAction('review', 0);
        if (e.key === '3') handleAction('tricky', 0);
        if (e.key === '4') handleAction('mastered', 0);
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (mode === 'basic') handleBasicAction(false, 500);
      } else if (e.key === 'ArrowLeft') {
        if (mode === 'basic') handleBasicAction(true, -500);
      } else if (e.key === 'Enter') {
        setIsFlipped(prev => !prev);
      } else if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isAnimating, isFullScreen]);

  useEffect(() => {
    x.set(0);
    controls.set({ x: 0, opacity: 1, scale: 1 });
    setIsFlipped(false);
  }, [currentIndex]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.log(e));
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const handlePan = (e: any, info: PanInfo) => {
    const isSwipeX = Math.abs(info.offset.x) > Math.abs(info.offset.y);
    if (isSwipeX) {
      x.set(info.offset.x);
      if (info.offset.x > 100) setSwipeDirection('right');
      else if (info.offset.x < -100) setSwipeDirection('left');
      else setSwipeDirection(null);
    }
  };

  const handlePanEnd = async (e: any, info: PanInfo) => {
    const threshold = 100;
    const isSwipeX = Math.abs(info.offset.x) > Math.abs(info.offset.y);

    if (mode === 'basic') {
        if (isSwipeX) {
            if (info.offset.x < -threshold) {
                await handleBasicAction(true, info.velocity.x);
            } else if (info.offset.x > threshold) {
                await handleBasicAction(false, info.velocity.x);
            } else {
                x.set(0);
                setSwipeDirection(null);
            }
        } else {
            x.set(0);
            setSwipeDirection(null);
        }
        return;
    }

    // Review mode: simple left/right maps to review/tricky for spatial users who still drag
    if (isSwipeX) {
      if (info.offset.x > threshold) {
         await handleAction('tricky', info.velocity.x);
      } else if (info.offset.x < -threshold) {
         await handleAction('review', info.velocity.x);
      } else {
         x.set(0);
         setSwipeDirection(null);
      }
    } else {
      x.set(0);
      setSwipeDirection(null);
    }
  };

  const saveSwipeEvent = async (word_id: string, status: string, vel: number) => {
      try {
          const nextReview = new Date();
          if (status === 'clueless') nextReview.setHours(nextReview.getHours() + 1);
          if (status === 'review') nextReview.setDate(nextReview.getDate() + 7);
          if (status === 'tricky') nextReview.setDate(nextReview.getDate() + 14);
          if (status === 'mastered') nextReview.setDate(nextReview.getDate() + 30);

          const queue = JSON.parse(localStorage.getItem('synonym_swipe_queue') || '[]');
          queue.push({
              word_id,
              status,
              velocity: vel,
              next_review: nextReview.toISOString(),
              timestamp: Date.now()
          });
          localStorage.setItem('synonym_swipe_queue', JSON.stringify(queue));
      } catch (e) {
          console.error("Failed to queue swipe", e);
      }
  };

  const handleUndo = async () => {
      if (historyStack.length === 0 || isAnimating) return;
      setIsAnimating(true);
      try {
          const lastAction = historyStack[historyStack.length - 1];
          setHistoryStack(prev => prev.slice(0, -1));

          if (lastAction.status) {
              updateSwipeStats(lastAction.status, -1);
          }

          try {
              const queueStr = localStorage.getItem('synonym_swipe_queue');
              if (queueStr) {
                  let queue = JSON.parse(queueStr);
                  queue = queue.filter((q: any) => q.word_id !== lastAction.item.id);
                  localStorage.setItem('synonym_swipe_queue', JSON.stringify(queue));
              }
          } catch (e) {}

          x.set(-500);
          controls.set({ x: -500, opacity: 0 });
          onPrev();

          await new Promise(resolve => setTimeout(resolve, 50));
          await controls.start({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } });
      } finally {
          setIsAnimating(false);
          setIsFlipped(false);
      }
  };

  const handleBasicAction = async (isKnown: boolean, vel: number) => {
     if (isAnimating) return;
     setIsAnimating(true);
     setSwipeDirection(isKnown ? 'left' : 'right');

     const status = isKnown ? 'known' : 'unknown';
     setHistoryStack(prev => [...prev, { item: currentItem, status, index: currentIndex }]);
     updateSwipeStats(status, 1);

     if (onSwipe) {
         onSwipe(currentItem.id || currentItem.word, isKnown ? 'mastered' : 'review', 1000);
     }

     const finalX = isKnown ? -500 : 500;
     await controls.start({ x: finalX, opacity: 0, transition: { duration: 0.2 } });

     setIsFlipped(false);
     x.set(0);
     setSwipeDirection(null);

     if (isLast) onFinish();
     else onNext();

     controls.set({ x: 0, opacity: 1 });
     setIsAnimating(false);
  };

  const handleAction = async (status: string, vel: number) => {
     if (isAnimating) return;
     setIsAnimating(true);

     setHistoryStack(prev => [...prev, { item: currentItem, status, index: currentIndex }]);
     updateSwipeStats(status as any, 1);

     if (status === 'mastered' && Math.abs(vel) > 800) {
         if (typeof triggerHaptic !== 'undefined') triggerHaptic([100, 50, 100]);
     }

     await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });

     saveSwipeEvent(currentItem.id || currentItem.word, status, Math.abs(vel));
     if (onSwipe) {
         onSwipe(currentItem.id || currentItem.word, status, 1000);
     }

     setIsFlipped(false);
     x.set(0);
     setSwipeDirection(null);

     if (isLast) onFinish();
     else onNext();

     controls.set({ x: 0, opacity: 1 });
     setIsAnimating(false);
  };


  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans touch-callout-none">
      {/* Header */}
      {!isFullScreen && (
        <div className="flex-none bg-white dark:bg-slate-800 shadow-sm z-20 transition-colors">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-4">
              <button onClick={onExit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Exit">
                <Home className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </button>
              <div className="font-bold text-slate-800 dark:text-slate-100 hidden sm:block">
                Synonyms
              </div>
            </div>
            <div className="font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {data.length}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsNavOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors hidden md:block" title="Card List">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={toggleFullScreen} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors" title="Toggle Fullscreen">
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
          {mode === 'basic' && (
            <div className="flex justify-between items-center px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <CheckCircle className="w-5 h-5" /> <span>{swipeStats.known || 0}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-medium text-sm">Word</div>
                <div className="flex items-center gap-2 text-red-500 font-semibold">
                    <span>{swipeStats.unknown || 0}</span> <Target className="w-5 h-5" />
                </div>
            </div>
          )}
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-hidden perspective-1000">
        {isFullScreen && (
          <button onClick={toggleFullScreen} className="absolute top-4 right-4 z-30 p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full shadow-md hover:bg-white dark:hover:bg-slate-700 transition-colors">
            <Minimize2 className="w-5 h-5 text-slate-800 dark:text-slate-200" />
          </button>
        )}


        {mode === 'basic' && !hasSeenTutorial && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white" onClick={dismissTutorial}>
             <div className="max-w-xs animate-fade-in-up">
                 <h2 className="text-2xl font-bold mb-4">Basic Mode</h2>
                 <p className="text-lg opacity-90 mb-8">Move known words to the left and unknown words to the right. Tap the card to reveal.</p>
                 <div className="flex justify-between w-full mb-12">
                     <div className="flex flex-col items-center opacity-80">
                         <div className="w-16 h-16 border-2 border-dashed border-white rounded-xl mb-2 flex items-center justify-center">
                             <CheckCircle className="w-8 h-8 text-green-400" />
                         </div>
                         <span>Known</span>
                     </div>
                     <div className="flex flex-col items-center opacity-80">
                         <div className="w-16 h-16 border-2 border-dashed border-white rounded-xl mb-2 flex items-center justify-center">
                             <Target className="w-8 h-8 text-red-400" />
                         </div>
                         <span>Unknown</span>
                     </div>
                 </div>
                 <Button onClick={dismissTutorial} className="bg-white text-black hover:bg-gray-100" fullWidth>Got it!</Button>
             </div>
          </div>
        )}

        {currentItem ? (
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onPan={handlePan}
            onPanEnd={handlePanEnd}
            animate={controls}
            style={{ x, rotate }}
            onTap={(e, info) => {
              if (isAnimating) return;
              if (Math.abs(info.point.x - info.point.x) < 5) {
                setIsFlipped(!isFlipped);
              }
            }}
            className={cn(
              "w-full max-w-md h-[65vh] max-h-[600px] cursor-grab active:cursor-grabbing will-change-transform",
              isFullScreen && "h-[85vh] max-w-lg"
            )}
          >
            <SynonymCard data={currentItem} isFlipped={isFlipped} serialNumber={currentIndex + 1} />
          </motion.div>
        ) : (
          <div className="text-slate-400">No synonyms available.</div>
        )}

        <div className="absolute bottom-6 md:bottom-12 text-slate-400 text-xs font-medium uppercase tracking-widest animate-pulse pointer-events-none select-none">
          {isFlipped ? "Tap to flip back" : "Tap to flip"}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex-none z-30 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 pb-safe">
        <div className="max-w-md mx-auto flex flex-col gap-4">
          {mode === 'review' ? (
          <div className="flex justify-between items-center gap-2">
            <button onClick={() => !isAnimating && handleAction('clueless', 0)} disabled={isAnimating} className="flex-1 flex flex-col items-center justify-center py-2 px-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg text-red-700 dark:text-red-400 transition-colors">
              <span className="font-bold text-sm">Again</span>
              <span className="text-xs font-medium">Again</span>
            </button>
            <button onClick={() => !isAnimating && handleAction('review', 0)} disabled={isAnimating} className="flex-1 flex flex-col items-center justify-center py-2 px-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 rounded-lg text-amber-700 dark:text-amber-400 transition-colors">
              <span className="font-bold text-sm">Hard</span>
              <span className="text-xs font-medium">7d</span>
            </button>
            <button onClick={() => !isAnimating && handleAction('tricky', 0)} disabled={isAnimating} className="flex-1 flex flex-col items-center justify-center py-2 px-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-lg text-green-700 dark:text-green-400 transition-colors">
              <span className="font-bold text-sm">Good</span>
              <span className="text-xs font-medium">14d</span>
            </button>
            <button onClick={() => !isAnimating && handleAction('mastered', 0)} disabled={isAnimating} className="flex-1 flex flex-col items-center justify-center py-2 px-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg text-blue-700 dark:text-blue-400 transition-colors border border-blue-200 dark:border-blue-800">
              <span className="font-bold text-sm">Perfect</span>
              <span className="text-xs font-medium">Done</span>
            </button>
          </div>
          ) : (
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => handleBasicAction(true, -500)} disabled={isAnimating} className="w-14 h-14 rounded-full p-0 flex items-center justify-center border-2 border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <Button variant="ghost" onClick={() => setIsFlipped(!isFlipped)} className="w-14 h-14 rounded-full p-0 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
              <RotateCw className="w-6 h-6" />
            </Button>
            <Button variant="outline" onClick={() => handleBasicAction(false, 500)} disabled={isAnimating} className="w-14 h-14 rounded-full p-0 flex items-center justify-center border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              <ArrowRight className="w-6 h-6" />
            </Button>
          </div>
          )}

          <div className="flex justify-center items-center gap-6 text-slate-500 dark:text-slate-400 mt-2">
             <button disabled className="flex items-center gap-1 text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors opacity-50 cursor-not-allowed">
               <Edit className="w-4 h-4" /> Edit
             </button>
             <button onClick={handleUndo} disabled={historyStack.length === 0 || isAnimating} className={cn("flex items-center gap-1 text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors", (historyStack.length === 0 || isAnimating) && "opacity-50 cursor-not-allowed")}>
               <RotateCcw className="w-4 h-4" /> Undo
             </button>
          </div>
        </div>
      </div>

      {/* Navigation Drawer */}
      <SynonymNavigationPanel
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        data={data as any}
        currentIndex={currentIndex}
        onJump={(index) => {
          onJump(index);
          setIsNavOpen(false);
          setIsFlipped(false);
        }}
      />
    </div>
  );
};
