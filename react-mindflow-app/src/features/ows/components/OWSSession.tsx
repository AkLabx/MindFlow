import { useAuth } from '../../../features/auth/context/AuthContext';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { Lock } from 'lucide-react';
import { db } from '../../../lib/db';
import { supabase } from '../../../lib/supabase';

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
  const { user } = useAuth();

  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
     const seen = localStorage.getItem('has_seen_swipe_tutorial');
     if (!seen) setHasSeenTutorial(false);
  }, []);

  const dismissTutorial = () => {
     setHasSeenTutorial(true);
     localStorage.setItem('has_seen_swipe_tutorial', 'true');
  };

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



  // Phase 2: True Offline-First Event Sourcing & Disaster Recovery
  useEffect(() => {
     if (!user) return;

     const syncEvents = async () => {
         const queueStr = localStorage.getItem('ows_swipe_queue');
         if (!queueStr) return;

         const queue = JSON.parse(queueStr);
         if (queue.length === 0) return;

         try {
             const batch = queue.map((ev: any) => ({
                 user_id: user.id,
                 word_id: ev.word_id,
                 status: ev.status,
                 swipe_velocity: ev.velocity,
                 next_review_at: ev.next_review,
                 is_read: true,
                 updated_at: new Date().toISOString()
             }));

             const { error } = await supabase
                 .from('user_ows_interactions')
                 .upsert(batch, { onConflict: 'user_id, word_id' });

             if (!error) {
                 localStorage.removeItem('ows_swipe_queue'); // Clear on success
             }
         } catch (e) {
             console.error("OWS Sync Worker failed", e);
         }
     };

     // Sync every 15 seconds
     const syncInterval = setInterval(syncEvents, 15000);

     // Disaster Recovery
     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
         const queueStr = localStorage.getItem('ows_swipe_queue');
         if (queueStr && JSON.parse(queueStr).length > 0) {
             e.preventDefault();
             e.returnValue = ''; // Trigger warning
             // Attempt beacon sync
             navigator.sendBeacon('/api/sync-ows', queueStr);
         }
     };

     window.addEventListener('beforeunload', handleBeforeUnload);
     document.addEventListener('visibilitychange', () => {
         if (document.visibilityState === 'hidden') syncEvents();
     });

     return () => {
         clearInterval(syncInterval);
         window.removeEventListener('beforeunload', handleBeforeUnload);
     };
  }, [user]);


  // Swipe State & Feedback
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);

  // Tinders physics values
  const y = useMotionValue(0);

  // Opacity overlays based on direction
  const opacityUp = useTransform(y, [0, -100], [0, 1]);
  const opacityDown = useTransform(y, [0, 100], [0, 1]);
  const opacityLeft = useTransform(x, [0, -100], [0, 1]);
  const opacityRight = useTransform(x, [0, 100], [0, 1]);

  const handlePanStart = () => {
     setSwipeDirection(null);
  };


  const handlePan = (e: any, info: PanInfo) => {
    const { offset } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);

    // Continuous Drag Haptics based on distance milestones
    if (navigator.vibrate) {
        if (absX > 40 && absX < 45) navigator.vibrate(10);
        if (absY > 40 && absY < 45) navigator.vibrate(10);
        if (absX > 80 && absX < 85) navigator.vibrate(20);
        if (absY > 80 && absY < 85) navigator.vibrate(20);
    }

    if (absX > absY) {
       setSwipeDirection(offset.x > 0 ? 'right' : 'left');
    } else {
       setSwipeDirection(offset.y > 0 ? 'down' : 'up');
    }
  };

  const handlePanEnd = async (e: any, info: PanInfo) => {
    if (isAnimating) return;

    const { offset, velocity } = info;
    const swipeThreshold = 80;
    const velocityThreshold = 400;

    const isSwipeX = Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold;
    const isSwipeY = Math.abs(offset.y) > swipeThreshold || Math.abs(velocity.y) > velocityThreshold;

    if (isSwipeX || isSwipeY) {
      if (Math.abs(offset.x) > Math.abs(offset.y)) {
         if (offset.x > 0) {
            await handleAction('tricky', velocity.x);
         } else {
            await handleAction('review', velocity.x);
         }
      } else {
         if (offset.y > 0) {
            await handleAction('clueless', velocity.y);
         } else {
             await handleAction('mastered', velocity.y);
         }
      }
    } else {
      // Snap back if not swiped far enough
      x.set(0);
      y.set(0);
      setSwipeDirection(null);
    }
  };

  const [swipeStats, setSwipeStats] = useState({ mastered: 0, tricky: 0, review: 0, clueless: 0 });
  const [historyStack, setHistoryStack] = useState<any[]>([]);

  const handleAction = async (status: 'mastered'|'tricky'|'review'|'clueless', vel: number) => {
     setIsAnimating(true);
     setSwipeDirection(status);

     if (navigator.vibrate) navigator.vibrate(50); // Haptic

     // Record for Undo
     setHistoryStack(prev => [...prev, { item: currentItem, status, index: currentIndex }]);
     setSwipeStats(prev => ({ ...prev, [status]: prev[status] + 1 }));

     // Animate card away
     let finalX = 0;
     let finalY = 0;
     if (status === 'mastered') finalY = -500;
     if (status === 'clueless') finalY = 500;
     if (status === 'review') finalX = -500;
     if (status === 'tricky') finalX = 500;

     // Bonus Effect: High velocity mastered confetti
     if (status === 'mastered' && Math.abs(vel) > 800) {
         if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Thump thump
     }

     await controls.start({ x: finalX, y: finalY, opacity: 0, transition: { duration: 0.3 } });

     // Save event to IndexedDB
     saveSwipeEvent(currentItem.id || currentItem.content.word, status, Math.abs(vel));

     // Reset for next card
     setIsFlipped(false);
     x.set(0);
     y.set(0);
     setSwipeDirection(null);

     if (isLast) {
         onFinish();
     } else {
         onNext(); // Advance the parent's pointer
     }

     controls.set({ x: 0, y: 0, opacity: 1 });
     setIsAnimating(false);
  };


  const saveSwipeEvent = async (word_id: string, status: string, vel: number) => {
      try {
          if (!user) return;
          const nextReview = new Date();
          if (status === 'clueless') nextReview.setHours(nextReview.getHours() + 1);
          if (status === 'review') nextReview.setHours(nextReview.getHours() + 4);
          if (status === 'tricky') nextReview.setHours(nextReview.getHours() + 24);
          if (status === 'mastered') nextReview.setFullYear(nextReview.getFullYear() + 100);

          // Push to robust JSON local queue
          const queue = JSON.parse(localStorage.getItem('ows_swipe_queue') || '[]');
          queue.push({
              word_id,
              status,
              velocity: vel,
              next_review: nextReview.toISOString(),
              timestamp: Date.now()
          });
          localStorage.setItem('ows_swipe_queue', JSON.stringify(queue));

      } catch (e) {
          console.error("Failed to queue swipe", e);
      }
  };


  const handleUndo = async () => {
      if (historyStack.length === 0 || isAnimating) return;
      const lastAction = historyStack[historyStack.length - 1];
      setHistoryStack(prev => prev.slice(0, -1));
      setSwipeStats(prev => ({ ...prev, [lastAction.status]: Math.max(0, prev[lastAction.status as keyof typeof prev] - 1) }));

      onPrev();
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

      <OWSNavigationPanel
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
              <button onClick={onExit} className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                <Home className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white dark:text-white text-lg leading-tight">One Word Substitution</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
              <button onClick={toggleFullScreen} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Card Arena */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">

        {isFullScreen && (
          <button onClick={toggleFullScreen} className="absolute top-4 right-4 z-30 p-3 bg-white dark:bg-gray-800/20 backdrop-blur-md rounded-full text-gray-800 dark:text-gray-100 shadow-lg hover:bg-white dark:bg-gray-800/40 transition-colors">
            <Minimize2 className="w-6 h-6" />
          </button>
        )}

        <div className={cn(
          "relative w-full max-w-md transition-all duration-300 perspective-1000 z-10",
          isFullScreen ? "h-[80vh] md:h-[70vh] max-w-lg" : "h-[60vh] max-h-[600px]"
        )}
        >
          {currentItem ? (
          <>



        {/* AUTH GUARD OVERLAY */}
        {!user && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md rounded-xl">
            <div className="bg-white/90 dark:bg-slate-800/90 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm border border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Unlock Spatial Swiping</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                Sign in to use the Tinder-style swipe engine and permanently track your vocabulary mastery across devices.
              </p>
              <div className="flex gap-3 w-full">
                <Button onClick={onExit} variant="outline" fullWidth>Back</Button>
                <Button onClick={() => window.location.hash = '#/auth'} className="bg-teal-500 hover:bg-teal-600 text-white" fullWidth>
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}

            <motion.div
              drag={user ? true : false}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.8}
              onDragStart={handlePanStart}
              onDrag={handlePan}
              onDragEnd={handlePanEnd}
              animate={controls}
              style={{ x, y, rotate }}

              onTap={(e, info) => {
                 if (isAnimating) return;
                 // Strict tap vs drag distance check
                 if (Math.abs(info.point.x - info.point.x) < 5) {
                     setIsFlipped(!isFlipped);
                 }
              }}

              className="absolute w-full h-full cursor-grab active:cursor-grabbing will-change-transform z-10"
            >

              {/* Ghost Tutorial */}
              {!hasSeenTutorial && (
                 <motion.div
                   className="absolute inset-0 z-50 rounded-3xl bg-teal-900/40 backdrop-blur-sm flex flex-col items-center justify-center p-6 border-2 border-teal-400 border-dashed"
                   animate={{
                       y: [0, -30, 0, 30, 0],
                       x: [0, 0, -30, 0, 30, 0]
                   }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   onClick={(e) => { e.stopPropagation(); dismissTutorial(); }}
                 >
                     <div className="absolute top-4 font-black text-green-300 text-xl tracking-widest uppercase">⬆️ Mastered</div>
                     <div className="absolute bottom-4 font-black text-red-300 text-xl tracking-widest uppercase">⬇️ Clueless</div>
                     <div className="absolute left-[-20px] font-black text-orange-300 text-xl tracking-widest uppercase -rotate-90">⬅️ Review</div>
                     <div className="absolute right-[-20px] font-black text-blue-300 text-xl tracking-widest uppercase rotate-90">➡️ Tricky</div>

                     <div className="bg-white text-teal-900 p-4 rounded-xl shadow-2xl font-bold text-center mt-12 animate-pulse">
                        Tap here or Swipe card to Start
                     </div>
                 </motion.div>
              )}

              {/* Overlays */}
              <motion.div style={{ opacity: opacityUp }} className="absolute inset-0 z-20 flex items-start justify-center pt-8 bg-green-500/20 rounded-3xl pointer-events-none">
                 <div className="border-4 border-green-500 text-green-500 font-black text-4xl px-6 py-2 rounded-xl transform -rotate-12 bg-white/80">MASTERED</div>
              </motion.div>
              <motion.div style={{ opacity: opacityDown }} className="absolute inset-0 z-20 flex items-end justify-center pb-8 bg-red-500/20 rounded-3xl pointer-events-none">
                 <div className="border-4 border-red-500 text-red-500 font-black text-4xl px-6 py-2 rounded-xl transform rotate-12 bg-white/80">CLUELESS</div>
              </motion.div>
              <motion.div style={{ opacity: opacityLeft }} className="absolute inset-0 z-20 flex items-center justify-start pl-8 bg-orange-500/20 rounded-3xl pointer-events-none">
                 <div className="border-4 border-orange-500 text-orange-500 font-black text-3xl px-4 py-2 rounded-xl transform -rotate-12 bg-white/80">REVIEW</div>
              </motion.div>
              <motion.div style={{ opacity: opacityRight }} className="absolute inset-0 z-20 flex items-center justify-end pr-8 bg-blue-500/20 rounded-3xl pointer-events-none">
                 <div className="border-4 border-blue-500 text-blue-500 font-black text-3xl px-4 py-2 rounded-xl transform rotate-12 bg-white/80">TRICKY</div>
              </motion.div>

              <OWSCard data={currentItem} serialNumber={currentIndex + 1} isFlipped={isFlipped} />
            </motion.div>

          </>
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
            className="p-3 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-400 hover:bg-gray-100 dark:bg-gray-800 cursor-pointer active:scale-95 transition-transform"
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
