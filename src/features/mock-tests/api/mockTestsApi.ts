import { supabase } from '@/lib/supabase';

// EXPLICIT ENFORCEMENT OF VISIBILITY

export const fetchActiveExamCategories = async () => {
    // Only return active categories
    const { data, error } = await supabase
        .from('exam_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const fetchPublishedTestSeries = async (categoryId: string) => {
    // Check that parent category is active AND series is published
    // (In a simple setup, we just check series, assuming UI flow started from active category)
    const { data, error } = await supabase
        .from('test_series')
        .select('*, exam_categories!inner(is_active)')
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .eq('exam_categories.is_active', true) // Extra strict layer
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const fetchPublishedTests = async (seriesId: string) => {
    // Check that parent series is published AND test is published
    const { data, error } = await supabase
        .from('tests')
        .select('*, test_series!inner(is_published)')
        .eq('series_id', seriesId)
        .eq('is_published', true)
        .eq('test_series.is_published', true) // Extra strict layer
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};


// FETCH SINGLE ENTITIES FOR DETAIL PAGES
export const fetchCategoryDetails = async (categoryId: string) => {
    const { data, error } = await supabase
        .from('exam_categories')
        .select('*')
        .eq('id', categoryId)
        .eq('is_active', true)
        .single();
    if (error) throw error;
    return data;
};

export const fetchSeriesDetails = async (seriesId: string) => {
    const { data, error } = await supabase
        .from('test_series')
        .select('*, exam_categories!inner(id, name)')
        .eq('id', seriesId)
        .eq('is_published', true)
        .single();
    if (error) throw error;
    return data;
};

export const fetchTestDetails = async (testId: string) => {
    const { data, error } = await supabase
        .from('tests')
        .select('*, test_series!inner(id, name, is_premium, exam_categories!inner(id, name))')
        .eq('id', testId)
        .eq('is_published', true)
        .single();
    if (error) throw error;
    return data;
};

// CONTEXTUAL SEARCH APIs
export const searchCategoriesApi = async (query: string) => {
    if (!query) return [];
    const { data, error } = await supabase
        .from('exam_categories')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(5);
    if (error) throw error;
    return data;
};

export const searchSeriesApi = async (query: string) => {
    if (!query) return [];
    const { data, error } = await supabase
        .from('test_series')
        .select('*, exam_categories!inner(id, name, is_active)')
        .eq('is_published', true)
        .eq('exam_categories.is_active', true)
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(5);
    if (error) throw error;
    return data;
};

export const searchTestsApi = async (query: string) => {
    if (!query) return [];
    const { data, error } = await supabase
        .from('tests')
        .select('*, test_series!inner(id, name, is_published, exam_categories!inner(id, name, is_active))')
        .eq('is_published', true)
        .eq('test_series.is_published', true)
        .eq('test_series.exam_categories.is_active', true)
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(5);
    if (error) throw error;
    return data;
};

// FETCH RECOMMENDATIONS / RECENT
export const fetchRecommendedSeries = async () => {
    // For now, fetch top 4 recently published premium or popular series.
    const { data, error } = await supabase
        .from('test_series')
        .select('*, exam_categories!inner(is_active)')
        .eq('is_published', true)
        .eq('exam_categories.is_active', true)
        .order('created_at', { ascending: false })
        .limit(4);
    if (error) throw error;
    return data;
};
