import { supabase } from '@/lib/supabase';

const SERIES_SELECT_QUERY = '*, exam_categories(id, name)';
const TEST_SELECT_QUERY = '*, test_series(id, name, category_id, exam_categories(id, name))';

export interface TestMutationPayload {
    series_id: string;
    name: string;
    description?: string;
    duration_minutes: number;
    total_marks: number;
    passing_marks: number;
    negative_marks: number;
    question_ids: string[];
    is_published?: boolean;
    display_order?: number;
    release_date?: string | null;
    expiry_date?: string | null;
}

// EXAM CATEGORIES

export const fetchExamCategories = async () => {
    const { data, error } = await supabase
        .from('exam_categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const createExamCategory = async (payload: { name: string; description?: string; image_url?: string; is_active?: boolean; display_order?: number }) => {
    const { data, error } = await supabase
        .from('exam_categories')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateExamCategory = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .from('exam_categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteExamCategory = async (id: string) => {
    const { error } = await supabase
        .from('exam_categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// TEST SERIES

export const fetchTestSeries = async (categoryId?: string) => {
    let query = supabase
        .from('test_series')
        .select(SERIES_SELECT_QUERY)
        .order('created_at', { ascending: false });

    if (categoryId) {
        query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const createTestSeries = async (payload: { category_id: string; name: string; slug: string; description?: string; thumbnail_url?: string; is_premium?: boolean; is_published?: boolean }) => {
    const { data, error } = await supabase
        .from('test_series')
        .insert([payload])
        .select(SERIES_SELECT_QUERY)
        .single();

    if (error) throw error;
    return data;
};

export const updateTestSeries = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .from('test_series')
        .update(payload)
        .eq('id', id)
        .select(SERIES_SELECT_QUERY)
        .single();

    if (error) throw error;
    return data;
};

export const deleteTestSeries = async (id: string) => {
    const { error } = await supabase
        .from('test_series')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// TESTS

export const fetchTests = async (seriesId?: string) => {
    let query = supabase
        .from('tests')
        .select(TEST_SELECT_QUERY)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (seriesId) {
        query = query.eq('series_id', seriesId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const fetchTestById = async (id: string) => {
    const { data, error } = await supabase
        .from('tests')
        .select(TEST_SELECT_QUERY)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

export const createTest = async (payload: TestMutationPayload) => {
    const { data, error } = await supabase
        .from('tests')
        .insert([payload])
        .select(TEST_SELECT_QUERY)
        .single();

    if (error) throw error;
    return data;
};

export const updateTest = async (id: string, payload: Partial<TestMutationPayload>) => {
    const { data, error } = await supabase
        .from('tests')
        .update(payload)
        .eq('id', id)
        .select(TEST_SELECT_QUERY)
        .single();

    if (error) throw error;
    return data;
};

export const deleteTest = async (id: string) => {
    const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// VALIDATION

export const validateQuestionIds = async (ids: string[]) => {
    if (!ids || ids.length === 0) return { valid: [], invalid: [] };

    // Deduplicate array
    const uniqueIds = Array.from(new Set(ids));

    // Check if they are valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const formatValidIds = uniqueIds.filter(id => uuidRegex.test(id));
    const formatInvalidIds = uniqueIds.filter(id => !uuidRegex.test(id));

    if (formatValidIds.length === 0) {
        return { valid: [], invalid: uniqueIds };
    }

    // Query DB for existing IDs
    const { data, error } = await supabase
        .from('questions')
        .select('id')
        .in('id', formatValidIds);

    if (error) {
        console.error("Error validating questions:", error);
        return { valid: [], invalid: uniqueIds };
    }

    const existingIds = data.map(q => q.id);
    const valid = existingIds;
    const invalid = uniqueIds.filter(id => !existingIds.includes(id));

    return { valid, invalid };
};
