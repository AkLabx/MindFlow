import { supabase } from './supabase';
import { db, SynonymInteraction, OWSInteraction, IdiomInteraction, AIChatConversation, AIChatMessage, getChatConversations, getChatMessages } from './db';
import { fetchQuestionsByIds } from '../features/quiz/services/questionService';
import { Question, SavedQuiz, QuizHistoryRecord } from '../features/quiz/types';

/**
 * Service responsible for synchronizing local IndexedDB data with the Supabase backend.
 */
import { useSyncStore } from '../features/quiz/stores/useSyncStore';

let isSyncing = false;

export const syncService = {
  /** Returns the current sync status */
  getIsSyncing: () => isSyncing,

  pushAIChatConversation: async (userId: string, conv: AIChatConversation) => {
    const { error } = await supabase.from('ai_chat_conversations').upsert({
      id: conv.id,
      user_id: userId,
      title: conv.title,
      created_at: conv.created_at,
      updated_at: conv.updated_at
    }, { onConflict: 'id' });
    if (error) console.error('Error pushing chat conversation:', error);
  },

  pushAIChatMessage: async (msg: AIChatMessage) => {
    const { error } = await supabase.from('ai_chat_messages').upsert({
      id: msg.id,
      conversation_id: msg.conversation_id,
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at
    }, { onConflict: 'id' });
    if (error) console.error('Error pushing chat message:', error);
  },

  syncAIChats: async (userId: string) => {
    try {
      // 1. Fetch Local Data
      const localConvs = await getChatConversations();

      // 2. Push to Supabase
      for (const conv of localConvs) {
        await syncService.pushAIChatConversation(userId, conv);
        const msgs = await getChatMessages(conv.id);
        for (const msg of msgs) {
            await syncService.pushAIChatMessage(msg);
        }
      }
    } catch (err) {
      console.error('Error syncing AI Chats:', err);
    }
  },

  /**
   * Pushes a single saved quiz to Supabase.
   */
  pushSavedQuiz: async (userId: string, quiz: SavedQuiz) => {
    const { error } = await supabase.from('saved_quizzes').upsert({
      id: quiz.id,
      user_id: userId,
      name: quiz.name,
      created_at: quiz.createdAt,
      filters: quiz.filters,
      mode: quiz.mode,
      questions: quiz.questions,
      state: quiz.state,
    });
    if (error) console.error('Error pushing saved quiz:', error);
  },

  /**
   * Pushes a single quiz history record to Supabase, along with per-question attempts.
   */
  pushQuizHistory: async (userId: string, history: QuizHistoryRecord, attempts?: any[]) => {
    const { error: historyError } = await supabase.from('quiz_history').upsert({
      id: history.id,
      user_id: userId,
      date: history.date,
      total_questions: history.totalQuestions,
      total_correct: history.totalCorrect,
      total_incorrect: history.totalIncorrect,
      total_skipped: history.totalSkipped,
      total_time_spent: history.totalTimeSpent,
      overall_accuracy: history.overallAccuracy,
      difficulty: history.difficulty,
      subject_stats: history.subjectStats,
    });
    if (historyError) {
      console.error('Error pushing quiz history:', historyError);
      return;
    }

    if (attempts && attempts.length > 0) {
      const { error: attemptsError } = await supabase.from('question_attempts').insert(
        attempts.map(a => ({
          user_id: userId,
          quiz_history_id: history.id,
          question_id: a.questionId,
          is_correct: a.isCorrect,
          time_taken: a.timeTaken,
          subject: a.subject,
          topic: a.topic
        }))
      );
      if (attemptsError) console.error('Error pushing question attempts:', attemptsError);
    }
  },

  /**
   * Pushes a single bookmark to Supabase.
   */
  pushBookmark: async (userId: string, question: Question) => {
    const { error } = await supabase.from('user_bookmarks').upsert({
      user_id: userId,
      question_id: question.id,
    }, { onConflict: 'user_id, question_id' });

    if (error) console.error('Error pushing bookmark:', error);
  },

  /**
   * Removes a bookmark from Supabase.
   */

  /**
   * Pushes a synonym interaction to Supabase.
   */
  pushSynonymInteraction: async (userId: string, interaction: SynonymInteraction) => {
    const { error } = await supabase.from('user_synonym_interactions').upsert({
      user_id: userId,
      word_id: interaction.wordId,
      mastery_level: interaction.masteryLevel,
      daily_challenge_score: interaction.dailyChallengeScore || 0,
      gamification_score: interaction.gamificationScore || 0,
      viewed_explanation: interaction.viewedExplanation || false,
      viewed_word_family: interaction.viewedWordFamily || false,
      last_interacted_at: interaction.lastInteractedAt,
    }, { onConflict: 'user_id, word_id' });

    if (error) console.error('Error pushing synonym interaction:', error);
  },

    /**
   * Pushes an OWS interaction to Supabase.
   */
  pushOWSInteraction: async (userId: string, interaction: OWSInteraction) => {
    const { error } = await supabase.from('user_ows_interactions').upsert({
      user_id: userId,
      word_id: interaction.wordId,
      known_ows: interaction.known_ows,
      updated_at: interaction.lastInteractedAt,
    }, { onConflict: 'user_id, word_id' });

    if (error) console.error('Error pushing OWS interaction:', error);
  },

    /**
   * Pushes an Idiom interaction to Supabase.
   */
  pushIdiomInteraction: async (userId: string, interaction: IdiomInteraction) => {
    const { error } = await supabase.from('user_idiom_interactions').upsert({
      user_id: userId,
      idiom_id: interaction.idiomId,
      known_ows: interaction.known_ows,
      updated_at: interaction.lastInteractedAt,
    }, { onConflict: 'user_id, idiom_id' });

    if (error) console.error('Error pushing Idiom interaction:', error);
  },

  removeBookmark: async (userId: string, questionId: string) => {
    const { error } = await supabase.from('user_bookmarks')
      .delete()
      .match({ user_id: userId, question_id: questionId });

    if (error) console.error('Error removing bookmark from Supabase:', error);
  },

  /**
   * Deletes a saved quiz from Supabase.
   */
  deleteSavedQuiz: async (userId: string, quizId: string) => {
    const { error } = await supabase.from('saved_quizzes')
      .delete()
      .match({ id: quizId, user_id: userId });

    if (error) console.error('Error deleting saved quiz from Supabase:', error);
  },

  /**
   * Runs an initial bidirectional sync after login.
   * Pulls remote data down and pushes any local-only data up.
   */

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


  syncOnLogin: async (userId: string, isSignup: boolean = false) => {
    if (isSyncing) return;
    isSyncing = true;
    window.dispatchEvent(new Event('mindflow-sync-start'));

    await syncService.processEventQueue(userId);

    try {
      // 1. Pull from Supabase
      const [
        { data: remoteQuizzes },
        { data: remoteHistory },
        { data: remoteBookmarks },
        { data: remoteSynonyms },
        { data: remoteOWS },
        { data: remoteIdioms }
      ] = await Promise.all([
        supabase.from('saved_quizzes').select('*').eq('user_id', userId),
        supabase.from('quiz_history').select('*').eq('user_id', userId),
        supabase.from('user_bookmarks').select('question_id').eq('user_id', userId),
        supabase.from('user_synonym_interactions').select('*').eq('user_id', userId),
        supabase.from('user_ows_interactions').select('*').eq('user_id', userId),
        supabase.from('user_idiom_interactions').select('*').eq('user_id', userId)
      ]);

      // 2. Fetch local data
      const localQuizzes = await db.getQuizzes();
      const localHistory = await db.getQuizHistory();
      const localBookmarks = await db.getAllBookmarks();
      const localSynonyms = await db.getAllSynonymInteractions();
      const localOWS = await db.getAllOWSInteractions();
      const localIdioms = await db.getAllIdiomInteractions();

      if (isSignup) {
        // --- NEW SIGNUP FLOW ---
        // 3. Push all Local Data up to the Server to merge guest progress
        const remoteQuizIds = new Set((remoteQuizzes || []).map(q => q.id));
        const remoteHistoryIds = new Set((remoteHistory || []).map(h => h.id));
        const remoteBookmarkIds = new Set((remoteBookmarks || []).map(b => b.question_id));
        const remoteSynonymIds = new Set((remoteSynonyms || []).map(s => s.word_id));
        const remoteOWSIds = new Set((remoteOWS || []).map(o => o.word_id));
        const remoteIdiomIds = new Set((remoteIdioms || []).map(i => i.idiom_id));

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
        for (const idiom of localIdioms) {
          if (!remoteIdiomIds.has(idiom.idiomId)) {
            await syncService.pushIdiomInteraction(userId, idiom);
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
              known_ows: remote.known_ows,
              lastInteractedAt: remote.updated_at
           });
        }
      }

      if (remoteIdioms && remoteIdioms.length > 0) {
        for (const remote of remoteIdioms) {
           await db.saveIdiomInteraction({
              idiomId: remote.idiom_id,
              known_ows: remote.known_ows,
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
