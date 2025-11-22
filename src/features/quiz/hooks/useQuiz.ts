
import { useReducer, useCallback, useEffect } from 'react';
import { QuizState, QuizAction, Question, InitialFilters, QuizMode } from '../types';
import { logEvent } from '../services/analyticsService';

const STORAGE_KEY = 'mindflow_quiz_session_v1';

const initialState: QuizState = {
  status: 'intro',
  mode: 'learning',
  currentQuestionIndex: 0,
  score: 0,
  answers: {},
  timeTaken: {},
  remainingTimes: {},
  quizTimeRemaining: 0,
  bookmarks: [],
  markedForReview: [],
  hiddenOptions: {},
  activeQuestions: [],
  filters: undefined,
};

// Lazy initializer to restore session from localStorage
const loadState = (defaultState: QuizState): QuizState => {
  if (typeof window === 'undefined') return defaultState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only restore if we are in a valid active/result state
      if (parsed.status === 'quiz' || parsed.status === 'result') {
        return { ...defaultState, ...parsed };
      }
    }
  } catch (e) {
    console.warn("Failed to load quiz session:", e);
  }
  return defaultState;
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'ENTER_HOME':
      return { ...initialState, status: 'idle' };

    case 'ENTER_CONFIG':
      return { ...state, status: 'config' };

    case 'GO_TO_INTRO':
      return { ...initialState, status: 'intro' };

    case 'START_QUIZ': {
      const { questions, filters, mode } = action.payload;
      // Mock Mode: 30 seconds per question
      const globalTime = mode === 'mock' ? questions.length * 30 : 0;
      
      return { 
        ...initialState, 
        status: 'quiz', 
        mode: mode,
        activeQuestions: questions,
        filters: filters,
        quizTimeRemaining: globalTime
      };
    }
    
    case 'ANSWER_QUESTION': {
      const { questionId, answer, timeTaken } = action.payload;
      const question = state.activeQuestions.find(q => q.id === questionId);
      
      // In Mock mode, we allow changing answers, so we remove the 'already answered' check
      // In Learning mode, we typically lock it, but the UI handles disabling.
      
      const isCorrect = question?.correct === answer;
      
      const prevAnswer = state.answers[questionId];
      let newScore = state.score;

      // Update score logic
      if (!prevAnswer) {
          // First time answering
          if (isCorrect) newScore++;
      } else {
          // Changing answer
          const wasCorrect = question?.correct === prevAnswer;
          if (wasCorrect && !isCorrect) newScore--;
          if (!wasCorrect && isCorrect) newScore++;
      }
      
      // Accumulate time taken (usually 0 in mock mode via this action, handled by LOG_TIME_SPENT)
      const prevTime = state.timeTaken[questionId] || 0;

      return {
        ...state,
        answers: { ...state.answers, [questionId]: answer },
        timeTaken: { ...state.timeTaken, [questionId]: prevTime + timeTaken },
        score: newScore,
      };
    }

    case 'LOG_TIME_SPENT': {
      const { questionId, timeTaken } = action.payload;
      const prevTime = state.timeTaken[questionId] || 0;
      return {
        ...state,
        timeTaken: { ...state.timeTaken, [questionId]: prevTime + timeTaken }
      };
    }

    case 'SAVE_TIMER': {
      const { questionId, time } = action.payload;
      return {
        ...state,
        remainingTimes: { ...state.remainingTimes, [questionId]: time }
      };
    }

    case 'SYNC_GLOBAL_TIMER': {
        return { ...state, quizTimeRemaining: action.payload.time };
    }

    case 'NEXT_QUESTION': {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= state.activeQuestions.length) {
        return { ...state, status: 'result' };
      }
      return { ...state, currentQuestionIndex: nextIndex };
    }

    case 'PREV_QUESTION': {
      const prevIndex = Math.max(0, state.currentQuestionIndex - 1);
      return { ...state, currentQuestionIndex: prevIndex };
    }

    case 'JUMP_TO_QUESTION': {
      return { ...state, currentQuestionIndex: action.payload.index };
    }

    case 'TOGGLE_BOOKMARK': {
      const { questionId } = action.payload;
      const isBookmarked = state.bookmarks.includes(questionId);
      return {
        ...state,
        bookmarks: isBookmarked 
          ? state.bookmarks.filter(id => id !== questionId)
          : [...state.bookmarks, questionId]
      };
    }

    case 'TOGGLE_REVIEW': {
      const { questionId } = action.payload;
      const isMarked = state.markedForReview.includes(questionId);
      return {
        ...state,
        markedForReview: isMarked 
          ? state.markedForReview.filter(id => id !== questionId)
          : [...state.markedForReview, questionId]
      };
    }

    case 'USE_50_50': {
      const { questionId, hiddenOptions } = action.payload;
      return {
        ...state,
        hiddenOptions: { ...state.hiddenOptions, [questionId]: hiddenOptions }
      };
    }

    case 'FINISH_QUIZ':
      return { ...state, status: 'result' };

    case 'RESTART_QUIZ': {
        const globalTime = state.mode === 'mock' ? state.activeQuestions.length * 30 : 0;
        return { 
            ...initialState, 
            status: 'quiz', 
            mode: state.mode,
            activeQuestions: state.activeQuestions,
            filters: state.filters,
            quizTimeRemaining: globalTime
        };
    }
      
    case 'GO_HOME':
      return { ...initialState, status: 'idle' };

    default:
      return state;
  }
}

export const useQuiz = () => {
  const [state, dispatch] = useReducer(quizReducer, initialState, loadState);

  // Persistence Effect
  useEffect(() => {
    if (state.status === 'quiz' || state.status === 'result') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else if (state.status === 'idle' || state.status === 'intro') {
      // Clear session when explicitly leaving quiz flow
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state]);

  const enterHome = useCallback(() => dispatch({ type: 'ENTER_HOME' }), []);
  const enterConfig = useCallback(() => dispatch({ type: 'ENTER_CONFIG' }), []);
  const goToIntro = useCallback(() => dispatch({ type: 'GO_TO_INTRO' }), []);
  
  const startQuiz = useCallback((filteredQuestions: Question[], filters: InitialFilters, mode: QuizMode = 'learning') => {
    // Log the start event with metadata about what they are studying
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
    // Log completion stats
    logEvent('quiz_completed', {
      score: state.score,
      total_questions: state.activeQuestions.length,
      percentage: state.activeQuestions.length > 0 ? Math.round((state.score / state.activeQuestions.length) * 100) : 0,
      // Explicitly cast and type to ensure TS knows these are numbers for addition
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
