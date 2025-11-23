
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

// --- Idiom Types ---
export interface IdiomContent {
  phrase: string;
  meanings: {
    english: string;
    hindi: string;
  };
  usage: string;
  extras: {
    mnemonic: string;
    origin: string;
  };
}

export interface Idiom {
  id: string;
  sourceInfo: {
    pdfName: string;
    examYear: number;
  };
  properties: {
    difficulty: string;
    status: string;
  };
  content: IdiomContent;
}

export interface InitialFilters {
  subject: string[];
  topic: string[];
  subTopic: string[];
  difficulty: string[];
  questionType: string[];
  examName: string[];
  examYear: string[];
  examDateShift: string[];
  tags: string[];
}

// --- Future Proofing for Auth & History ---

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: Record<string, any>;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  date: string;
  mode: 'learning' | 'mock';
  score: number;
  totalQuestions: number;
  timeSpent: number; // seconds
  subjectBreakdown: Record<string, number>; // subject -> accuracy %
}