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

export interface ExamParserAdapter {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  canParse(html: string, url?: string): boolean;
  parse(html: string, config: ExamConfig, selectedCategory?: CandidateCategory): ParsedExamResult;
}

export interface ResultDashboardData {
  candidate: {
    submission_id: string;
    candidate_name: string;
    roll_number: string;
    category: string;
    gender?: string;
    state?: string;
    exam_date: string;
    exam_time: string;
    shift_name: string;
    shift_code: string;
    venue_name: string;
    exam_name: string;
  };
  score_summary: {
    raw_score: number;
    max_marks: number;
    bonus_marks: number;
    total_questions: number;
    attempted: number;
    correct: number;
    wrong: number;
    skipped: number;
    accuracy: number;
    normalised_score: number | null;
    normalised_formula: 'formula_1' | 'formula_2';
  };
  ranks: {
    overall: { rank: number; total: number; percentile: number };
    shift: { rank: number; total: number; percentile: number };
    category: { rank: number; total: number; percentile: number };
    normalised: {
      overall_rank: number;
      overall_percentile: number;
      shift_rank: number;
      shift_percentile: number;
      category_rank: number;
      category_percentile: number;
    };
  };
  averages_and_deltas: {
    overall: { mean: number; delta: number; n: number };
    shift: { mean: number; delta: number; n: number };
    category: { mean: number; delta: number; n: number };
  };
  section_results: Array<{
    section_id: string;
    name: string;
    attempted: number;
    correct: number;
    wrong: number;
    skipped: number;
    marks: number;
    accuracy: number;
    rank: number;
    serious_cohort_avg_marks: number;
    serious_cohort_delta: number;
    serious_cohort_avg_accuracy: number;
  }>;
  shift_directory_summary: {
    total_shifts: number;
    your_shift: { shift_code: string; shift_label: string; mean: number; n: number; difficulty_rank: number };
    hardest_shift: { shift_code: string; shift_label: string; mean: number; n: number; difficulty_rank: number };
    easiest_shift: { shift_code: string; shift_label: string; mean: number; n: number; difficulty_rank: number };
  };
  score_distribution_summary: {
    candidate_marks: number;
    total_sample_n: number;
    count_at_exact_marks: number;
    count_gte_marks: number;
    count_lt_marks: number;
    top_x_percent: number;
  };
}

export interface CachedCandidateResult {
  id: string; // submission_id
  exam_id: string;
  user_id?: string;
  roll_number: string;
  candidate_name: string;
  exam_date: string;
  exam_time: string;
  shift_name: string;
  shift_code: string;
  venue_name: string;
  category: string;
  raw_score: number;
  bonus_marks: number;
  normalised_score: number | null;
  total_correct: number;
  total_wrong: number;
  total_unattempted: number;
  accuracy: number;
  section_details: Record<string, any>;
  question_responses: any[];
  saved_at: string;
}

export interface CachedDashboardSnapshot {
  submission_id: string;
  exam_id: string;
  cached_at: string;
  dashboard_data: ResultDashboardData;
}
