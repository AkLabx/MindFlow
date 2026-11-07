import { supabase } from '@/lib/supabase';
import { CandidateCategory, CandidateRankings, ExamConfig, ParsedExamResult } from '../types';
import { TcsIonAdapter, EduquityAdapter } from '../adapters/ExamParserAdapter';

export const SUPPORTED_EXAMS: ExamConfig[] = [
  {
    id: 'ssc_cgl_tier1',
    examName: 'SSC CGL Tier-1',
    organizingBody: 'SSC',
    totalQuestions: 100,
    positiveMarks: 2.0,
    negativeMarks: 0.5,
    minNormalizationSample: 30,
    sections: [
      { id: 'reasoning', name: 'General Intelligence & Reasoning', qCount: 25, weight: 2.0 },
      { id: 'gk', name: 'General Awareness', qCount: 25, weight: 2.0 },
      { id: 'math', name: 'Quantitative Aptitude', qCount: 25, weight: 2.0 },
      { id: 'english', name: 'English Comprehension', qCount: 25, weight: 2.0 },
    ],
  },
  {
    id: 'ssc_chsl_tier1',
    examName: 'SSC CHSL Tier-1',
    organizingBody: 'SSC',
    totalQuestions: 100,
    positiveMarks: 2.0,
    negativeMarks: 0.5,
    minNormalizationSample: 30,
    sections: [
      { id: 'reasoning', name: 'General Intelligence & Reasoning', qCount: 25, weight: 2.0 },
      { id: 'gk', name: 'General Awareness', qCount: 25, weight: 2.0 },
      { id: 'math', name: 'Quantitative Aptitude', qCount: 25, weight: 2.0 },
      { id: 'english', name: 'English Comprehension', qCount: 25, weight: 2.0 },
    ],
  },
];

const LOCAL_STORAGE_CACHE_KEY = 'mindflow_last_exam_scorecard';

export class AnswerKeyService {
  private static tcsAdapter = new TcsIonAdapter();
  private static eduquityAdapter = new EduquityAdapter();

  /**
   * PII Protection: Masks roll number (e.g., 2201019284 -> 2201******84)
   */
  static maskRollNumber(roll: string): string {
    if (!roll || roll.length < 6) return roll || '******';
    const start = roll.slice(0, 4);
    const end = roll.slice(-2);
    return `${start}${'*'.repeat(Math.max(roll.length - 6, 4))}${end}`;
  }

  /**
   * PII Protection: Masks candidate name (e.g., RAHUL KUMAR -> R*** K***)
   */
  static maskName(name: string): string {
    if (!name) return 'Aspirant';
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => (part.length > 1 ? `${part[0]}${'*'.repeat(part.length - 1)}` : part))
      .join(' ');
  }

  /**
   * Offline-First 0ms Browser HTML Parser
   */
  static parseHtmlOffline(
    html: string,
    config: ExamConfig,
    category: CandidateCategory = 'UR',
    gender: string = 'Male',
    state: string = 'Bihar'
  ): ParsedExamResult {
    const adapter = this.eduquityAdapter.canParse(html) ? this.eduquityAdapter : this.tcsAdapter;
    const result = adapter.parse(html, config, category, { gender, state });
    if (result.candidateDetails) {
      result.candidateDetails.gender = gender;
      result.candidateDetails.state = state || result.candidateDetails.state || 'Bihar';
    }
    this.cacheScorecardLocally(result);
    return result;
  }

  /**
   * Remote URL Parser via Supabase Edge Function
   */
  static async parseUrlViaEdge(
    url: string,
    config: ExamConfig,
    category: CandidateCategory = 'UR',
    gender: string = 'Male',
    state: string = 'Bihar'
  ): Promise<ParsedExamResult> {
    const cleanUrl = url.trim();

    // Basic client validation
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      throw new Error('Please enter a valid HTTP or HTTPS answer key link.');
    }

    const isAllowedDomain =
      cleanUrl.includes('digialm.com') ||
      cleanUrl.includes('ssc.nic.in') ||
      cleanUrl.includes('cbexams.com');

    if (!isAllowedDomain) {
      throw new Error('Only official SSC response key URLs (*.digialm.com, *.cbexams.com) are supported.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required. Please sign in to MindFlow to compute your score.');
    }

    // Invoke Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('parse-exam-sheet', {
      body: {
        url: cleanUrl,
        examId: config.id,
        category,
        gender,
        state,
      },
    });

    if (error) {
      console.warn('Edge function error, attempting fallback:', error);
      throw new Error(error.message || 'Failed to fetch the answer key from server.');
    }

    if (!data || !data.result) {
      throw new Error('No valid scorecard data was returned by the parsing engine.');
    }

    const result = data.result as ParsedExamResult;
    if (result.candidateDetails) {
      result.candidateDetails.gender = gender;
      result.candidateDetails.state = state || result.candidateDetails.state || 'Bihar';
    }
    this.cacheScorecardLocally(result);
    return result;
  }

  /**
   * Asynchronously saves the submission into Supabase (if logged in)
   */
  static async saveSubmissionToCloud(
    result: ParsedExamResult,
    examId: string,
    urlHash: string = 'offline_upload'
  ): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const payload = {
        exam_id: examId,
        user_id: user.id,
        roll_number: result.candidateDetails.rollNumber,
        candidate_name: result.candidateDetails.candidateName,
        exam_date: result.candidateDetails.examDate,
        shift_name: result.candidateDetails.shiftName,
        shift_code: result.candidateDetails.shiftCode,
        venue_name: result.candidateDetails.venueName,
        category: result.category,
        gender: result.candidateDetails.gender || 'Male',
        state: result.candidateDetails.state || 'Bihar',
        exam_time: result.candidateDetails.examTime || result.candidateDetails.shiftName,
        raw_score: result.metrics.rawScore,
        score_reasoning: result.metrics.scoreReasoning,
        score_gk: result.metrics.scoreGk,
        score_math: result.metrics.scoreMath,
        score_english: result.metrics.scoreEnglish,
        total_correct: result.metrics.totalCorrect,
        total_wrong: result.metrics.totalWrong,
        total_unattempted: result.metrics.totalUnattempted,
        section_details: result.sectionDetails,
        question_responses: result.questionResponses,
        url_hash: urlHash,
        parse_status: result.parseStatus,
      };

      const { data, error } = await supabase
        .from('exam_submissions')
        .upsert(payload, { onConflict: 'exam_id,roll_number' })
        .select('id')
        .single();

      if (error) {
        console.warn('Cloud save skipped or table not initialized yet:', error.message);
        return null;
      }

      return data?.id || null;
    } catch (err) {
      console.warn('Silent cloud sync failure (offline or unauthenticated):', err);
      return null;
    }
  }

  /**
   * Fetches Real-time Rankings via PostgreSQL RPC
   */
  static async fetchCandidateRankings(submissionId: string): Promise<CandidateRankings | null> {
    try {
      const { data, error } = await supabase.rpc('get_candidate_live_rankings', {
        p_submission_id: submissionId,
      });

      if (error) {
        console.warn('Failed to fetch candidate live rankings:', error.message);
        return null;
      }

      return data as CandidateRankings;
    } catch (err) {
      console.warn('Rank calculation error:', err);
      return null;
    }
  }

  /**
   * Caches the most recent scorecard locally in localStorage
   */
  static cacheScorecardLocally(result: ParsedExamResult): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(result));
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * Retrieves the cached scorecard for instant 0ms hydration
   */
  static getCachedScorecard(): ParsedExamResult | null {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // Ignore parse errors
    }
    return null;
  }
}
