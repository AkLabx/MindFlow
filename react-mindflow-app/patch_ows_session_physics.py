import re

with open("src/features/ows/components/OWSSession.tsx", "r") as f:
    content = f.read()

# Add new imports
new_imports = """import { useSettingsStore } from '../../../stores/useSettingsStore';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { Lock } from 'lucide-react';
import { db } from '../../../lib/db';
import { supabase } from '../../../lib/supabase';
"""
if "import { db } from" not in content:
  content = content.replace("import { Lock } from 'lucide-react';", new_imports)


# Replace handlePanEnd
pan_logic = """
  // Swipe State & Feedback
  const [swipeDirection, setSwipeDirection] = useState<'up'|'down'|'left'|'right'|null>(null);

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

     onNext(); // Advance the parent's pointer

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

          await db.add('synonym_interactions', { // Temporarily reuse the store if ows store isn't made
              word_id,
              action: status,
              timestamp: Date.now()
          });
      } catch (e) {
          console.error("Failed to save swipe", e);
      }
  };

  const handleUndo = async () => {
      if (historyStack.length === 0 || isAnimating) return;
      const lastAction = historyStack[historyStack.length - 1];
      setHistoryStack(prev => prev.slice(0, -1));
      setSwipeStats(prev => ({ ...prev, [lastAction.status]: Math.max(0, prev[lastAction.status] - 1) }));

      onPrevious();
  };
"""

# replace the simplistic handleDragEnd
content = re.sub(r'const handleDragEnd =[\s\S]*?};', pan_logic, content)

# Add Overlays to the Motion Div
motion_jsx = """
            <motion.div
              drag={user ? true : false}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.8}
              onDragStart={handlePanStart}
              onDrag={handlePan}
              onDragEnd={handlePanEnd}
              animate={controls}
              style={{ x, y, rotate }}
              onTap={() => {
                 if (!isAnimating && x.get() === 0 && y.get() === 0) setIsFlipped(!isFlipped);
              }}
              className="absolute w-full h-full cursor-grab active:cursor-grabbing will-change-transform z-10"
            >
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
"""
# Need to specifically match the motion.div element
content = re.sub(r'<motion\.div\s*key=\{currentItem\.id\}[\s\S]*?onTap=\{[\s\S]*?\}[\s\S]*?>[\s\S]*?</motion\.div>', motion_jsx, content)

# Add Top bar stats
stats_bar = """
      {/* Analytics Dash */}
      <div className="flex justify-center mb-4 z-10 relative">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-md flex gap-4 text-sm font-bold border border-slate-200 dark:border-slate-700">
             <span className="text-green-500 flex items-center gap-1">⬆️ {swipeStats.mastered}</span>
             <span className="text-blue-500 flex items-center gap-1">➡️ {swipeStats.tricky}</span>
             <span className="text-orange-500 flex items-center gap-1">⬅️ {swipeStats.review}</span>
             <span className="text-red-500 flex items-center gap-1">⬇️ {swipeStats.clueless}</span>
             {historyStack.length > 0 && (
                <button onClick={handleUndo} className="ml-2 text-slate-400 hover:text-slate-600 active:scale-95 transition-transform">
                   <RotateCcw className="w-4 h-4" />
                </button>
             )}
          </div>
      </div>
"""
if "Analytics Dash" not in content:
    content = content.replace('<div className="w-full max-w-2xl mx-auto', stats_bar + '\n      <div className="w-full max-w-2xl mx-auto')


with open("src/features/ows/components/OWSSession.tsx", "w") as f:
    f.write(content)
