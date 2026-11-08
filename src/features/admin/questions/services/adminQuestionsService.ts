import { supabase } from '@/lib/supabase';

export interface QuestionRecord {
  id: string;
  created_at: string;
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
  status?: string;
  deleted_at?: string;
}

export interface FetchQuestionsParams {
  search?: string;
  subject?: string;
  difficulty?: string;
  examYear?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'id' | 'difficulty' | 'subject';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fetch paginated questions with flexible filtering
 */
export const fetchQuestions = async ({
  search = '',
  subject = 'all',
  difficulty = 'all',
  page = 1,
  pageSize = 25,
  sortBy = 'created_at',
  sortOrder = 'desc'
}: FetchQuestionsParams) => {
  let query = supabase
    .from('questions')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);

  if (subject !== 'all') {
    query = query.eq('subject', subject);
  }

  if (difficulty !== 'all') {
    query = query.eq('difficulty', difficulty);
  }

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`question.ilike.${term},question_hi.ilike.${term},v1_id.ilike.${term}`);
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
 * Fetch a single question by UUID or v1_id
 */
export const fetchQuestionById = async (id: string): Promise<QuestionRecord> => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as QuestionRecord;
};

/**
 * Save (Insert or Update) a Question
 */
export const saveQuestion = async (payload: Partial<QuestionRecord>) => {
  const isUpdate = Boolean(payload.id);

  // Normalize explanation if stringified
  let explanationObj: any = payload.explanation;
  if (typeof explanationObj === 'string') {
    const rawStr = explanationObj;
    try {
      explanationObj = JSON.parse(rawStr);
    } catch {
      explanationObj = { summary: rawStr };
    }
  }

  const cleanPayload = {
    ...payload,
    explanation: explanationObj || {},
    updated_at: new Date().toISOString()
  };

  if (isUpdate) {
    const { id, ...updateFields } = cleanPayload;
    const { data, error } = await supabase
      .from('questions')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('questions')
      .insert(cleanPayload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

/**
 * Soft delete a single question
 */
export const softDeleteQuestion = async (id: string) => {
  const { error } = await supabase
    .from('questions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  return true;
};

/**
 * Bulk soft delete multiple questions
 */
export const bulkSoftDeleteQuestions = async (ids: string[]) => {
  if (ids.length === 0) return true;

  const { error } = await supabase
    .from('questions')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', ids);

  if (error) throw error;
  return true;
};

/**
 * Fetch list of distinct subjects for dropdowns
 */
export const fetchDistinctSubjects = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('questions')
    .select('subject')
    .is('deleted_at', null);

  if (error) return ['History', 'Geography', 'Economics', 'Polity', 'Current Affairs', 'General Science'];

  const set = new Set<string>();
  (data || []).forEach((row) => {
    if (row.subject) set.add(row.subject);
  });

  return Array.from(set).sort();
};
