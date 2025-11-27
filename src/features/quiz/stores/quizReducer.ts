
import { QuizState, QuizAction } from '../types/store';
import { APP_CONFIG } from '../../../constants/config';

export const initialState: QuizState = {
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
  activeIdioms: [],
  activeOWS: [],
  filters: undefined,
  isPaused: false,
};

// Lazy initializer to restore session from localStorage
export const loadState = (defaultState: QuizState): QuizState => {
  if (typeof window === 'undefined') return defaultState;
  try {
    const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.QUIZ_SESSION);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only restore if we are in a valid active/result state
      if (parsed.status === 'quiz' || parsed.status === 'result' || parsed.status === 'flashcards' || parsed.status === 'flashcards-complete' || parsed.status === 'ows-flashcards') {
        return { ...defaultState, ...parsed };
      }
    }
  } catch (e) {
    console.warn("Failed to load quiz session:", e);
  }
  return defaultState;
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'ENTER_HOME':
      return { ...initialState, status: 'idle' };

    case 'ENTER_CONFIG':
      return { ...state, status: 'config' };

    case 'ENTER_ENGLISH_HOME':
      return { ...state, status: 'english-home' };

    case 'ENTER_VOCAB_HOME':
      return { ...state, status: 'vocab-home' };

    case 'ENTER_IDIOMS_CONFIG':
      return { ...state, status: 'idioms-config' };
      
    case 'ENTER_OWS_CONFIG':
      return { ...state, status: 'ows-config' };

    case 'ENTER_PROFILE':
      return { ...state, status: 'profile' };

    case 'ENTER_LOGIN':
      return { ...state, status: 'login' };

    case 'GO_TO_INTRO':
      return { ...initialState, status: 'intro' };

    case 'START_QUIZ': {
      const { questions, filters, mode } = action.payload;
      // Mock Mode: Default time per question. Ensure it's at least default.
      const globalTime = mode === 'mock' 
        ? Math.max(APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION, questions.length * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION) 
        : 0;
      
      return { 
        ...initialState, 
        status: 'quiz', 
        mode: mode,
        activeQuestions: questions,
        filters: filters,
        quizTimeRemaining: globalTime,
        // Initialize remaining times for learning mode (default 60s per question)
        remainingTimes: mode === 'learning' 
            ? questions.reduce((acc, q) => ({...acc, [q.id]: APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT}), {})
            : {}
      };
    }

    case 'START_FLASHCARDS': {
      const { idioms, filters } = action.payload;
      return {
        ...initialState,
        status: 'flashcards',
        activeIdioms: idioms,
        filters: filters,
        currentQuestionIndex: 0
      };
    }

    case 'START_OWS_FLASHCARDS': {
      const { data, filters } = action.payload;
      return {
        ...initialState,
        status: 'ows-flashcards',
        activeOWS: data,
        filters: filters,
        currentQuestionIndex: 0
      };
    }
    
    case 'ANSWER_QUESTION': {
      const { questionId, answer, timeTaken } = action.payload;
      const question = state.activeQuestions.find(q => q.id === questionId);
      
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
      
      // Accumulate time taken
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
      const maxIndex = state.status === 'flashcards' 
        ? (state.activeIdioms?.length || 0)
        : state.status === 'ows-flashcards'
        ? (state.activeOWS?.length || 0)
        : state.activeQuestions.length;

      const nextIndex = state.currentQuestionIndex + 1;
      
      if (nextIndex >= maxIndex) {
        // Stay on last card, wait for explicit finish
        if (state.status === 'flashcards' || state.status === 'ows-flashcards') {
           return state; 
        }
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

    case 'PAUSE_QUIZ': {
      const { questionId, remainingTime } = action.payload;
      let newRemainingTimes = state.remainingTimes;

      // If we have a specific time to save before pausing
      if (questionId && remainingTime !== undefined) {
          newRemainingTimes = { ...state.remainingTimes, [questionId]: remainingTime };
      }

      return {
        ...state,
        isPaused: true,
        remainingTimes: newRemainingTimes
      };
    }

    case 'RESUME_QUIZ': {
        return {
            ...state,
            isPaused: false
        };
    }

    case 'FINISH_QUIZ':
      return { ...state, status: 'result' };

    case 'SUBMIT_SESSION_RESULTS': {
        const { answers, timeTaken, score, bookmarks } = action.payload;
        return {
            ...state,
            answers,
            timeTaken,
            score,
            bookmarks, // Replace bookmarks with session state
            status: 'result'
        };
    }

    case 'FINISH_FLASHCARDS':
      return { ...state, status: 'flashcards-complete' };

    case 'RESTART_QUIZ': {
        // If restarting flashcards (Idioms or OWS)
        if (state.status === 'flashcards' || state.status === 'ows-flashcards' || state.status === 'flashcards-complete') {
            // Determine previous flashcard type based on loaded data
            const isOWS = state.activeOWS && state.activeOWS.length > 0;
            return {
                ...state,
                status: isOWS ? 'ows-flashcards' : 'flashcards',
                currentQuestionIndex: 0
            };
        }

        // If restarting regular quiz
        const globalTime = state.mode === 'mock' 
            ? Math.max(APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION, state.activeQuestions.length * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION) 
            : 0;
        return { 
            ...initialState, 
            status: 'quiz', 
            mode: state.mode,
            activeQuestions: state.activeQuestions,
            filters: state.filters,
            quizTimeRemaining: globalTime,
            remainingTimes: state.mode === 'learning' 
                ? state.activeQuestions.reduce((acc, q) => ({...acc, [q.id]: APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT}), {})
                : {}
        };
    }
      
    case 'GO_HOME':
      return { ...initialState, status: 'idle' };

    default:
      return state;
  }
}
