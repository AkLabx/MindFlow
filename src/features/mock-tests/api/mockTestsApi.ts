import { supabase } from '@/lib/supabase';

export interface TestLeaderboardEntry {
    rank: number;
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    score: number;
    accuracy: number;
    time_taken_seconds: number | null;
    completed_at: string | null;
    is_current_user: boolean;
}

/**
 * Checks whether a mock test is visible within its configured release/expiry schedule window.
 * Unscheduled tests (`release_date` / `expiry_date` omitted or null) are treated as active.
 */
export const isTestWithinScheduleWindow = (
    test: { release_date?: string | null; expiry_date?: string | null } | null | undefined,
    nowMs: number = Date.now()
): boolean => {
    if (!test) return false;

    if (test.release_date !== undefined && test.release_date !== null && String(test.release_date).trim() !== '') {
        const relMs = Date.parse(String(test.release_date));
        if (Number.isNaN(relMs) || relMs > nowMs) {
            return false;
        }
    }

    if (test.expiry_date !== undefined && test.expiry_date !== null && String(test.expiry_date).trim() !== '') {
        const expMs = Date.parse(String(test.expiry_date));
        if (Number.isNaN(expMs) || expMs <= nowMs) {
            return false;
        }
    }

    return true;
};

/**
 * Projects a raw leaderboard RPC row onto a strict non-sensitive DTO, stripping extraneous payloads such as `answers`.
 */
export const sanitizeLeaderboardEntry = (row: any, index: number): TestLeaderboardEntry => ({
    rank: Number(row?.rank ?? index + 1),
    user_id: String(row?.user_id ?? ''),
    display_name: String(row?.display_name ?? '').trim() || 'MindFlow Aspirant',
    avatar_url: row?.avatar_url ? String(row.avatar_url) : null,
    score: Number(row?.score ?? 0),
    accuracy: Number(row?.accuracy ?? 0),
    time_taken_seconds:
        row?.time_taken_seconds !== null && row?.time_taken_seconds !== undefined
            ? Number(row.time_taken_seconds)
            : null,
    completed_at: row?.completed_at ? String(row.completed_at) : null,
    is_current_user: Boolean(row?.is_current_user),
});

/**
 * Fetches anonymized, privacy-safe rankings for a published mock test via `get_test_leaderboard`.
 */
export const fetchTestLeaderboard = async (
    testId: string,
    limit: number = 50
): Promise<TestLeaderboardEntry[]> => {
    const trimmedTestId = String(testId ?? '').trim();
    if (!trimmedTestId) return [];

    const safeLimit = Math.max(1, Math.min(Number.isFinite(limit) ? Math.trunc(limit) : 50, 100));
    const { data, error } = await supabase.rpc('get_test_leaderboard', {
        p_test_id: trimmedTestId,
        p_limit: safeLimit,
    });

    if (error) throw error;
    return (Array.isArray(data) ? data : []).map((row, idx) => sanitizeLeaderboardEntry(row, idx));
};

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
    const { data, error } = await supabase
        .from('test_series')
        .select('*, exam_categories!inner(is_active)')
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .eq('exam_categories.is_active', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const fetchPublishedTests = async (seriesId: string, nowMs: number = Date.now()) => {
    // Check that parent category is active, parent series is published, test is published, and test is within schedule window
    const { data, error } = await supabase
        .from('tests')
        .select('*, test_series!inner(is_published, exam_categories!inner(is_active))')
        .eq('series_id', seriesId)
        .eq('is_published', true)
        .eq('test_series.is_published', true)
        .eq('test_series.exam_categories.is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).filter((test) => isTestWithinScheduleWindow(test, nowMs));
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
        .select('*, exam_categories!inner(id, name, is_active)')
        .eq('id', seriesId)
        .eq('is_published', true)
        .eq('exam_categories.is_active', true)
        .single();
    if (error) throw error;
    return data;
};

export const fetchTestDetails = async (testId: string, nowMs: number = Date.now()) => {
    const { data, error } = await supabase
        .from('tests')
        .select('*, test_series!inner(id, name, is_premium, is_published, exam_categories!inner(id, name, is_active))')
        .eq('id', testId)
        .eq('is_published', true)
        .eq('test_series.is_published', true)
        .eq('test_series.exam_categories.is_active', true)
        .single();
    if (error) throw error;
    if (!isTestWithinScheduleWindow(data, nowMs)) {
        throw new Error('This mock test is not currently available outside its scheduled window.');
    }
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

export const searchTestsApi = async (query: string, nowMs: number = Date.now()) => {
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
    return (data || []).filter((test) => isTestWithinScheduleWindow(test, nowMs));
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
