
import { useReducer, useCallback, useEffect } from 'react';
import { logEvent } from '../services/analyticsService';
import { APP_CONFIG } from '../../../constants/config';
import { quizReducer, initialState, loadState } from '../stores/quizReducer';
import { Question, InitialFilters, QuizMode } from '../types';

export const useQuiz = () => {
  const [state, dispatch] = useReducer(quizReducer, initialState, loadState);

  // Persistence Effect
  useEffect(() => {
    if (state.status === 'quiz' || state.status === 'result') {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.QUIZ_SESSION, JSON.stringify(state));
    } else if (state.status === 'idle' || state.status === 'intro') {
      // Clear session when explicitly leaving quiz flow
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.QUIZ_SESSION);
    }
  }, [state]);

  const enterHome = useCallback(() => dispatch({ type: 'ENTER_HOME' }), []);
  const enterConfig = useCallback(() => dispatch({ type: 'ENTER_CONFIG' }), []);
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

  const finishQuiz = useCallback(() => {
    logEvent('quiz_completed', {
      score: state.score,
      total_questions: state.activeQuestions.length,
      percentage: state.activeQuestions.length > 0 ? Math.round((state.score / state.activeQuestions.length) * 100) : 0,
      time_spent_total: (Object.values(state.timeTaken) as number[]).reduce((a: number, b: number) => a + b, 0),
      mode: state.mode
    });
    dispatch({ type: 'FINISH_QUIZ' });
  }, [state.score, state.activeQuestions.length, state.timeTaken, state.mode]);

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
    goToIntro,
    startQuiz,
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
    finishQuiz,
    restartQuiz,
    goHome
  };
};
