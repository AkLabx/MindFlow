
import { Question, InitialFilters, Idiom, OneWord } from '../../../types/models';

export type QuizStatus = 'intro' | 'idle' | 'config' | 'quiz' | 'flashcards' | 'flashcards-complete' | 'result' | 'english-home' | 'vocab-home' | 'idioms-config' | 'ows-config' | 'ows-flashcards';
export type QuizMode = 'learning' | 'mock';

export interface QuizState {
  status: QuizStatus;
  mode: QuizMode;
  currentQuestionIndex: number; // Also used for Flashcard Index
  score: number;
  answers: Record<string, string>; // questionId -> selectedOptionText
  timeTaken: Record<string, number>; // questionId -> seconds
  remainingTimes: Record<string, number>; // questionId -> seconds left (Learning Mode)
  quizTimeRemaining: number; // Global seconds left (Mock Mode)
  bookmarks: string[]; // array of questionIds
  markedForReview: string[]; // array of questionIds
  hiddenOptions: Record<string, string[]>; // questionId -> array of hidden option texts (50:50)
  activeQuestions: Question[]; // The filtered subset of questions being used
  activeIdioms?: Idiom[]; // The filtered subset of idioms for flashcards
  activeOWS?: OneWord[]; // The filtered subset of OWS for flashcards
  filters?: InitialFilters; // Persisted filters for context/breadcrumbs
}

export type QuizAction =
  | { type: 'ENTER_HOME' }
  | { type: 'ENTER_CONFIG' }
  | { type: 'ENTER_ENGLISH_HOME' }
  | { type: 'ENTER_VOCAB_HOME' }
  | { type: 'ENTER_IDIOMS_CONFIG' }
  | { type: 'ENTER_OWS_CONFIG' }
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
  | { type: 'FINISH_QUIZ' }
  | { type: 'SUBMIT_SESSION_RESULTS'; payload: { answers: Record<string, string>; timeTaken: Record<string, number>; score: number; bookmarks: string[] } }
  | { type: 'FINISH_FLASHCARDS' }
  | { type: 'RESTART_QUIZ' }
  | { type: 'GO_HOME' };
