import { Question, InitialFilters, Idiom, OneWord } from '../../../types/models';

/**
 * Represents the various distinct screens or states of the application.
 */
export type QuizStatus =
  | 'intro'              // Landing Page
  | 'idle'               // Dashboard
  | 'config'             // General Quiz Configuration
  | 'quiz'               // Active Quiz Session (Question View)
  | 'flashcards'         // Active Idiom Flashcard Session
  | 'flashcards-complete'// Idiom Flashcard Summary
  | 'result'             // Quiz Result Summary
  | 'english-home'       // English Subject Home
  | 'vocab-home'         // Vocabulary Home
  | 'idioms-config'      // Idioms Configuration
  | 'ows-config'         // One Word Substitution Configuration
  | 'ows-flashcards'     // Active OWS Flashcard Session
  | 'profile'            // User Profile Screen
  | 'login';             // Auth Screen (if applicable)

/**
 * Modes of the quiz operation.
 * - 'learning': Interactive, immediate feedback, untimed or per-question timer.
 * - 'mock': Exam simulation, global timer, no immediate feedback.
 */
export type QuizMode = 'learning' | 'mock';

/**
 * The core state object for the Quiz Reducer.
 * Manages the entire session state including navigation, progress, scores, and active data.
 */
export interface QuizState {
  /** Current screen/view of the application. */
  status: QuizStatus;
  /** Current quiz mode (Learning vs Mock). */
  mode: QuizMode;
  /** Index of the currently active question or flashcard. */
  currentQuestionIndex: number;
  /** Current score (number of correct answers). */
  score: number;
  /** Map of Question ID to the selected answer text. */
  answers: Record<string, string>;
  /** Map of Question ID to seconds spent on that question. */
  timeTaken: Record<string, number>;
  /** Map of Question ID to remaining seconds (Learning Mode per-question timer). */
  remainingTimes: Record<string, number>;
  /** Global seconds remaining for the entire session (Mock Mode). */
  quizTimeRemaining: number;
  /** List of bookmarked Question IDs. */
  bookmarks: string[];
  /** List of Question IDs marked for review. */
  markedForReview: string[];
  /** Map of Question ID to list of options hidden by 50:50 lifeline. */
  hiddenOptions: Record<string, string[]>;
  /** The subset of questions active in the current session. */
  activeQuestions: Question[];
  /** The subset of idioms active in the current session (if applicable). */
  activeIdioms?: Idiom[];
  /** The subset of OWS active in the current session (if applicable). */
  activeOWS?: OneWord[];
  /** The filters configuration used to start this session. */
  filters?: InitialFilters;
  /** Whether the session is currently paused. */
  isPaused?: boolean;
  /** The database ID of the saved quiz (if loaded from history). */
  quizId?: string;
}

/**
 * Discriminated Union of all possible actions for the Quiz Reducer.
 */
export type QuizAction =
  | { type: 'ENTER_HOME' }
  | { type: 'ENTER_CONFIG' }
  | { type: 'ENTER_ENGLISH_HOME' }
  | { type: 'ENTER_VOCAB_HOME' }
  | { type: 'ENTER_IDIOMS_CONFIG' }
  | { type: 'ENTER_OWS_CONFIG' }
  | { type: 'ENTER_PROFILE' }
  | { type: 'ENTER_LOGIN' }
  | { type: 'GO_TO_INTRO' }
  | { type: 'START_QUIZ'; payload: { questions: Question[]; filters: InitialFilters; mode: QuizMode } }
  | { type: 'START_FLASHCARDS'; payload: { idioms: Idiom[]; filters: InitialFilters } }
  | { type: 'START_OWS_FLASHCARDS'; payload: { data: OneWord[]; filters: InitialFilters } }
  | { type: 'ANSWER_QUESTION'; payload: { questionId: string; answer: string; timeTaken: number } }
  | { type: 'LOG_TIME_SPENT'; payload: { questionId: string; timeTaken: number } }
  | { type: 'SAVE_TIMER'; payload: { questionId: string; time: number } }
  | { type: 'SYNC_GLOBAL_TIMER'; payload: { time: number } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'JUMP_TO_QUESTION'; payload: { index: number } }
  | { type: 'TOGGLE_BOOKMARK'; payload: { questionId: string } }
  | { type: 'TOGGLE_REVIEW'; payload: { questionId: string } }
  | { type: 'USE_50_50'; payload: { questionId: string; hiddenOptions: string[] } }
  | { type: 'PAUSE_QUIZ'; payload: { questionId?: string; remainingTime?: number } }
  | { type: 'RESUME_QUIZ' }
  | { type: 'FINISH_QUIZ' }
  | { type: 'SUBMIT_SESSION_RESULTS'; payload: { answers: Record<string, string>; timeTaken: Record<string, number>; score: number; bookmarks: string[] } }
  | { type: 'FINISH_FLASHCARDS' }
  | { type: 'RESTART_QUIZ' }
  | { type: 'LOAD_SAVED_QUIZ'; payload: QuizState }
  | { type: 'GO_HOME' };
