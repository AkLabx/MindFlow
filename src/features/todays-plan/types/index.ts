import { Question } from '@/features/quiz/types';

export type UserLearningTier =
  | 'new_user'
  | 'error_prone'
  | 'advanced_retention'
  | 'blueprint_targeted'
  | 'vocab_focused';

export type PlanItemCategory =
  | 'mistake'
  | 'spaced_repetition'
  | 'bookmark'
  | 'high_yield_diagnostic';

export interface PlanItem {
  id: string;
  question: Question;
  category: PlanItemCategory;
  sourceReason: string;
  subject: string;
  topic?: string;
  difficulty?: string;
}

export interface VocabPlanItem {
  id: string;
  type: 'idiom' | 'ows' | 'synonym';
  term: string;
  meaning: string;
  hindiMeaning?: string;
  status: string;
  example?: string;
}

export interface PlanChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subject: string;
  questionIds: string[];
  totalQuestions: number;
  masteredCount: number;
  isUnlocked: boolean;
}

export interface TodaysPlanState {
  tier: UserLearningTier;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  items: PlanItem[];
  vocabItems: VocabPlanItem[];
  chapters: PlanChapter[];
  stats: {
    totalQuestions: number;
    mistakesToRedeem: number;
    spacedRepetitionDue: number;
    bookmarkedCount: number;
    overallAccuracy: number;
  };
  hasHistoricalData: boolean;
  generatedAt: number;
}
