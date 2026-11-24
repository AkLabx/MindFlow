import { supabase } from '@/lib/supabase';
import { DB_TABLES } from '@/config/dbTables';
import { invalidateQuestionBankCaches } from '../../questions/services/questionBankCache';
import { ExtractedQuestion } from '../types/review';

export const fetchPendingReviewQuestions = async (): Promise<ExtractedQuestion[]> => {
    const { data, error } = await supabase
        .from(DB_TABLES.BANK.QUESTIONS)
        .select(`
            id, question, options, correct, "examName", "examYear", "examDateShift",
            source_document_id, status, ai_metadata,
            source_documents (
                filename,
                source_type
            )
        `)
        .eq('status', 'PENDING_REVIEW')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as any) as ExtractedQuestion[];
};

export const updateQuestionStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const { error } = await supabase
        .from(DB_TABLES.BANK.QUESTIONS)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    await invalidateQuestionBankCaches({ questionIds: [id], action: 'review_update' });
};

export const updateQuestionContent = async (id: string, updates: Partial<ExtractedQuestion>) => {
    // Only pick editable fields
    const safeUpdates = {
        question: updates.question,
        options: updates.options,
        correct: updates.correct,
        "examName": updates.examName,
        "examYear": updates.examYear,
        "examDateShift": updates.examDateShift,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from(DB_TABLES.BANK.QUESTIONS)
        .update(safeUpdates)
        .eq('id', id);

    if (error) throw error;
    await invalidateQuestionBankCaches({ questionIds: [id], action: 'review_update' });
};

export const bulkUpdateQuestionStatus = async (ids: string[], status: 'APPROVED' | 'REJECTED') => {
    const { error } = await supabase
        .from(DB_TABLES.BANK.QUESTIONS)
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', ids);

    if (error) throw error;
    await invalidateQuestionBankCaches({ questionIds: ids, action: 'review_update' });
};
