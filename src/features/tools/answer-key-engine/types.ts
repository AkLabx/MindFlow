/**
 * MindFlow Exam Intelligence & Answer Key Engine Types
 */

export interface ExamSectionConfig {
  id: string; // 'reasoning' | 'gk' | 'math' | 'english'
  name: string;
  qCount: number;
  weight: number;
}

export interface ExamConfig {
  id: string;
  examName: string;
  organizingBody: string;
  totalQuestions: number;
  positiveMarks: number;
  negativeMarks: number;
  minNormalizationSample: number;
  sections: ExamSectionConfig[];
  isActive?: boolean;
}

export type CandidateCategory = 'UR' | 'OBC' | 'EWS' | 'SC' | 'ST' | 'PwD' | 'ESM';

export interface CandidateDetails {
  rollNumber: string;
  candidateName: string;
  examDate: string;
  shiftName: string;
  shiftCode: string;
  venueName: string;
}

export interface ParsedQuestion {
  questionId: string;
  questionIndex: number; // 1 to 100
  sectionId: string;
  chosenOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  status: 'answered' | 'unattempted';
  marks: number;
}

export interface SectionMetric {
  id: string;
  name: string;
  score: number;
  correct: number;
  wrong: number;
  unattempted: number;
  accuracy: number; // Percentage 0 - 100
}

export interface ExamMetrics {
  rawScore: number;
  scoreReasoning: number;
  scoreGk: number;
  scoreMath: number;
  scoreEnglish: number;
  totalCorrect: number;
  totalWrong: number;
  totalUnattempted: number;
  overallAccuracy: number;
}

export interface ParsedExamResult {
  candidateDetails: CandidateDetails;
  category: CandidateCategory;
  metrics: ExamMetrics;
  sectionDetails: Record<string, SectionMetric>;
  questionResponses: ParsedQuestion[];
  adapterVersion: string;
  parseStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  rawHtmlAvailable?: boolean;
}

export interface CandidateRankings {
  overall: {
    rank: number;
    total_candidates: number;
    percentile: number;
  };
  category: {
    category: string;
    rank: number;
    total_candidates: number;
  };
  shift: {
    shift_code: string;
    shift_name: string;
    rank: number;
    total_candidates: number;
  };
  sections: {
    reasoning_rank: number;
    gk_rank: number;
    math_rank: number;
    english_rank: number;
  };
  snapshots: {
    mean: number;
    median: number;
    stddev: number;
    topper_score: number;
    sample_size: number;
  };
}
