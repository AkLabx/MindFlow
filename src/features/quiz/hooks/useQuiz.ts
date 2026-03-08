import { useReducer, useCallback, useEffect, useState } from 'react';
import { logEvent } from '../services/analyticsService';
import { APP_CONFIG } from '../../../constants/config';
import { quizReducer, initialState, loadState } from '../stores/quizReducer';
import { Question, InitialFilters, QuizMode, Idiom, OneWord, QuizState, QuizHistoryRecord, SubjectStats } from '../types';

import { db } from '../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom hook to manage the global quiz application state using `useReducer`.
 *
 * This hook acts as the central controller for the application logic. It handles:
 * - State initialization (loading from LocalStorage).
 * - Persistence (Syncing active state to LocalStorage and IndexedDB).
 * - Navigation between different app screens (Home, Config, Quiz, Result).
 * - Action dispatching for quiz interactions (Answer, Next, Bookmark, etc.).
 *
 * @returns {object} An object containing the current `state`, derived properties (like `currentQuestion`), and action methods.
 */
export const useQuiz = () => {
  const [state, dispatch] = useReducer(quizReducer, initialState, loadState);
  const [isReviewMode, setIsReviewMode] = useState(false);

  // Persistence Effect 1: LocalStorage (Active Session)
  // Saves the state whenever it changes, if we are in an active session.
  // This allows the user to refresh the page without losing progress.
  useEffect(() => {
    if (state.status === 'quiz' || state.status === 'result' || state.status === 'flashcards' || state.status === 'ows-flashcards' || state.status === 'flashcards-complete') {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.QUIZ_SESSION, JSON.stringify(state));
    } else if (state.status === 'idle' || state.status === 'intro') {
      // Clear session when explicitly leaving the quiz flow to avoid stale data
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.QUIZ_SESSION);
    }
  }, [state]);

  // Persistence Effect 2: IndexedDB (Saved Quizzes)
  // Auto-saves the quiz progress to the local database for long-term storage.
  useEffect(() => {
    if (state.quizId && (state.status === 'quiz' || state.status === 'result')) {
      const saveToDb = () => {
        db.updateQuizProgress(state.quizId!, state).catch(err => console.error("Failed to auto-save to DB:", err));
      };

      if (state.isPaused) {
        // Save immediately when paused to ensure data is persisted before navigation
        saveToDb();
      } else {
        // Debounce updates during active quiz to prevent DB thrashing on every click
        const timeoutId = setTimeout(saveToDb, 2000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [state]);

  // Navigation Actions
  const enterHome = useCallback(() => dispatch({ type: 'ENTER_HOME' }), []);
  const enterConfig = useCallback(() => dispatch({ type: 'ENTER_CONFIG' }), []);
  const enterEnglishHome = useCallback(() => dispatch({ type: 'ENTER_ENGLISH_HOME' }), []);
  const enterVocabHome = useCallback(() => dispatch({ type: 'ENTER_VOCAB_HOME' }), []);
  const enterIdiomsConfig = useCallback(() => dispatch({ type: 'ENTER_IDIOMS_CONFIG' }), []);
  const enterOWSConfig = useCallback(() => dispatch({ type: 'ENTER_OWS_CONFIG' }), []);
  const enterProfile = useCallback(() => dispatch({ type: 'ENTER_PROFILE' }), []);
  const enterLogin = useCallback(() => dispatch({ type: 'ENTER_LOGIN' }), []);
  const goToIntro = useCallback(() => dispatch({ type: 'GO_TO_INTRO' }), []);

  // Initialization Actions
  const startQuiz = useCallback((filteredQuestions: Question[], filters: InitialFilters, mode: QuizMode = 'learning') => {
    logEvent('quiz_started', {
      subject: filters.subject,
      difficulty: filters.difficulty,
      question_count: filteredQuestions.length,
      mode: mode
    });
    dispatch({ type: 'START_QUIZ', payload: { questions: filteredQuestions, filters, mode } });
  }, []);

  const startFlashcards = useCallback((idioms: Idiom[], filters: InitialFilters) => {
    dispatch({ type: 'START_FLASHCARDS', payload: { idioms, filters } });
  }, []);

  const startOWSFlashcards = useCallback((data: OneWord[], filters: InitialFilters) => {
    dispatch({ type: 'START_OWS_FLASHCARDS', payload: { data, filters } });
  }, []);

  // Interaction Actions (Legacy/Direct Dispatch)
  const answerQuestion = useCallback((questionId: string, answer: string, timeTaken: number) => {
    dispatch({ type: 'ANSWER_QUESTION', payload: { questionId, answer, timeTaken } });
  }, []);

  const logTimeSpent = useCallback((questionId: string, timeTaken: number) => {
    dispatch({ type: 'LOG_TIME_SPENT', payload: { questionId, timeTaken } });
  }, []);

  const saveTimer = useCallback((questionId: string, time: number) => {
    dispatch({ type: 'SAVE_TIMER', payload: { questionId, time } });
  }, []);

  const syncGlobalTimer = useCallback((time: number) => {
    dispatch({ type: 'SYNC_GLOBAL_TIMER', payload: { time } });
  }, []);

  const nextQuestion = useCallback(() => dispatch({ type: 'NEXT_QUESTION' }), []);
  const prevQuestion = useCallback(() => dispatch({ type: 'PREV_QUESTION' }), []);
  const jumpToQuestion = useCallback((index: number) => dispatch({ type: 'JUMP_TO_QUESTION', payload: { index } }), []);

  const toggleBookmark = useCallback((questionId: string) => dispatch({ type: 'TOGGLE_BOOKMARK', payload: { questionId } }), []);
  const toggleReview = useCallback((questionId: string) => dispatch({ type: 'TOGGLE_REVIEW', payload: { questionId } }), []);
  const useFiftyFifty = useCallback((questionId: string, hiddenOptions: string[]) => dispatch({ type: 'USE_50_50', payload: { questionId, hiddenOptions } }), []);

  const pauseQuiz = useCallback((questionId?: string, remainingTime?: number) => {
    dispatch({ type: 'PAUSE_QUIZ', payload: { questionId, remainingTime } });
  }, []);

  const resumeQuiz = useCallback(() => {
    dispatch({ type: 'RESUME_QUIZ' });
  }, []);

  // Bulk Submission (Used by LearningSession to sync state back to main reducer)
  const submitSessionResults = useCallback((results: { answers: Record<string, string>, timeTaken: Record<string, number>, score: number, bookmarks: string[] }) => {
    logEvent('quiz_completed', {
      score: results.score,
      total_questions: state.activeQuestions.length,
      mode: state.mode
    });

    // Calculate detailed stats for QuizHistoryRecord
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
      const time = results.timeTaken[q.id] || 0;
      totalTimeSpent += time;

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

    // Calculate accuracy for each subject
    Object.keys(subjectStats).forEach(subj => {
      const stats = subjectStats[subj];
      stats.accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
    });

    const overallAccuracy = state.activeQuestions.length > 0 ? Math.round((totalCorrect / state.activeQuestions.length) * 100) : 0;

    const difficultyStr = Array.isArray(state.filters?.difficulty)
        ? state.filters.difficulty.join(', ')
        : (state.filters?.difficulty || 'Mixed');

    const historyRecord: QuizHistoryRecord = {
      id: uuidv4(),
      date: Date.now(),
      totalQuestions: state.activeQuestions.length,
      totalCorrect,
      totalIncorrect,
      totalSkipped,
      totalTimeSpent,
      overallAccuracy,
      difficulty: difficultyStr,
      subjectStats
    };

    // Save history to IndexedDB
    db.saveQuizHistory(historyRecord).catch(err => console.error("Failed to save quiz history", err));

    dispatch({ type: 'SUBMIT_SESSION_RESULTS', payload: results });
  }, [state.activeQuestions, state.mode, state.filters?.difficulty]);

  const finishQuiz = useCallback(() => {
    dispatch({ type: 'FINISH_QUIZ' });
  }, []);

  const finishFlashcards = useCallback(() => {
    dispatch({ type: 'FINISH_FLASHCARDS' });
  }, []);

  const restartQuiz = useCallback(() => dispatch({ type: 'RESTART_QUIZ' }), []);
  const goHome = useCallback(() => dispatch({ type: 'GO_HOME' }), []);

  // Derived state helpers
  const currentQuestion = state.activeQuestions[state.currentQuestionIndex];
  const totalQuestions = state.activeQuestions.length;
  const progress = totalQuestions > 0
    ? ((state.currentQuestionIndex + 1) / totalQuestions) * 100
    : 0;

  const loadSavedQuiz = useCallback((savedState: QuizState) => dispatch({ type: 'LOAD_SAVED_QUIZ', payload: savedState }), []);

  return {
    isReviewMode,
    setIsReviewMode,
    state,
    currentQuestion,
    totalQuestions,
    progress,
    enterHome,
    enterConfig,
    enterEnglishHome,
    enterVocabHome,
    enterIdiomsConfig,
    enterOWSConfig,
    enterProfile,
    enterLogin,
    goToIntro,
    startQuiz,
    startFlashcards,
    startOWSFlashcards,
    submitSessionResults,
    finishFlashcards,
    answerQuestion,
    logTimeSpent,
    saveTimer,
    syncGlobalTimer,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    toggleBookmark,
    toggleReview,
    useFiftyFifty,
    pauseQuiz,
    resumeQuiz,
    finishQuiz,
    restartQuiz,
    goHome,
    loadSavedQuiz
  };
};
