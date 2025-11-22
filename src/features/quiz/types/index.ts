
export interface SourceInfo {
  examName: string;
  examYear: number;
  examDateShift?: string;
}

export interface Classification {
  subject: string;
  topic: string;
  subTopic?: string;
}

export interface Properties {
  difficulty: string; // 'Easy' | 'Medium' | 'Hard'
  questionType: string; // 'MCQ'
}

export interface Explanation {
  summary?: string;
  analysis_correct?: string;
  analysis_incorrect?: string;
  conclusion?: string;
  fact?: string;
}

export interface Question {
  id: string;
  sourceInfo: SourceInfo;
  classification: Classification;
  tags: string[];
  properties: Properties;
  question: string;
  question_hi?: string;
  options: string[];
  options_hi?: string[];
  correct: string; // The actual text of the correct answer
  explanation: Explanation;
}

export type QuizStatus = 'intro' | 'idle' | 'config' | 'quiz' | 'result';

export interface InitialFilters {
  subject: string[];
  topic: string[];
  subTopic: string[];
  difficulty: string[];
  questionType: string[];
  examName: string[];
  examYear: string[];
  tags: string[];
}

export const filterKeys = [
  'subject', 'topic', 'subTopic', 
  'difficulty', 'questionType', 
  'examName', 'examYear', 'tags'
] as const;

export function getQuestionValue(question: Question, key: keyof InitialFilters): string | string[] | undefined {
  switch (key) {
    case 'subject': return question.classification.subject;
    case 'topic': return question.classification.topic;
    case 'subTopic': return question.classification.subTopic;
    case 'difficulty': return question.properties.difficulty;
    case 'questionType': return question.properties.questionType;
    case 'examName': return question.sourceInfo.examName;
    case 'examYear': return String(question.sourceInfo.examYear);
    case 'tags': return question.tags;
    default: return undefined;
  }
}

export interface QuizState {
  status: QuizStatus;
  currentQuestionIndex: number;
  score: number;
  answers: Record<string, string>; // questionId -> selectedOptionText
  timeTaken: Record<string, number>; // questionId -> seconds
  bookmarks: string[]; // array of questionIds
  markedForReview: string[]; // array of questionIds
  hiddenOptions: Record<string, string[]>; // questionId -> array of hidden option texts (50:50)
  activeQuestions: Question[]; // The filtered subset of questions being used
  filters?: InitialFilters; // Persisted filters for context/breadcrumbs
}

export type QuizAction =
  | { type: 'ENTER_HOME' }
  | { type: 'ENTER_CONFIG' }
  | { type: 'GO_TO_INTRO' }
  | { type: 'START_QUIZ'; payload: { questions: Question[]; filters: InitialFilters } }
  | { type: 'ANSWER_QUESTION'; payload: { questionId: string; answer: string; timeTaken: number } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'JUMP_TO_QUESTION'; payload: { index: number } }
  | { type: 'TOGGLE_BOOKMARK'; payload: { questionId: string } }
  | { type: 'TOGGLE_REVIEW'; payload: { questionId: string } }
  | { type: 'USE_50_50'; payload: { questionId: string; hiddenOptions: string[] } }
  | { type: 'FINISH_QUIZ' }
  | { type: 'RESTART_QUIZ' }
  | { type: 'GO_HOME' };

export interface SettingsContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  isHapticEnabled: boolean;
  toggleHaptics: () => void;
  areBgAnimationsEnabled: boolean;
  toggleBgAnimations: () => void;
}
