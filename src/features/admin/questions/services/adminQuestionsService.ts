import { supabase } from '@/lib/supabase';
import { DB_TABLES } from '@/config/dbTables';
import { CANONICAL_SUBJECTS } from '@/features/quiz/services/questionTaxonomyService';
import { invalidateQuestionBankCaches } from './questionBankCache';

export { invalidateQuestionBankCaches };

export interface QuestionRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
  v1_id?: string;
  subject: string;
  topic?: string;
  subTopic?: string;
  examName?: string;
  examYear?: number;
  examDateShift?: string;
  difficulty?: string;
  questionType?: string;
  question: string;
  question_hi?: string;
  options: string[];
  options_hi?: string[];
  correct: string;
  tags: string[];
  explanation: {
    fact?: string;
    summary?: string;
    conclusion?: string;
    analysis_correct?: string;
    analysis_incorrect?: string;
    [key: string]: any;
  } | string;
  question_image_url?: string;
  explanation_image_url?: string;
  question_source?: 'PYQ' | 'EXPERT';
  status?: string;
  deleted_at?: string | null;
}

export interface FetchQuestionsParams {
  search?: string;
  subject?: string;
  difficulty?: string;
  sourceFilter?: 'all' | 'PYQ' | 'EXPERT';
  examYear?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'id' | 'difficulty' | 'subject';
  sortOrder?: 'asc' | 'desc';
}

const DEFAULT_FALLBACK_SUBJECTS = [...CANONICAL_SUBJECTS];

const CHUNK_SIZE = 100;

const QUESTION_SELECT_COLUMNS =
  'id, created_at, updated_at, v1_id, subject, topic, subTopic, examName, examYear, examDateShift, difficulty, questionType, question, question_hi, options, options_hi, correct, tags, explanation, question_image_url, explanation_image_url, question_source, status, deleted_at';

/**
 * Fetch paginated questions with flexible filtering
 */
export const fetchQuestions = async ({
  search = '',
  subject = 'all',
  difficulty = 'all',
  sourceFilter = 'all',
  page = 1,
  pageSize = 25,
  sortBy = 'created_at',
  sortOrder = 'desc'
}: FetchQuestionsParams) => {
  let query = supabase
    .from(DB_TABLES.BANK.QUESTIONS)
    .select(QUESTION_SELECT_COLUMNS, { count: 'exact' })
    .is('deleted_at', null);

  if (subject !== 'all') {
    query = query.eq('subject', subject);
  }

  if (difficulty !== 'all') {
    query = query.eq('difficulty', difficulty);
  }

  if (sourceFilter === 'PYQ' || sourceFilter === 'EXPERT') {
    query = query.eq('question_source', sourceFilter);
  }

  if (search.trim()) {
    const cleanTerm = search.trim().replace(/[(),]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanTerm) {
      const term = `%${cleanTerm}%`;
      query = query.or(`question.ilike.${term},question_hi.ilike.${term},v1_id.ilike.${term}`);
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    questions: (data || []) as QuestionRecord[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
};

/**
 * Fetch a single question by UUID
 */
export const fetchQuestionById = async (id: string): Promise<QuestionRecord | null> => {
  const { data, error } = await supabase
    .from(DB_TABLES.BANK.QUESTIONS)
    .select(QUESTION_SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as QuestionRecord) ?? null;
};

/**
 * Save (Insert or Update) a Question and invalidate cross-feature caches.
 */
export const saveQuestion = async (payload: Partial<QuestionRecord>): Promise<QuestionRecord> => {
  const isUpdate = Boolean(payload.id);

  // Normalize explanation if stringified and strip legacy `key_takeaway` alias
  let explanationObj: any = payload.explanation;
  if (typeof explanationObj === 'string') {
    const rawStr = explanationObj;
    try {
      explanationObj = JSON.parse(rawStr);
    } catch {
      explanationObj = { summary: rawStr };
    }
  }
  if (explanationObj && typeof explanationObj === 'object' && !Array.isArray(explanationObj)) {
    const cleaned = { ...explanationObj };
    if (cleaned.key_takeaway && !cleaned.conclusion) {
      cleaned.conclusion = cleaned.key_takeaway;
    }
    delete cleaned.key_takeaway;
    explanationObj = cleaned;
  }

  const { created_at: _omitCreatedAt, deleted_at: _omitDeletedAt, ...restPayload } = payload;

  const cleanPayload = {
    ...restPayload,
    explanation: explanationObj || {},
    updated_at: new Date().toISOString()
  };

  if (isUpdate) {
    const { id, ...updateFields } = cleanPayload;
    const { data, error } = await supabase
      .from(DB_TABLES.BANK.QUESTIONS)
      .update(updateFields)
      .eq('id', id as string)
      .select()
      .single();

    if (error) throw error;
    const savedRecord = data as QuestionRecord;
    await invalidateQuestionBankCaches({
      questionIds: savedRecord?.id ? [savedRecord.id] : id ? [id] : [],
      action: 'save',
    });
    return savedRecord;
  } else {
    const { data, error } = await supabase
      .from(DB_TABLES.BANK.QUESTIONS)
      .insert(cleanPayload)
      .select()
      .single();

    if (error) throw error;
    const savedRecord = data as QuestionRecord;
    await invalidateQuestionBankCaches({
      questionIds: savedRecord?.id ? [savedRecord.id] : [],
      action: 'save',
    });
    return savedRecord;
  }
};

/**
 * Soft delete a single question and purge stale caches.
 */
export const softDeleteQuestion = async (id: string) => {
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from(DB_TABLES.BANK.QUESTIONS)
    .update({ deleted_at: nowIso, updated_at: nowIso })
    .eq('id', id);

  if (error) throw error;
  await invalidateQuestionBankCaches({ deletedIds: [id], action: 'soft_delete' });
  return true;
};

/**
 * Bulk soft delete multiple questions (100-UUID chunked) and purge stale caches.
 */
export const bulkSoftDeleteQuestions = async (ids: string[]) => {
  const cleanIds = Array.from(new Set(ids.map((id) => String(id ?? '').trim()).filter(Boolean)));
  if (cleanIds.length === 0) return true;

  const nowIso = new Date().toISOString();
  for (let i = 0; i < cleanIds.length; i += CHUNK_SIZE) {
    const chunk = cleanIds.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from(DB_TABLES.BANK.QUESTIONS)
      .update({ deleted_at: nowIso, updated_at: nowIso })
      .in('id', chunk);

    if (error) throw error;
  }

  await invalidateQuestionBankCaches({ deletedIds: cleanIds, action: 'bulk_soft_delete' });
  return true;
};

/**
 * Fetch list of distinct subjects via RPC (`DEC-0015`, avoids unpaged table scans).
 */
export const fetchDistinctSubjects = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase.rpc('get_distinct_values', { column_name: 'subject' });
    if (error || !Array.isArray(data)) {
      return DEFAULT_FALLBACK_SUBJECTS;
    }

    const set = new Set<string>();
    for (const row of data) {
      const raw = typeof row === 'string' ? row : (row as { value?: unknown })?.value;
      if (raw === null || raw === undefined) continue;
      const trimmed = String(raw).trim();
      if (trimmed) set.add(trimmed);
    }

    const subjects = Array.from(set).sort((a, b) => a.localeCompare(b));
    return subjects.length > 0 ? subjects : DEFAULT_FALLBACK_SUBJECTS;
  } catch {
    return DEFAULT_FALLBACK_SUBJECTS;
  }
};
