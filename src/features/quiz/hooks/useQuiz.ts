import { useReducer, useCallback } from 'react';
import { QuizState, QuizAction, Question } from '../types';

const initialState: QuizState = {
  status: 'intro',
  currentQuestionIndex: 0,
  score: 0,
  answers: {},
  timeTaken: {},
  bookmarks: [],
  markedForReview: [],
  hiddenOptions: {},
  activeQuestions: [],
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'ENTER_HOME':
      return { ...initialState, status: 'idle' };

    case 'ENTER_CONFIG':
      return { ...state, status: 'config' };

    case 'GO_TO_INTRO':
      return { ...initialState, status: 'intro' };

    case 'START_QUIZ':
      return { 
        ...initialState, 
        status: 'quiz', 
        activeQuestions: action.payload.questions 
      };
    
    case 'ANSWER_QUESTION': {
      const { questionId, answer, timeTaken } = action.payload;
      const question = state.activeQuestions.find(q => q.id === questionId);
      
      // Prevent re-answering if already answered (optional, but good for stats)
      if (state.answers[questionId]) return state;

      const isCorrect = question?.correct === answer;
      
      return {
        ...state,
        answers: { ...state.answers, [questionId]: answer },
        timeTaken: { ...state.timeTaken, [questionId]: timeTaken },
        score: isCorrect ? state.score + 1 : state.score,
      };
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

    case 'RESTART_QUIZ':
      return { 
        ...initialState, 
        status: 'quiz', 
        activeQuestions: state.activeQuestions 
      };
      
    case 'GO_HOME':
      return { ...initialState, status: 'idle' };

    default:
      return state;
  }
}

export const useQuiz = () => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const enterHome = useCallback(() => dispatch({ type: 'ENTER_HOME' }), []);
  const enterConfig = useCallback(() => dispatch({ type: 'ENTER_CONFIG' }), []);
  const goToIntro = useCallback(() => dispatch({ type: 'GO_TO_INTRO' }), []);
  
  const startQuiz = useCallback((filteredQuestions: Question[]) => {
    dispatch({ type: 'START_QUIZ', payload: { questions: filteredQuestions } });
  }, []);
  
  const answerQuestion = useCallback((questionId: string, answer: string, timeTaken: number) => {
    dispatch({ type: 'ANSWER_QUESTION', payload: { questionId, answer, timeTaken } });
  }, []);

  const nextQuestion = useCallback(() => dispatch({ type: 'NEXT_QUESTION' }), []);
  const prevQuestion = useCallback(() => dispatch({ type: 'PREV_QUESTION' }), []);
  const jumpToQuestion = useCallback((index: number) => dispatch({ type: 'JUMP_TO_QUESTION', payload: { index } }), []);
  
  const toggleBookmark = useCallback((questionId: string) => dispatch({ type: 'TOGGLE_BOOKMARK', payload: { questionId } }), []);
  const toggleReview = useCallback((questionId: string) => dispatch({ type: 'TOGGLE_REVIEW', payload: { questionId } }), []);
  const useFiftyFifty = useCallback((questionId: string, hiddenOptions: string[]) => dispatch({ type: 'USE_50_50', payload: { questionId, hiddenOptions } }), []);

  const finishQuiz = useCallback(() => dispatch({ type: 'FINISH_QUIZ' }), []);
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