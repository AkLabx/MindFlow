import { useCallback, useEffect, useState } from 'react';
import { useSyncStore } from '../stores/useSyncStore';
import { useAnalyticsStore } from '../stores/useAnalyticsStore';
import { logEvent } from '../services/analyticsService';
import { APP_CONFIG } from '../../../constants/config';
import { useQuizSessionStore } from '../stores/useQuizSessionStore';
import { Question, InitialFilters, QuizMode, Idiom, OneWord, SynonymWord, QuizRuntimeState, QuizHistoryRecord, SubjectStats } from '../types';
import { db } from '../../../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../../lib/supabase';
import { syncService } from '../../../lib/syncService';

/**
 * Custom hook to manage the global quiz application state.
 *
 * This hook acts as the central controller for the application logic. It proxies to `useQuizSessionStore`
 * to maintain 100% backward compatibility for all consuming components, while migrating the internal state
 * from `useReducer` to `Zustand`.
 *
 * @returns {object} An object containing the current `state`, derived properties (like `currentQuestion`), and action methods.
 */
export const useQuiz = () => {
  const [isReviewMode, setIsReviewMode] = useState(false);

  // Directly bind state and actions from the Zustand store
  const state = useQuizSessionStore();

  const flushSync = useCallback(() => {
    if (!state.quizId) return;

    const stateToSave = { ...state };
    Object.keys(stateToSave).forEach(key => {
      if (typeof (stateToSave as any)[key] === 'function') {
        delete (stateToSave as any)[key];
      }
    });

    db.updateQuizProgress(state.quizId, stateToSave as any).catch(console.error);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && state.quizId) {
        db.getQuiz(state.quizId).then(quiz => {
          if (quiz) syncService.pushSavedQuiz(session.user.id, quiz).catch(console.error);
        });
      }
    });
  }, [state]);

  // Persistence Effect: Server-Side Optimistic UI + Debounce + Safety Nets
  useEffect(() => {
    if (state.quizId && (state.status === 'quiz' || state.status === 'result')) {
      const stateToSave = { ...state };
      Object.keys(stateToSave).forEach(key => {
        if (typeof (stateToSave as any)[key] === 'function') {
          delete (stateToSave as any)[key];
        }
      });
      const { activeQuestions, ...stateWithoutQuestions } = stateToSave;

      const syncToSupabase = async () => {
          if (!navigator.onLine) return;
          try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.user) return;

              const userId = session.user.id;
              if (!userId) return;

              state.setSyncStatus('syncing_cloud');

              // Note: keepalive is handled at the network level or not critical
              // for updating via the standard client. We use the supabase client here.
              let updateError = null;
              const { error } = await supabase
                .from('saved_quizzes')
                .update({ state: stateWithoutQuestions })
                .eq('id', state.quizId)
                .eq('user_id', userId);
              updateError = error;

              if (updateError) {
                  state.setSyncStatus('sync_failed_retrying');
                  console.error("Supabase Debounce Push Error:", updateError);
              } else {
                  state.setSyncStatus('saved_local');
              }
          } catch (e) {
              state.setSyncStatus('sync_failed_retrying');
              console.error("Supabase Debounce Push Error", e);
          }
      };

      // 1. Debounce Logic: 2000ms delay for Optimistic UI protection
      const handler = setTimeout(() => {
         syncToSupabase();
      }, 2000);

      return () => {        clearTimeout(handler);
      };
    }
  }, [
    state.status, state.mode, state.currentQuestionIndex, state.score,
    state.answers, state.timeTaken, state.remainingTimes, state.quizTimeRemaining,
    state.bookmarks, state.markedForReview, state.hiddenOptions, state.activeQuestions,
    state.filters, state.isPaused, state.quizId
  ]);

  // Wrap startQuiz to include analytics
  const startQuiz = useCallback((filteredQuestions: Question[], filters: InitialFilters, mode: QuizMode = 'learning', quizId?: string) => {
    logEvent('quiz_started', {
      subject: filters.subject,
      difficulty: filters.difficulty,
      question_count: filteredQuestions.length,
      mode: mode
    });
    state.startQuiz(filteredQuestions, filters, mode, quizId);
  }, [state.startQuiz]);

  // Wrap submitSessionResults to include complex logic previously in useQuiz
  const submitSessionResults = useCallback(async (results: { answers: Record<string, string>, timeTaken: Record<string, number>, score: number, bookmarks: string[] }) => {
    logEvent('quiz_completed', {
      score: results.score,
      total_questions: state.activeQuestions.length,
      mode: state.mode
    });

    const subjectStats: Record<string, SubjectStats> = {};
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalSkipped = 0;
    let totalTimeSpent = 0;

    state.activeQuestions.forEach(q => {
      const subject = q.classification.subject || 'Unknown';
      if (!subjectStats[subject]) {
        subjectStats[subject] = { attempted: 0, correct: 0, incorrect: 0, skipped: 0, accuracy: 0 };
      }

      const answer = results.answers[q.id];
      const timeMs = results.timeTaken[q.id] || useAnalyticsStore.getState().timeTaken[q.id] || 0;
      totalTimeSpent += timeMs;

      if (!answer) {
        totalSkipped++;
        subjectStats[subject].skipped++;
      } else {
        subjectStats[subject].attempted++;
        const isCorrect = answer === q.correct;
        if (isCorrect) {
          totalCorrect++;
          subjectStats[subject].correct++;
        } else {
          totalIncorrect++;
          subjectStats[subject].incorrect++;
        }
      }
    });

    Object.keys(subjectStats).forEach(subj => {
      const stats = subjectStats[subj];
      stats.accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
    });

    const overallAccuracy = state.activeQuestions.length > 0 ? Math.round((totalCorrect / state.activeQuestions.length) * 100) : 0;

    const difficultyStr = Array.isArray(state.filters?.difficulty)
        ? state.filters.difficulty.join(', ')
        : (state.filters?.difficulty || 'Mixed');

    // Convert total ms to decimal seconds for history storage
    const totalTimeSpentSeconds = totalTimeSpent / 1000;

    const historyRecord: QuizHistoryRecord = {
      id: uuidv4(),
      quiz_id: state.quizId,
      date: Date.now(),
      totalQuestions: state.activeQuestions.length,
      totalCorrect,
      totalIncorrect,
      totalSkipped,
      totalTimeSpent: totalTimeSpentSeconds,
      overallAccuracy,
      difficulty: difficultyStr,
      subjectStats
    };

    // --- ATOMIC PUSH TO SUPABASE VIA RPC ---
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && state.quizId) {

            const stateToSave = { ...state, status: 'result' };
            Object.keys(stateToSave).forEach(key => {
              if (typeof (stateToSave as any)[key] === 'function') {
                delete (stateToSave as any)[key];
              }
            });
            const { activeQuestions, ...stateWithoutQuestions } = stateToSave;

            const { data: newHistoryId, error: rpcError } = await supabase.rpc('submit_quiz_session', {
                p_quiz_id: state.quizId,
                p_final_state: stateWithoutQuestions,
                p_total_questions: historyRecord.totalQuestions,
                p_total_correct: historyRecord.totalCorrect,
                p_total_incorrect: historyRecord.totalIncorrect,
                p_total_skipped: historyRecord.totalSkipped,
                p_time_taken: historyRecord.totalTimeSpent,
                p_overall_accuracy: historyRecord.overallAccuracy,
                p_difficulty: historyRecord.difficulty,
                p_subject_stats: historyRecord.subjectStats
            });

            if (rpcError) {
                console.error("Failed atomic quiz submission RPC:", rpcError);
            } else {
                console.log("Atomic submission successful. New history ID:", newHistoryId);
            }
        }
    } catch (err) {
        console.error("Atomic Push Error:", err);
    }

    state.submitSessionResults(results);
  }, [state.activeQuestions, state.mode, state.filters?.difficulty, state.submitSessionResults, state.quizId, state]);

  const currentQuestion = state.activeQuestions[state.currentQuestionIndex];
  const totalQuestions = state.activeQuestions.length;
  const progress = totalQuestions > 0
    ? ((state.currentQuestionIndex + 1) / totalQuestions) * 100
    : 0;

  // Wrap navigation handlers to include a flushSync call
  const goHome = useCallback(() => {
    flushSync();
    state.goHome();
  }, [flushSync, state.goHome]);

  const finishQuiz = useCallback(() => {
    flushSync();
    state.finishQuiz();
  }, [flushSync, state.finishQuiz]);

  const enterHome = useCallback(() => {
    flushSync();
    state.enterHome();
  }, [flushSync, state.enterHome]);

  const goToIntro = useCallback(() => {
    flushSync();
    state.goToIntro();
  }, [flushSync, state.goToIntro]);

  const enterConfig = useCallback(() => {
    flushSync();
    state.enterConfig();
  }, [flushSync, state.enterConfig]);

  const enterProfile = useCallback(() => {
    flushSync();
    state.enterProfile();
  }, [flushSync, state.enterProfile]);

  const enterLogin = useCallback(() => {
    flushSync();
    state.enterLogin();
  }, [flushSync, state.enterLogin]);

  return {
    isReviewMode,
    setIsReviewMode,
    state,
    currentQuestion,
    totalQuestions,
    progress,
    enterHome,
    enterConfig,
    enterEnglishHome: state.enterEnglishHome,
    enterIdiomsConfig: state.enterIdiomsConfig,
    enterOWSConfig: state.enterOWSConfig,
    enterSynonymsConfig: state.enterSynonymsConfig,
    enterProfile,
    enterLogin,
    goToIntro,
    startQuiz,
    submitSessionResults,
    answerQuestion: state.answerQuestion,
    logTimeSpent: state.logTimeSpent,
    saveTimer: state.saveTimer,
    syncGlobalTimer: state.syncGlobalTimer,
    nextQuestion: state.nextQuestion,
    prevQuestion: state.prevQuestion,
    jumpToQuestion: state.jumpToQuestion,
    toggleBookmark: state.toggleBookmark,
    toggleReview: state.toggleReview,
    useFiftyFifty: state.useFiftyFifty,
    pauseQuiz: async (questionId?: string, remainingTime?: number) => {
        // Trigger hard checkpoint before transitioning to paused state
        state.setSyncStatus('syncing_cloud');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && state.quizId) {
                // Update local DB first
                const stateToSave = { ...state, remainingTimes: (questionId && remainingTime !== undefined) ? { ...state.remainingTimes, [questionId]: remainingTime } : state.remainingTimes, isPaused: true };
                Object.keys(stateToSave).forEach(key => {
                    if (typeof (stateToSave as any)[key] === 'function') {
                        delete (stateToSave as any)[key];
                    }
                });
                await db.updateQuizProgress(state.quizId, stateToSave as any);

                // Push full quiz object
                const quiz = await db.getQuiz(state.quizId);
                if (quiz) {
                    await syncService.pushSavedQuiz(session.user.id, quiz);
                }
            }
            state.setSyncStatus('saved_local');
            // Only update local state once checkpoint succeeds
            state.pauseQuiz(questionId, remainingTime);
        } catch (err) {
            console.error("Failed explicit flush to cloud on pause:", err);
            state.setSyncStatus('sync_failed_retrying');
            alert('Failed to save progress. Please check your connection.');
        }
    },
    resumeQuiz: state.resumeQuiz,
    finishQuiz,
    restartQuiz: state.restartQuiz,
    goHome,
    loadSavedQuiz: state.loadSavedQuiz,
    reorderActiveQuestions: state.reorderActiveQuestions
  };
};
