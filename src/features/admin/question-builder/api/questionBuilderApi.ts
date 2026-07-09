import { supabase } from '@/lib/supabase';
import { QuestionLightweight, QuestionFilterParams, FilterOptions } from '../types/questionBuilder.types';
import { Question } from '@/types/models';

export const fetchFilterOptions = async (): Promise<FilterOptions> => {
    // For Phase 2, we fetch all non-null values and unique them.
    const { data, error } = await supabase
        .from('questions')
        .select('subject, difficulty, examName, examYear, topic');

    if (error) throw error;

    const subjects = new Set<string>();
    const difficulties = new Set<string>();
    const examNames = new Set<string>();
    const examYears = new Set<number>();
    const topics = new Set<string>();

    data?.forEach(row => {
        if (row.subject) subjects.add(row.subject);
        if (row.difficulty) difficulties.add(row.difficulty);
        if (row.examName) examNames.add(row.examName);
        if (row.examYear) examYears.add(row.examYear);
        if (row.topic) topics.add(row.topic);
    });

    return {
        subjects: Array.from(subjects).sort(),
        difficulties: Array.from(difficulties).sort(),
        examNames: Array.from(examNames).sort(),
        examYears: Array.from(examYears).sort((a, b) => b - a), // Descending
        topics: Array.from(topics).sort(),
    };
};

export const searchQuestions = async (
    params: QuestionFilterParams,
    page: number = 0,
    limit: number = 25
): Promise<{ data: QuestionLightweight[]; total: number }> => {
    let query = supabase
        .from('questions')
        .select('id, v1_id, question, subject, difficulty, examName, examYear, questionType, tags, explanation, options, correct', { count: 'exact' });

    if (params.search) {
        // Broadened search to include subject and topic
        query = query.or(`question.ilike.%${params.search}%,v1_id.ilike.%${params.search}%,subject.ilike.%${params.search}%,topic.ilike.%${params.search}%`);
    }

    if (params.subject) query = query.eq('subject', params.subject);
    if (params.topic) query = query.eq('topic', params.topic);
    if (params.difficulty) query = query.eq('difficulty', params.difficulty);
    if (params.examName) query = query.eq('examName', params.examName);
    if (params.examYear) query = query.eq('examYear', params.examYear);

    // Ordering by creation date descending to show latest first when empty search
    query = query.order('created_at', { ascending: false });

    // Pagination
    const from = page * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
        data: (data || []) as unknown as QuestionLightweight[],
        total: count || 0
    };
};

export const fetchQuestionsByUUIDs = async (ids: string[]): Promise<QuestionLightweight[]> => {
    if (!ids.length) return [];

    const { data, error } = await supabase
        .from('questions')
        .select('id, v1_id, question, subject, difficulty, examName, examYear, questionType, tags, explanation, options, correct')
        .in('id', ids);

    if (error) throw error;

    return (data || []) as unknown as QuestionLightweight[];
};

export const fetchQuestionPreview = async (id: string): Promise<Question | null> => {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;

    return data as Question;
};
