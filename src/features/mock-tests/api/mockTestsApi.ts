import { supabase } from '@/lib/supabase';

export const fetchActiveExamCategories = async () => {
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
    const { data, error } = await supabase
        .from('test_series')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const fetchPublishedTests = async (seriesId: string) => {
    const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('series_id', seriesId)
        .eq('is_published', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};
