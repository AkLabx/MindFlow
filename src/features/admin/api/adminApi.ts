import { supabase } from '@/lib/supabase';
import { DB_TABLES } from '@/config/dbTables';
import { invalidateQuestionBankCaches } from '../questions/services/questionBankCache';

// Helper to build queries dynamically since it's used in multiple places
const buildQuery = (baseQuery: any, filters: any[]) => {
    let query = baseQuery;
    filters.forEach(f => {
        if (!f.field || !f.operator) return;
        if (f.operator === 'eq') query = query.eq(f.field, f.value);
        if (f.operator === 'neq') query = query.neq(f.field, f.value);
        if (f.operator === 'ilike') query = query.ilike(f.field, `%${f.value}%`);
        if (f.operator === 'is') {
            if (f.value.toLowerCase() === 'null') query = query.is(f.field, null);
        }
    });
    return query;
};

export const fetchQuestionsCountByFilter = async (filters: any[]) => {
    let query: any = supabase.from(DB_TABLES.BANK.QUESTIONS).select('*', { count: 'exact', head: true }).is('deleted_at', null);
    query = buildQuery(query, filters);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
};

export const performBulkUpdate = async ({ filters, targetField, targetValue }: { filters: any[], targetField: string, targetValue: string }) => {
    const updatePayload = { [targetField]: targetValue, updated_at: new Date().toISOString() };
    let query: any = supabase.from(DB_TABLES.BANK.QUESTIONS).update(updatePayload);
    query = buildQuery(query, filters);

    const { data, error } = await query.select('id');
    if (error) throw error;
    const updatedIds = Array.isArray(data) ? data.map((row: { id?: string }) => row.id).filter(Boolean) as string[] : [];
    await invalidateQuestionBankCaches({ questionIds: updatedIds, action: 'bulk_update' });
    return data;
};

// Upload GK Queries
export const fetchQuestionsByIds = async (ids: string[]) => {
    const { data, error } = await supabase.from(DB_TABLES.BANK.QUESTIONS).select('v1_id').in('v1_id', ids);
    if (error) throw error;
    return data;
};

export const insertQuestions = async (payload: any[]) => {
    const { data, error } = await supabase.from(DB_TABLES.BANK.QUESTIONS).insert(payload).select('id');
    if (error) throw error;
    const insertedIds = Array.isArray(data) ? data.map((row: { id?: string }) => row.id).filter(Boolean) as string[] : [];
    await invalidateQuestionBankCaches({ questionIds: insertedIds, action: 'save' });
    return true;
};

export const fetchQuestionByV1Id = async (v1_id: string) => {
    const { data, error } = await supabase.from(DB_TABLES.BANK.QUESTIONS).select('*').eq('v1_id', v1_id).is('deleted_at', null).single();
    if (error) throw error;
    return data;
};

export const updateQuestion = async (payload: any) => {
    const { id, ...updateData } = payload;
    if (!id) throw new Error("Question ID is missing.");

    const { data, error } = await supabase
        .from(DB_TABLES.BANK.QUESTIONS)
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

    if (error) throw error;

    if (!data || data.length === 0) {
        throw new Error("No question found to update or permission denied (silent failure).");
    }

    await invalidateQuestionBankCaches({ questionIds: [String(id)], action: 'save' });
    return true;
};
