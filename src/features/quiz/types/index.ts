import { Question, InitialFilters } from '../../../types/models';
import { QuizState, QuizMode } from './store';

// Re-export models so existing imports in components don't break
export * from '../../../types/models';
export * from './store';

/**
 * Represents a saved quiz session in the local database.
 */
export interface SavedQuiz {
  /** Unique ID of the saved quiz. */
  id: string;
  /** User-defined name for the quiz. */
  name: string;
  /** Timestamp of creation (ms). */
  createdAt: number;
  /** Filters used to generate this quiz. */
  filters: InitialFilters;
  /** The mode of the quiz (Learning vs Mock). */
  mode: QuizMode;
  /** The list of questions included in this quiz. */
  questions: Question[];
  /** The current progress state of the quiz. */
  state: QuizState;
}

/**
 * List of keys available for filtering questions.
 * Used for iterating over filter categories in the UI and logic.
 */
export const filterKeys = [
  'subject', 'topic', 'subTopic',
  'difficulty', 'questionType',
  'examName', 'examYear', 'examDateShift',
  'tags'
] as const;

/**
 * Helper function to extract a specific filter value from a Question object.
 *
 * Maps the flat filter keys (e.g., 'subject', 'examName') to the nested properties
 * within the Question data model (e.g., `question.classification.subject`).
 *
 * @param {Question} question - The question object.
 * @param {keyof InitialFilters} key - The filter key to extract.
 * @returns {string | string[] | undefined} The value associated with the key.
 */
export function getQuestionValue(question: Question, key: keyof InitialFilters): string | string[] | undefined {
  switch (key) {
    case 'subject': return question.classification.subject;
    case 'topic': return question.classification.topic;
    case 'subTopic': return question.classification.subTopic;
    case 'difficulty': return question.properties.difficulty;
    case 'questionType': return question.properties.questionType;
    case 'examName': return question.sourceInfo.examName;
    case 'examYear': return String(question.sourceInfo.examYear);
    case 'examDateShift': return question.sourceInfo.examDateShift;
    case 'tags': return question.tags;
    default: return undefined;
  }
}

/**
 * Interface for the global Settings Context.
 * Defines the available settings and their toggle functions.
 */
export interface SettingsContextType {
  /** Whether Dark Mode is enabled. */
  isDarkMode: boolean;
  /** Toggles Dark Mode on/off. */
  toggleDarkMode: () => void;
  /** Whether Sound Effects are enabled. */
  isSoundEnabled: boolean;
  /** Toggles Sound Effects on/off. */
  toggleSound: () => void;
  /** Whether Haptic Feedback (vibration) is enabled. */
  isHapticEnabled: boolean;
  /** Toggles Haptic Feedback on/off. */
  toggleHaptics: () => void;
  /** Whether Background Animations (e.g., fireballs) are enabled. */
  areBgAnimationsEnabled: boolean;
  /** Toggles Background Animations on/off. */
  toggleBgAnimations: () => void;
}
