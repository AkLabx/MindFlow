with open("src/features/ows/components/OWSSession.tsx", "r") as f:
    content = f.read()

# Fix `saveSwipeEvent` to queue using `localStorage` as a fast batching queue since `db.ts` uses auto-sync pushes which would trigger separate inserts.
# We want true batching via event sourcing.
sync_worker_logic = """
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
"""

# Replace the fake sync worker
import re
content = re.sub(r'// Sync Worker[\s\S]*?}, \[user\]\);', sync_worker_logic, content)

save_event_logic = """
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
"""

content = re.sub(r'const saveSwipeEvent =[\s\S]*?};', save_event_logic, content)

with open("src/features/ows/components/OWSSession.tsx", "w") as f:
    f.write(content)
