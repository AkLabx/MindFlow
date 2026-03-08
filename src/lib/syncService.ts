import { supabase } from './supabase';
import { db } from './db';
import { fetchQuestionsByIds } from '../features/quiz/services/questionService';
import { Question, SavedQuiz, QuizHistoryRecord } from '../features/quiz/types';

/**
 * Service responsible for synchronizing local IndexedDB data with the Supabase backend.
 */
export const syncService = {
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
  syncOnLogin: async (userId: string) => {
    try {
      // 1. Pull from Supabase
      const [
        { data: remoteQuizzes },
        { data: remoteHistory },
        { data: remoteBookmarks }
      ] = await Promise.all([
        supabase.from('saved_quizzes').select('*').eq('user_id', userId),
        supabase.from('quiz_history').select('*').eq('user_id', userId),
        supabase.from('user_bookmarks').select('question_id').eq('user_id', userId)
      ]);

      // 2. Fetch local data
      const localQuizzes = await db.getQuizzes();
      const localHistory = await db.getQuizHistory();
      const localBookmarks = await db.getAllBookmarks();

      // 3. Push Local Data that doesn't exist remotely (Data Migration for Guests -> Logged In)
      const remoteQuizIds = new Set((remoteQuizzes || []).map(q => q.id));
      const remoteHistoryIds = new Set((remoteHistory || []).map(h => h.id));
      const remoteBookmarkIds = new Set((remoteBookmarks || []).map(b => b.question_id));

      for (const quiz of localQuizzes) {
        if (!remoteQuizIds.has(quiz.id)) {
          await syncService.pushSavedQuiz(userId, quiz);
        }
      }
      for (const hist of localHistory) {
        if (!remoteHistoryIds.has(hist.id)) {
          // Note: Local history doesn't currently store attempts, so we only push the history record
          await syncService.pushQuizHistory(userId, hist);
        }
      }
      for (const bm of localBookmarks) {
        if (!remoteBookmarkIds.has(bm.id)) {
          await syncService.pushBookmark(userId, bm);
        }
      }

      // 4. Merge Remote Data into Local
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
    }
  }
};
