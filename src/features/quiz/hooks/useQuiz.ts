
import { useReducer, useCallback, useEffect } from 'react';
import { logEvent } from '../services/analyticsService';
import { APP_CONFIG } from '../../../constants/config';
import { quizReducer, initialState, loadState } from '../stores/quizReducer';
import { Question, InitialFilters, QuizMode, Idiom, OneWord } from '../types';

export const useQuiz = () => {
  const [state, dispatch] = useReducer(quizReducer, initialState, loadState);

  // Persistence Effect
  useEffect(() => {
    if (state.status === 'quiz' || state.status === 'result' || state.status === 'flashcards' || state.status === 'ows-flashcards' || state.status === 'flashcards-complete') {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.QUIZ_SESSION, JSON.stringify(state));
    } else if (state.status === 'idle' || state.status === 'intro') {
      // Clear session when explicitly leaving quiz flow
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.QUIZ_SESSION);
    }
  }, [state]);

  const enterHome = useCallback(() => dispatch({ type: 'ENTER_HOME' }), []);
  const enterConfig = useCallback(() => dispatch({ type: 'ENTER_CONFIG' }), []);
  const enterEnglishHome = useCallback(() => dispatch({ type: 'ENTER_ENGLISH_HOME' }), []);
  const enterVocabHome = useCallback(() => dispatch({ type: 'ENTER_VOCAB_HOME' }), []);
  const enterIdiomsConfig = useCallback(() => dispatch({ type: 'ENTER_IDIOMS_CONFIG' }), []);
  const enterOWSConfig = useCallback(() => dispatch({ type: 'ENTER_OWS_CONFIG' }), []);
  const goToIntro = useCallback(() => dispatch({ type: 'GO_TO_INTRO' }), []);
  
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
  
  // Deprecated in favor of local session logic, but kept for backward compat if needed
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

  // New method for bulk submission from separate sessions
  const submitSessionResults = useCallback((results: { answers: Record<string, string>, timeTaken: Record<string, number>, score: number, bookmarks: string[] }) => {
      logEvent('quiz_completed', {
        score: results.score,
        total_questions: state.activeQuestions.length,
        mode: state.mode
      });
      dispatch({ type: 'SUBMIT_SESSION_RESULTS', payload: results });
  }, [state.activeQuestions.length, state.mode]);

  const finishQuiz = useCallback(() => {
    dispatch({ type: 'FINISH_QUIZ' });
  }, []);

  const finishFlashcards = useCallback(() => {
      dispatch({ type: 'FINISH_FLASHCARDS' });
  }, []);

  const restartQuiz = useCallback(() => dispatch({ type: 'RESTART_QUIZ' }), []);
  const goHome = useCallback(() => dispatch({ type: 'GO_HOME' }), []);

  // Derived state
  const currentQuestion = state.activeQuestions[state.currentQuestionIndex];
  const totalQuestions = state.activeQuestions.length;
  const progress = totalQuestions > 0 
    ? ((state.currentQuestionIndex + 1) / totalQuestions) * 100 
    : 0;

  return {
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
    goHome
  };
};
