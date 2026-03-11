const fs = require('fs');

let file = 'src/lib/syncService.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /export const syncService = \{/,
  `import { useSyncStore } from '../features/quiz/stores/useSyncStore';\n\nexport const syncService = {`
);

const newMethod = `
  /**
   * Processes the offline event queue from Zustand and dispatches them to Supabase.
   */
  processEventQueue: async (userId: string) => {
    const { queue, removeEvents } = useSyncStore.getState();
    if (queue.length === 0) return;

    const processedIds: string[] = [];

    for (const event of queue) {
      try {
        switch (event.type) {
          case 'flashcard_reviewed':
            // The payload is assumed to be a SynonymInteraction or similar
            await syncService.pushSynonymInteraction(userId, event.payload);
            break;
          case 'quiz_completed':
            await syncService.pushQuizHistory(userId, event.payload.history, event.payload.attempts);
            break;
          case 'bookmark_toggled':
            if (event.payload.isBookmarked) {
               await syncService.pushBookmark(userId, event.payload.question);
            } else {
               await syncService.removeBookmark(userId, event.payload.questionId);
            }
            break;
        }
        processedIds.push(event.id);
      } catch (err) {
        console.error('Failed to sync event:', event, err);
        // Break early if network fails, keep remaining in queue
        break;
      }
    }

    if (processedIds.length > 0) {
      removeEvents(processedIds);
    }
  },
`;

code = code.replace(
  /syncOnLogin: async \(userId: string\) => \{/,
  `syncOnLogin: async (userId: string) => {\n    await syncService.processEventQueue(userId);\n`
);

// Inject processEventQueue
code = code.replace(/syncOnLogin: async \(userId: string\) => \{/, newMethod + '\n  syncOnLogin: async (userId: string) => {');

fs.writeFileSync(file, code);
