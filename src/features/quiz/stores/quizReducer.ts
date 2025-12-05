import { QuizState, QuizAction } from '../types/store';
import { APP_CONFIG } from '../../../constants/config';

/**
 * The initial state for the Quiz Reducer.
 * Defines the starting values for a fresh session.
 */
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

/**
 * Initializes the quiz state, attempting to restore a previous session from LocalStorage.
 *
 * @param {QuizState} defaultState - The fallback state if no saved session exists.
 * @returns {QuizState} The loaded state or the default state.
 */
export const loadState = (defaultState: QuizState): QuizState => {
  if (typeof window === 'undefined') return defaultState;
  try {
    const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.QUIZ_SESSION);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only restore if we are in a valid active/result state to prevent stuck UIs
      if (parsed.status === 'quiz' || parsed.status === 'result' || parsed.status === 'flashcards' || parsed.status === 'flashcards-complete' || parsed.status === 'ows-flashcards') {
        return { ...defaultState, ...parsed };
      }
    }
  } catch (e) {
    console.warn("Failed to load quiz session:", e);
  }
  return defaultState;
};

/**
 * The core Reducer function for managing quiz state transitions.
 *
 * Handles all actions related to:
 * - Navigation (Next, Prev, Jump, Home)
 * - Quiz Lifecycle (Start, Pause, Resume, Finish, Restart)
 * - User Interaction (Answer, Bookmark, 50:50, Review)
 * - Timing (Log Time, Sync Timers)
 * - Session Management (Load Saved, Submit Results)
 *
 * @param {QuizState} state - The current state.
 * @param {QuizAction} action - The action to perform.
 * @returns {QuizState} The new state.
 */
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
      // Mock Mode: Calculate global time (e.g. 30s * questions)
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
          ? questions.reduce((acc, q) => ({ ...acc, [q.id]: APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT }), {})
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

      // Update score logic: handle re-answering
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
        // Stay on last card if flashcards (wait for explicit finish)
        if (state.status === 'flashcards' || state.status === 'ows-flashcards') {
          return state;
        }
        // Auto-finish quiz if last question reached (or wait for submit? usually manual submit in mock)
        // Here, we auto-transition to result for now or user clicks 'Finish'.
        // Assuming NEXT on last question goes to results:
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

      // If we have a specific time to save before pausing (e.g. current question timer)
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
        bookmarks, // Replace bookmarks with session state from IndexedDB
        status: 'result'
      };
    }

    case 'FINISH_FLASHCARDS':
      return { ...state, status: 'flashcards-complete' };

    case 'RESTART_QUIZ': {
      // If restarting flashcards (Idioms or OWS)
      if (state.status === 'flashcards' || state.status === 'ows-flashcards' || state.status === 'flashcards-complete') {
        // Determine previous flashcard type based on active data availability
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
          ? state.activeQuestions.reduce((acc, q) => ({ ...acc, [q.id]: APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT }), {})
          : {}
      };
    }

    case 'GO_HOME':
      return { ...initialState, status: 'idle' };

    case 'LOAD_SAVED_QUIZ': {
      const savedState = action.payload;
      // Deduplicate activeQuestions to prevent accumulation bugs during hydration
      if (savedState.activeQuestions) {
        const uniqueQuestions = Array.from(new Map(savedState.activeQuestions.map(q => [q.id, q])).values());
        return { ...savedState, activeQuestions: uniqueQuestions };
      }
      return savedState;
    }

    default:
      return state;
  }
}
