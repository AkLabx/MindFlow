import { supabase } from '../../../lib/supabase';

export const setQuestionImage = async (questionId: string, kind: 'explanation' | 'question', url: string | null) => {
    if (!questionId) throw new Error("Question ID is missing.");

    const column = kind === 'explanation' ? 'explanation_image_url' : 'question_image_url';

    const { data, error } = await supabase
        .from('questions')
        .update({ [column]: url })
        .eq('id', questionId)
        .select();

    if (error) throw error;

    if (!data || data.length === 0) {
        throw new Error("No question found to update or permission denied. You might not have admin rights.");
    }

    return data[0];
};
