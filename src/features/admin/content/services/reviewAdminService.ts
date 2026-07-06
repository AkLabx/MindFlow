import { supabase } from '@/lib/supabase';
import { ExtractedQuestion } from '../types/review';

export const fetchPendingReviewQuestions = async (): Promise<ExtractedQuestion[]> => {
    const { data, error } = await supabase
        .from('questions')
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
        .from('questions')
        .update({ status })
        .eq('id', id);

    if (error) throw error;
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
    };

    const { error } = await supabase
        .from('questions')
        .update(safeUpdates)
        .eq('id', id);

    if (error) throw error;
};

export const bulkUpdateQuestionStatus = async (ids: string[], status: 'APPROVED' | 'REJECTED') => {
    const { error } = await supabase
        .from('questions')
        .update({ status })
        .in('id', ids);

    if (error) throw error;
};
