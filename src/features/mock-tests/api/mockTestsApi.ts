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
