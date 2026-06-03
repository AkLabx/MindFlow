import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { quizKeys } from './queryKeys';

export const useDeleteSavedQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quizId: string) => {
      const { error } = await supabase
        .from('saved_quizzes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', quizId);

      if (error) throw error;
      return quizId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.saved() });
      queryClient.invalidateQueries({ queryKey: quizKeys.attempted() }); // Sometimes history lives here
    }
  });
};

export const useRenameSavedQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quizId, newName }: { quizId: string, newName: string }) => {
      const { error } = await supabase
        .from('saved_quizzes')
        .update({ name: newName })
        .eq('id', quizId);

      if (error) throw error;
      return { quizId, newName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.saved() });
      queryClient.invalidateQueries({ queryKey: quizKeys.attempted() });
    }
  });
};
