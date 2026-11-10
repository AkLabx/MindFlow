import { queryClient } from '../../../lib/queryClient';
import { db } from '../../../lib/db';
import { supabase } from '../../../lib/supabase';
import { Question, InitialFilters, QuizMode, SavedQuiz } from '../types';
import { APP_CONFIG } from '../../../constants/config';
import { initialState } from '../stores/useQuizSessionStore';
import { telemetry } from '../../../lib/telemetry';
import { performanceTracker, PERF_BUDGETS } from '../../../lib/performance';

export const MAX_QUIZ_QUESTIONS = 100;
export const DEFAULT_DRILL_QUESTION_COUNT = 25;

export interface QuizCreationResult {
  quizId: string;
  reused: boolean;
  error?: string;
}

/**
 * Shared service for creating and persisting quiz sessions.
 * This is the canonical source of truth for generating a new quiz state,
 * preventing duplicate sessions, and saving to IndexedDB/Supabase.
 * Enforces SLA budgets and emits telemetry per MindFlow Constitution Sections 8 & 11.
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
    performanceTracker.startMark('quiz_generation');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        performanceTracker.endMark('quiz_generation');
        const error = "You must be logged in to create a quiz.";
        telemetry.emit('quiz_generation_failed', { reason: error, filterIntersection: filters });
        return { quizId: '', reused: false, error };
      }
      const userId = session.user.id;

      // 1. Duplicate Detection (Quiz Session Identity)
      // Check for an existing unfinished quiz in local IndexedDB that matches logically.
      // Logical identity: Same mode, same ordered list of question IDs, and not completed.
      const savedQuizzes = await db.getAllSavedQuizzes();
      const unfinishedQuizzes = savedQuizzes.filter(q => q.state && q.state.status !== 'result');

      // 0. Hard System Ceiling Enforcement (Prevent Accidental Mega-Quizzes)
      const sanitizedQuestions = questions.length > MAX_QUIZ_QUESTIONS
        ? questions.slice(0, MAX_QUIZ_QUESTIONS)
        : questions;

      if (questions.length > MAX_QUIZ_QUESTIONS) {
        console.warn(`[quizCreationService] Clamped quiz questions from ${questions.length} to MAX_QUIZ_QUESTIONS (${MAX_QUIZ_QUESTIONS})`);
      }

      const targetQuestionIds = sanitizedQuestions.map(q => q.id).join(',');

      for (const existingQuiz of unfinishedQuizzes) {
        // Deeply check mode
        if (existingQuiz.mode !== mode) continue;

        // Check if the ordered question list is exactly identical
        const existingQuestionIds = (existingQuiz.questions || []).map(q => q.id).join(',');
        if (existingQuestionIds === targetQuestionIds) {
          // We found a logical match, so reuse this quiz session
          console.log(`[quizCreationService] Reusing existing quiz session: ${existingQuiz.id}`);
          const durationMs = Math.round(
            performanceTracker.endMark('quiz_generation', PERF_BUDGETS.QUIZ_GENERATION, {
              mode,
              count: sanitizedQuestions.length,
              reused: true,
            })
          );
          telemetry.emit('quiz_generated', {
            examId: filters.examName?.[0],
            mode,
            count: sanitizedQuestions.length,
            durationMs,
            reusedSession: true,
          });
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
        questions: sanitizedQuestions,
        state: {
          ...initialState,
          status: 'quiz',
          mode: mode,
          activeQuestions: sanitizedQuestions,
          filters: filters,
          quizId: quizId,
          quizTimeRemaining: mode === 'mock'
            ? Math.max(APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION, sanitizedQuestions.length * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION)
            : 0,
          remainingTimes: mode === 'learning'
            ? sanitizedQuestions.reduce((acc, q) => ({ ...acc, [q.id]: APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT }), {})
            : {}
        }
      };

      // 3. Local Persistence (seeded immediately for offline-first resilience)
      await db.saveQuiz(newQuiz, { skipRemotePush: true }).catch((err) => {
        console.warn("Failed to cache quiz in local IndexedDB:", err);
      });

      // 4. Atomic Cloud Persistence via single-transaction RPC (saved_quizzes + bridge_saved_quiz_questions)
      // Exclude heavy activeQuestions from remote state payload; questions are normalized in bridge_saved_quiz_questions
      const { activeQuestions, ...stateWithoutQuestions } = (newQuiz.state as any) || {};
      const bridgeData = newQuiz.questions.map((q, index) => ({
        question_id: q.id,
        sort_order: index,
      }));

      const { error: rpcError } = await supabase.rpc('create_quiz_session', {
        p_quiz_id: newQuiz.id,
        p_user_id: userId,
        p_name: newQuiz.name,
        p_created_at: newQuiz.createdAt,
        p_filters: newQuiz.filters,
        p_mode: newQuiz.mode,
        p_state: stateWithoutQuestions,
        p_questions: bridgeData,
      });

      if (rpcError) {
        console.error('Error creating atomic quiz session via RPC:', rpcError);
        // Roll back local IndexedDB entry so orphan sessions are not retained after server rejection
        await db.deleteQuiz(newQuiz.id, { skipRemotePush: true }).catch(() => {});
        performanceTracker.endMark('quiz_generation');
        const error = 'Failed to save quiz to server. Please try again.';
        telemetry.emit('quiz_generation_failed', { reason: error, filterIntersection: filters });
        return { quizId: '', reused: false, error };
      }

      queryClient.invalidateQueries({ queryKey: ['latest-paused-quiz'] });
      queryClient.invalidateQueries({ queryKey: ['saved-quizzes'] });

      const durationMs = Math.round(
        performanceTracker.endMark('quiz_generation', PERF_BUDGETS.QUIZ_GENERATION, {
          mode,
          count: sanitizedQuestions.length,
          reused: false,
        })
      );
      telemetry.emit('quiz_generated', {
        examId: filters.examName?.[0],
        mode,
        count: sanitizedQuestions.length,
        durationMs,
        reusedSession: false,
      });

      return { quizId: newQuiz.id, reused: false };
    } catch (err: any) {
      console.error("Failed to create quiz in service:", err);
      performanceTracker.endMark('quiz_generation');
      const errorMsg = err.message || 'An unexpected error occurred.';
      telemetry.emit('quiz_generation_failed', { reason: errorMsg, filterIntersection: filters });
      return { quizId: '', reused: false, error: errorMsg };
    }
  }
};
