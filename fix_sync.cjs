const fs = require('fs');
let content = fs.readFileSync('src/lib/syncService.ts', 'utf8');

// The error is because `remoteOWSIds` is not defined. We messed up the replace logic earlier for syncOnLogin.
// Let's manually fix the syncOnLogin method up to the local data fetching.

let correctSyncOnLogin = `
  syncOnLogin: async (userId: string, isSignup: boolean = false) => {
    if (isSyncing) return;
    isSyncing = true;

    await syncService.processEventQueue(userId);

    try {
      // 1. Pull from Supabase
      const [
        { data: remoteQuizzes },
        { data: remoteHistory },
        { data: remoteBookmarks },
        { data: remoteSynonyms },
        { data: remoteOWS }
      ] = await Promise.all([
        supabase.from('saved_quizzes').select('*').eq('user_id', userId),
        supabase.from('quiz_history').select('*').eq('user_id', userId),
        supabase.from('user_bookmarks').select('question_id').eq('user_id', userId),
        supabase.from('user_synonym_interactions').select('*').eq('user_id', userId),
        supabase.from('user_ows_interactions').select('*').eq('user_id', userId)
      ]);

      // 2. Fetch local data
      const localQuizzes = await db.getQuizzes();
      const localHistory = await db.getQuizHistory();
      const localBookmarks = await db.getAllBookmarks();
      const localSynonyms = await db.getAllSynonymInteractions();
      const localOWS = await db.getAllOWSInteractions();

      if (isSignup) {
        // --- NEW SIGNUP FLOW ---
        // 3. Push all Local Data up to the Server to merge guest progress
        const remoteQuizIds = new Set((remoteQuizzes || []).map(q => q.id));
        const remoteHistoryIds = new Set((remoteHistory || []).map(h => h.id));
        const remoteBookmarkIds = new Set((remoteBookmarks || []).map(b => b.question_id));
        const remoteSynonymIds = new Set((remoteSynonyms || []).map(s => s.word_id));
        const remoteOWSIds = new Set((remoteOWS || []).map(o => o.word_id));

        for (const quiz of localQuizzes) {
          if (!remoteQuizIds.has(quiz.id)) {
            await syncService.pushSavedQuiz(userId, quiz);
          }
        }
        for (const hist of localHistory) {
          if (!remoteHistoryIds.has(hist.id)) {
            await syncService.pushQuizHistory(userId, hist);
          }
        }
        for (const bm of localBookmarks) {
          if (!remoteBookmarkIds.has(bm.id)) {
            await syncService.pushBookmark(userId, bm);
          }
        }
        for (const syn of localSynonyms) {
          if (!remoteSynonymIds.has(syn.wordId)) {
            await syncService.pushSynonymInteraction(userId, syn);
          }
        }
        for (const ows of localOWS) {
          if (!remoteOWSIds.has(ows.wordId)) {
            await syncService.pushOWSInteraction(userId, ows);
          }
        }

        // After merging up, clear local to prep for a fresh pull
        await db.clearAllUserData();
      } else {
        // --- EXISTING LOGIN FLOW ---
        // 3. Clear local IndexedDB immediately to avoid mixing guest data into existing account
        await db.clearAllUserData();
      }

      // 4. Pull fresh data from Server to Local (Hydration)
      if (remoteQuizzes) {
        for (const remote of remoteQuizzes) {
          await db.saveQuiz({
            id: remote.id,
            name: remote.name,
            createdAt: remote.created_at,
            filters: remote.filters,
            mode: remote.mode,
            questions: remote.questions,
            state: remote.state
          });
        }
      }

      if (remoteHistory) {
        for (const remote of remoteHistory) {
          await db.saveQuizHistory({
            id: remote.id,
            date: remote.date,
            totalQuestions: remote.total_questions,
            totalCorrect: remote.total_correct,
            totalIncorrect: remote.total_incorrect,
            totalSkipped: remote.total_skipped,
            totalTimeSpent: remote.total_time_spent,
            overallAccuracy: remote.overall_accuracy,
            difficulty: remote.difficulty,
            subjectStats: remote.subject_stats
          });
        }
      }

      // 5. Hydrate missing remote bookmarks
      if (remoteSynonyms) {
        for (const remote of remoteSynonyms) {
          await db.saveSynonymInteraction({
            wordId: remote.word_id,
            wordString: '', // Missing string data from backend, relies on UI hydrating it later
            masteryLevel: remote.mastery_level,
            dailyChallengeScore: remote.daily_challenge_score,
            gamificationScore: remote.gamification_score,
            viewedExplanation: remote.viewed_explanation,
            viewedWordFamily: remote.viewed_word_family,
            lastInteractedAt: remote.last_interacted_at
          });
        }
      }

      if (remoteOWS && remoteOWS.length > 0) {
        for (const remote of remoteOWS) {
           await db.saveOWSInteraction({
              wordId: remote.word_id,
              isRead: remote.is_read,
              lastInteractedAt: remote.updated_at
           });
        }
      }

      if (remoteBookmarks && remoteBookmarks.length > 0) {
        const localBookmarkIds = new Set(localBookmarks.map(b => b.id));
        const missingBookmarkIds = remoteBookmarks
          .map(b => b.question_id)
          .filter(id => !localBookmarkIds.has(id));

        if (missingBookmarkIds.length > 0) {
          // Fetch the full question objects for bookmarks since local DB needs the full object
          const fullQuestions = await fetchQuestionsByIds(missingBookmarkIds);
          for (const q of fullQuestions) {
            await db.saveBookmark(q);
          }
        }
      }

    } catch (error) {
      console.error('Error during initial sync:', error);
    } finally {
      isSyncing = false;
      // Dispatch event to notify UI components that sync has completed
      window.dispatchEvent(new Event('mindflow-sync-complete'));
    }
  }
};
`;

// Replace from `syncOnLogin:` to the end of the file
const syncOnLoginRegex = /syncOnLogin: async \(userId: string, isSignup: boolean = false\) => \{[\s\S]*\}\s*\};\s*$/m;
content = content.replace(syncOnLoginRegex, correctSyncOnLogin);

fs.writeFileSync('src/lib/syncService.ts', content, 'utf8');
