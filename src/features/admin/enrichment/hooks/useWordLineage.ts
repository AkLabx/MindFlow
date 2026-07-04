import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWordLineage, enqueueManualJob } from '../services/enrichmentAdminService';

export const useWordLineage = (wordId: string | null) => {
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['word_lineage', wordId],
        queryFn: () => getWordLineage(wordId!),
        enabled: !!wordId,
    });

    const manualEnqueueMutation = useMutation({
        mutationFn: ({ task, promptVersion }: { task: string, promptVersion?: string }) =>
            enqueueManualJob(wordId!, task, promptVersion),
        onSuccess: () => {
            // Refetch lineage to show new log entries shortly after
            setTimeout(() => refetch(), 1500);
            queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] });
        }
    });

    return {
        data,
        isLoading,
        error,
        refetch,
        enqueueManualJob: manualEnqueueMutation.mutateAsync,
        isEnqueueing: manualEnqueueMutation.isPending
    };
};
