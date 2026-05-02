import { create } from 'zustand';
import { APP_CONFIG } from '../../../constants/config';
import { QuizState, QuizStatus, QuizMode, Question, InitialFilters } from '../types';

interface QuizSessionState extends QuizState {
  // Actions
  enterHome: () => void;
  enterConfig: () => void;
  enterBlueprints: () => void;
  enterEnglishHome: () => void;
  enterIdiomsConfig: () => void;
  enterSynonymsConfig: () => void;
  enterOWSConfig: () => void;
  enterProfile: () => void;
  enterLogin: () => void;
  goToIntro: () => void;
  startQuiz: (questions: Question[], filters: InitialFilters, mode: QuizMode) => void;
  answerQuestion: (questionId: string, answer: string, timeTaken: number) => void;
  logTimeSpent: (questionId: string, timeTaken: number) => void;
  saveTimer: (questionId: string, time: number) => void;
  syncGlobalTimer: (time: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  toggleBookmark: (questionId: string) => void;
  toggleReview: (questionId: string) => void;
  useFiftyFifty: (questionId: string, hiddenOptions: string[]) => void;
  pauseQuiz: (questionId?: string, remainingTime?: number) => void;
  resumeQuiz: () => void;
  finishQuiz: () => void;
  submitSessionResults: (results: { answers: Record<string, string>; timeTaken: Record<string, number>; score: number; bookmarks: string[] }) => void;
  restartQuiz: () => void;
  goHome: () => void;
  loadSavedQuiz: (savedState: QuizState) => void;
  reorderActiveQuestions: (newOrder: Question[]) => void;
}

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
  filters: undefined,
  isPaused: false,
};

const getInitialState = (): QuizState => {
  if (typeof window === 'undefined') return initialState;
  try {
    const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.QUIZ_SESSION);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only restore if we are in a valid active/result state to prevent stuck UIs
      if (parsed.status === 'quiz' || parsed.status === 'result') {
        return { ...initialState, ...parsed };
      }
    }
  } catch (e) {
    console.warn("Failed to load quiz session:", e);
  }
  return initialState;
};

export const useQuizSessionStore = create<QuizSessionState>((set, get) => ({
  ...getInitialState(),

  enterHome: () => set({ ...initialState, status: 'idle' }),
  enterConfig: () => set({ status: 'config' }),
  enterBlueprints: () => set({ status: 'blueprints' as any }),
  enterEnglishHome: () => set({ status: 'english-home' }),
  enterIdiomsConfig: () => set({ status: 'idioms-config' }),
  enterSynonymsConfig: () => set({ ...initialState, status: 'synonyms-config' }),
  enterOWSConfig: () => set({ status: 'ows-config' }),
  enterProfile: () => set({ status: 'profile' }),
  enterLogin: () => set({ status: 'login' }),
  goToIntro: () => set({ ...initialState, status: 'intro' }),

  startQuiz: (questions, filters, mode) => {
    const globalTime = (mode === 'mock' || mode === 'god')
      ? Math.max(APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION, questions.length * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION)
      : 0;

    set({
      ...initialState,
      status: 'quiz',
      mode: mode,
      activeQuestions: questions,
      filters: filters,
      quizTimeRemaining: globalTime,
      remainingTimes: mode === 'learning'
        ? questions.reduce((acc, q) => ({ ...acc, [q.id]: APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT }), {})
        : {}
    });
  },

  answerQuestion: (questionId, answer, timeTaken) => set((state) => {
    const question = state.activeQuestions.find(q => q.id === questionId);
    const isCorrect = question?.correct === answer;
    const prevAnswer = state.answers[questionId];
    let newScore = state.score;

    if (!prevAnswer) {
      if (isCorrect) newScore++;
    } else {
      const wasCorrect = question?.correct === prevAnswer;
      if (wasCorrect && !isCorrect) newScore--;
      if (!wasCorrect && isCorrect) newScore++;
    }

    const prevTime = state.timeTaken[questionId] || 0;

    return {
      answers: { ...state.answers, [questionId]: answer },
      timeTaken: { ...state.timeTaken, [questionId]: prevTime + timeTaken },
      score: newScore,
    };
  }),

  logTimeSpent: (questionId, timeTaken) => set((state) => {
    const prevTime = state.timeTaken[questionId] || 0;
    return {
      timeTaken: { ...state.timeTaken, [questionId]: prevTime + timeTaken }
    };
  }),

  saveTimer: (questionId, time) => set((state) => ({
    remainingTimes: { ...state.remainingTimes, [questionId]: time }
  })),

  syncGlobalTimer: (time) => set({ quizTimeRemaining: time }),

  nextQuestion: () => set((state) => {
    const maxIndex = state.activeQuestions.length;
    const nextIndex = state.currentQuestionIndex + 1;

    if (nextIndex >= maxIndex) {
      return { status: 'result' };
    }
    return { currentQuestionIndex: nextIndex };
  }),

  prevQuestion: () => set((state) => ({
    currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1)
  })),

  jumpToQuestion: (index) => set({ currentQuestionIndex: index }),

  toggleBookmark: (questionId) => set((state) => {
    const isBookmarked = state.bookmarks.includes(questionId);
    const question = state.activeQuestions.find(q => q.id === questionId);

    if (question) {
      if (isBookmarked) {
        import('../../../lib/db').then(({ db }) => db.removeBookmark(questionId).catch(console.error));
      } else {
        import('../../../lib/db').then(({ db }) => db.saveBookmark(question).catch(console.error));
      }
    }

    return {
      bookmarks: isBookmarked
        ? state.bookmarks.filter(id => id !== questionId)
        : [...state.bookmarks, questionId]
    };
  }),

  toggleReview: (questionId) => set((state) => {
    const isMarked = state.markedForReview.includes(questionId);
    return {
      markedForReview: isMarked
        ? state.markedForReview.filter(id => id !== questionId)
        : [...state.markedForReview, questionId]
    };
  }),

  useFiftyFifty: (questionId, hiddenOptions) => set((state) => ({
    hiddenOptions: { ...state.hiddenOptions, [questionId]: hiddenOptions }
  })),

  pauseQuiz: (questionId, remainingTime) => set((state) => {
    let newRemainingTimes = state.remainingTimes;
    if (questionId && remainingTime !== undefined) {
      newRemainingTimes = { ...state.remainingTimes, [questionId]: remainingTime };
    }
    return {
      isPaused: true,
      remainingTimes: newRemainingTimes
    };
  }),

  resumeQuiz: () => set({ isPaused: false }),

  finishQuiz: () => set({ status: 'result' }),

  submitSessionResults: (results) => set((state) => ({
    answers: results.answers,
    timeTaken: Object.keys(results.timeTaken).length > 0 ? results.timeTaken : state.timeTaken,
    score: results.score,
    bookmarks: results.bookmarks,
    status: 'result'
  })),

  restartQuiz: () => set((state) => {
    const globalTime = (state.mode === 'mock' || state.mode === 'god')
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
  }),

  goHome: () => set({ ...initialState, status: 'idle' }),

  reorderActiveQuestions: (newOrder) => set((state) => {
    const currentQuestion = state.activeQuestions[state.currentQuestionIndex];
    let newIndex = state.currentQuestionIndex;

    if (currentQuestion) {
      const foundIndex = newOrder.findIndex(q => q.id === currentQuestion.id);
      if (foundIndex !== -1) {
        newIndex = foundIndex;
      }
    }

    return {
      activeQuestions: newOrder,
      currentQuestionIndex: newIndex
    };
  }),

  loadSavedQuiz: (savedState) => set((state) => {
    if (savedState.activeQuestions) {
      const uniqueQuestions = Array.from(new Map(savedState.activeQuestions.map(q => [q.id, q])).values());
      return { ...savedState, activeQuestions: uniqueQuestions };
    }
    return savedState;
  }),
}));
