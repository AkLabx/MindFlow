import { supabase } from '../../../lib/supabase';
import { Question } from '../types';
import { fetchQuestionsByIds } from './questionService';
import { quizCreationService } from './quizCreationService';

export type MasteryTier = 
  | 'CRITICAL_ERROR' 
  | 'REPEATED_ERROR' 
  | 'FRESH_SLIP' 
  | 'UNVERIFIED_GUESS' 
  | 'FAMILIAR' 
  | 'MASTERED';

export interface QuestionInteraction {
  question_id: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  is_correct: boolean;
  selected_option?: string | null;
  correct_option?: string;
  quiz_id?: string;
}

export interface UserQuestionMasteryRecord {
  id: string;
  user_id: string;
  question_id: string;
  subject: string;
  topic?: string;
  sub_topic?: string;
  difficulty?: string;
  times_attempted: number;
  times_correct: number;
  times_incorrect: number;
  times_skipped: number;
  consecutive_correct: number;
  consecutive_incorrect: number;
  last_status: 'correct' | 'incorrect' | 'skipped';
  vulnerability_index: number;
  mastery_tier: MasteryTier;
  last_selected_option?: string;
  correct_option?: string;
  user_note?: string;
  last_quiz_id?: string;
  first_attempted_at: string;
  last_attempted_at: string;
  next_review_due_at: string;
  mastered_at?: string;
  question?: Question;
}

export interface MasterySummary {
  criticalCount: number;
  repeatedCount: number;
  slipsCount: number;
  unverifiedCount: number;
  familiarCount: number;
  masteredCount: number;
  totalTracked: number;
  overallVulnerabilityScore: number;
  subjectBreakdown: { [subject: string]: number };
}

export interface MasteryFilterParams {
  tier?: 'all' | 'all_mistakes' | 'critical' | 'repeated' | 'slips' | 'unverified' | 'familiar' | 'mastered';
  subject?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

class MasteryService {
  private hasCheckedBackfill = false;

  /**
   * Record a batch of question interactions after quiz completion
   */
  async recordInteractions(interactions: QuestionInteraction[]): Promise<{ success: boolean; processed: number }> {
    if (!interactions || interactions.length === 0) {
      return { success: true, processed: 0 };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, processed: 0 };
    }

    try {
      const { data, error } = await supabase.rpc('record_question_interactions', {
        p_interactions: interactions
      });

      if (error) {
        console.error('[masteryService] Error recording interactions:', error);
        return { success: false, processed: 0 };
      }

      return data || { success: true, processed: interactions.length };
    } catch (err) {
      console.error('[masteryService] Unexpected error recording interactions:', err);
      return { success: false, processed: 0 };
    }
  }

  /**
   * Backfill historical quiz interactions into the mastery table
   */
  async backfillHistoricalData(): Promise<{ success: boolean; backfilled_interactions: number }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, backfilled_interactions: 0 };
    }

    try {
      const { data, error } = await supabase.rpc('backfill_user_question_mastery');
      if (error) {
        console.error('[masteryService] Error executing backfill:', error);
        return { success: false, backfilled_interactions: 0 };
      }
      return data || { success: true, backfilled_interactions: 0 };
    } catch (err) {
      console.error('[masteryService] Unexpected error during backfill:', err);
      return { success: false, backfilled_interactions: 0 };
    }
  }

  /**
   * Get high-level summary of question mastery, cognitive tiers, and vulnerability score
   */
  async getMasterySummary(): Promise<MasterySummary> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return this.emptySummary();
    }

    try {
      const { data, error } = await supabase
        .from('user_question_mastery')
        .select('mastery_tier, vulnerability_index, subject');

      if (error) {
        console.error('[masteryService] Error fetching mastery summary:', error);
        return this.emptySummary();
      }

      // If user has 0 records but has not checked backfill yet, trigger backfill once
      if ((!data || data.length === 0) && !this.hasCheckedBackfill) {
        this.hasCheckedBackfill = true;
        const backfillRes = await this.backfillHistoricalData();
        if (backfillRes.backfilled_interactions > 0) {
          // Re-fetch after backfill
          return this.getMasterySummary();
        }
      }

      const summary: MasterySummary = {
        criticalCount: 0,
        repeatedCount: 0,
        slipsCount: 0,
        unverifiedCount: 0,
        familiarCount: 0,
        masteredCount: 0,
        totalTracked: data?.length || 0,
        overallVulnerabilityScore: 0,
        subjectBreakdown: {}
      };

      if (!data || data.length === 0) {
        return summary;
      }

      let totalVulnerability = 0;

      for (const row of data) {
        totalVulnerability += (row.vulnerability_index || 0);

        switch (row.mastery_tier) {
          case 'CRITICAL_ERROR':
            summary.criticalCount++;
            break;
          case 'REPEATED_ERROR':
            summary.repeatedCount++;
            break;
          case 'FRESH_SLIP':
            summary.slipsCount++;
            break;
          case 'UNVERIFIED_GUESS':
            summary.unverifiedCount++;
            break;
          case 'FAMILIAR':
            summary.familiarCount++;
            break;
          case 'MASTERED':
            summary.masteredCount++;
            break;
        }

        const sub = row.subject || 'General';
        summary.subjectBreakdown[sub] = (summary.subjectBreakdown[sub] || 0) + 1;
      }

      summary.overallVulnerabilityScore = Math.round(totalVulnerability / data.length);
      return summary;
    } catch (err) {
      console.error('[masteryService] Error in getMasterySummary:', err);
      return this.emptySummary();
    }
  }

  /**
   * Fetch mastery records with filtering, joined with question data
   */
  async getMasteryQuestions(filters: MasteryFilterParams = {}): Promise<UserQuestionMasteryRecord[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return [];
    }

    try {
      let query = supabase
        .from('user_question_mastery')
        .select('*');

      // Tier filtering
      if (filters.tier && filters.tier !== 'all') {
        if (filters.tier === 'all_mistakes') {
          query = query.in('mastery_tier', ['CRITICAL_ERROR', 'REPEATED_ERROR', 'FRESH_SLIP']);
        } else if (filters.tier === 'critical') {
          query = query.eq('mastery_tier', 'CRITICAL_ERROR');
        } else if (filters.tier === 'repeated') {
          query = query.eq('mastery_tier', 'REPEATED_ERROR');
        } else if (filters.tier === 'slips') {
          query = query.eq('mastery_tier', 'FRESH_SLIP');
        } else if (filters.tier === 'unverified') {
          query = query.eq('mastery_tier', 'UNVERIFIED_GUESS');
        } else if (filters.tier === 'familiar') {
          query = query.eq('mastery_tier', 'FAMILIAR');
        } else if (filters.tier === 'mastered') {
          query = query.eq('mastery_tier', 'MASTERED');
        }
      }

      // Subject filtering
      if (filters.subject && filters.subject !== 'all') {
        query = query.eq('subject', filters.subject);
      }

      // Order by vulnerability index DESC, then next review due
      query = query
        .order('vulnerability_index', { ascending: false })
        .order('next_review_due_at', { ascending: true })
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) {
        console.error('[masteryService] Error querying user mastery:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Load full question details
      const questionIds = data.map((d: any) => d.question_id);
      const fullQuestions = await fetchQuestionsByIds(questionIds);
      const questionMap = new Map<string, Question>();
      for (const q of fullQuestions) {
        questionMap.set(q.id, q);
      }

      const mergedRecords: UserQuestionMasteryRecord[] = data.map((row: any) => {
        const question = questionMap.get(row.question_id);
        return {
          ...row,
          question
        };
      });

      // Filter by search query if present
      if (filters.searchQuery?.trim()) {
        const qLower = filters.searchQuery.toLowerCase();
        return mergedRecords.filter(r => {
          const matchQuestion = r.question?.question?.toLowerCase().includes(qLower) || false;
          const matchQuestionHi = r.question?.question_hi?.toLowerCase().includes(qLower) || false;
          const matchNote = r.user_note?.toLowerCase().includes(qLower) || false;
          const matchTopic = r.topic?.toLowerCase().includes(qLower) || false;
          return matchQuestion || matchQuestionHi || matchNote || matchTopic;
        });
      }

      return mergedRecords;
    } catch (err) {
      console.error('[masteryService] Error in getMasteryQuestions:', err);
      return [];
    }
  }

  /**
   * Save user's private concept notes on a mistake question
   */
  async updateUserNote(questionId: string, note: string): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    try {
      const { error } = await supabase
        .from('user_question_mastery')
        .update({ user_note: note.trim() })
        .eq('question_id', questionId);

      if (error) {
        console.error('[masteryService] Error updating user note:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[masteryService] Error updating user note:', err);
      return false;
    }
  }

  /**
   * Mark a question as manually mastered (graduated)
   */
  async markAsMastered(questionId: string): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    try {
      const { error } = await supabase
        .from('user_question_mastery')
        .update({
          mastery_tier: 'MASTERED',
          vulnerability_index: 0,
          consecutive_correct: 3,
          mastered_at: new Date().toISOString()
        })
        .eq('question_id', questionId);

      if (error) {
        console.error('[masteryService] Error marking question as mastered:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[masteryService] Error marking as mastered:', err);
      return false;
    }
  }

  /**
   * Launch a targeted revision drill from mastery questions
   */
  async startMasteryRevisionDrill(
    questions: Question[],
    drillName?: string
  ): Promise<{ quizId: string; error?: string }> {
    if (!questions || questions.length === 0) {
      return { quizId: '', error: 'No questions provided for revision drill.' };
    }

    const filters = {
      subject: [],
      topic: [],
      difficulty: 'all'
    };

    const result = await quizCreationService.createQuiz(
      questions,
      filters as any,
      'learning',
      drillName || `Mistake Revision Drill (${questions.length} Qs)`
    );

    if (result.error) {
      return { quizId: '', error: result.error };
    }

    return { quizId: result.quizId };
  }

  private emptySummary(): MasterySummary {
    return {
      criticalCount: 0,
      repeatedCount: 0,
      slipsCount: 0,
      unverifiedCount: 0,
      familiarCount: 0,
      masteredCount: 0,
      totalTracked: 0,
      overallVulnerabilityScore: 0,
      subjectBreakdown: {}
    };
  }
}

export const masteryService = new MasteryService();
