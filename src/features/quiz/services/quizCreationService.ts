import { db } from '../../../lib/db';
import { supabase } from '../../../lib/supabase';
import { Question, InitialFilters, QuizMode, SavedQuiz } from '../types';
import { APP_CONFIG } from '../../../constants/config';
import { initialState } from '../stores/useQuizSessionStore';

export interface QuizCreationResult {
  quizId: string;
  reused: boolean;
  error?: string;
}

/**
 * Shared service for creating and persisting quiz sessions.
 * This is the canonical source of truth for generating a new quiz state,
 * preventing duplicate sessions, and saving to IndexedDB/Supabase.
 */
export const quizCreationService = {
  /**
   * Creates a new quiz or resumes an existing matching one.
   *
   * @param questions The selected subset of questions (metadata only is fine)
   * @param filters The user's applied filters
   * @param mode The quiz mode (learning/mock)
   * @param quizName Optional custom name
   * @returns Structured result indicating whether a session was reused or newly created.
   */
  createQuiz: async (
    questions: Question[],
    filters: InitialFilters,
    mode: QuizMode,
    quizName?: string
  ): Promise<QuizCreationResult> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { quizId: '', reused: false, error: "You must be logged in to create a quiz." };
      }
      const userId = session.user.id;

      // 1. Duplicate Detection (Quiz Session Identity)
      // Check for an existing unfinished quiz in local IndexedDB that matches logically.
      // Logical identity: Same mode, same ordered list of question IDs, and not completed.
      const savedQuizzes = await db.getAllSavedQuizzes();
      const unfinishedQuizzes = savedQuizzes.filter(q => q.state && q.state.status !== 'result');

      const targetQuestionIds = questions.map(q => q.id).join(',');

      for (const existingQuiz of unfinishedQuizzes) {
        // Deeply check mode
        if (existingQuiz.mode !== mode) continue;

        // Check if the ordered question list is exactly identical
        const existingQuestionIds = (existingQuiz.questions || []).map(q => q.id).join(',');
        if (existingQuestionIds === targetQuestionIds) {
           // We found a logical match, so reuse this quiz session
           console.log(`[quizCreationService] Reusing existing quiz session: ${existingQuiz.id}`);
           return { quizId: existingQuiz.id, reused: true };
        }
      }

      // 2. Build New Quiz State
      const quizId = crypto.randomUUID();
      const finalName = quizName?.trim() || `Quiz ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

      const newQuiz: SavedQuiz = {
        id: quizId,
        name: finalName,
        createdAt: Date.now(),
        filters: filters,
        mode: mode,
        questions: questions,
        state: {
          ...initialState,
          status: 'quiz',
          mode: mode,
          activeQuestions: questions,
          filters: filters,
          quizId: quizId,
          quizTimeRemaining: mode === 'mock'
            ? Math.max(APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION, questions.length * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION)
            : 0,
          remainingTimes: mode === 'learning'
            ? questions.reduce((acc, q) => ({ ...acc, [q.id]: APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT }), {})
            : {}
        }
      };

      // 3. Local Persistence
      await db.saveQuiz(newQuiz).catch((err) => {
        console.warn("Failed to cache quiz in local IndexedDB:", err);
      });

      // 4. Cloud Persistence (saved_quizzes)
      const { error: quizError } = await supabase.from('saved_quizzes').insert({
        id: newQuiz.id,
        user_id: userId,
        name: newQuiz.name,
        created_at: newQuiz.createdAt,
        filters: newQuiz.filters,
        mode: newQuiz.mode,
        state: newQuiz.state,
      });

      if (quizError) {
        console.error('Error saving quiz to Supabase:', quizError);
        return { quizId: '', reused: false, error: 'Failed to save quiz to server. Please try again.' };
      }

      // 5. Cloud Persistence (bridge table mappings)
      const bridgeData = newQuiz.questions.map((q, index) => ({
        quiz_id: newQuiz.id,
        question_id: q.id,
        sort_order: index,
        user_id: userId
      }));

      const { error: bridgeError } = await supabase.from('bridge_saved_quiz_questions').insert(bridgeData);

      if (bridgeError) {
        console.error('Error saving bridge data:', bridgeError);
        return { quizId: '', reused: false, error: 'Failed to save quiz questions to server. Please try again.' };
      }

      return { quizId: newQuiz.id, reused: false };
    } catch (err: any) {
      console.error("Failed to create quiz in service:", err);
      return { quizId: '', reused: false, error: err.message || 'An unexpected error occurred.' };
    }
  }
};
