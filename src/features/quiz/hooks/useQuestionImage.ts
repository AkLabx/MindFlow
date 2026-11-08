import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { setQuestionImage } from '../../admin/api/adminQuestionImageApi';

export const useQuestionImage = (questionId: string, kind: 'explanation' | 'question', initialImageUrl?: string, isVisible: boolean = false) => {
    const queryClient = useQueryClient();
    const column = kind === 'explanation' ? 'explanation_image_url' : 'question_image_url';
    const queryKey = ['question-image', kind, questionId];

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('questions')
                .select(column)
                .eq('id', questionId)
                .single();

            if (error) {
                return null;
            }
            return data?.[column] || null;
        },
        initialData: initialImageUrl || null,
        initialDataUpdatedAt: 0,
        staleTime: 1000 * 60 * 60 * 24,
        enabled: isVisible && !!questionId,
    });

    const mutation = useMutation({
        mutationFn: ({ url }: { url: string | null }) => setQuestionImage(questionId, kind, url),
        onMutate: async ({ url }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousImageUrl = queryClient.getQueryData<string | null>(queryKey);
            queryClient.setQueryData<string | null>(queryKey, url);
            return { previousImageUrl };
        },
        onError: (err, newTodo, context) => {
            if (context?.previousImageUrl !== undefined) {
                queryClient.setQueryData(queryKey, context.previousImageUrl);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        imageUrl: query.data,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        updateImage: mutation.mutateAsync,
        isUpdating: mutation.isPending
    };
};
