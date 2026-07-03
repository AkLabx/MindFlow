import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getEnrichmentDashboardMetrics,
    getEnrichmentDlq,
    emergencyStopPipeline,
    resumePipeline,
    forceSingleRecord,
    forceManualBatch,
    retryDlqJob,
    archiveDlqJob,
    archiveAllDlq
} from '../services/enrichmentAdminService';

export const useEnrichmentAdmin = () => {
    const queryClient = useQueryClient();

    const metricsQuery = useQuery({
        queryKey: ['enrichment_metrics'],
        queryFn: getEnrichmentDashboardMetrics,
        refetchInterval: 30000, // 30 seconds
    });

    const dlqQuery = useQuery({
        queryKey: ['enrichment_dlq'],
        queryFn: getEnrichmentDlq,
        refetchInterval: 30000,
    });

    const emergencyStopMutation = useMutation({
        mutationFn: emergencyStopPipeline,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] });
        }
    });

    const resumeMutation = useMutation({
        mutationFn: resumePipeline,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] });
        }
    });

    const forceSingleRecordMutation = useMutation({
        mutationFn: ({ wordId, task }: { wordId: string, task: string }) => forceSingleRecord(wordId, task),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] });
        }
    });

    const forceManualBatchMutation = useMutation({
        mutationFn: forceManualBatch,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] });
        }
    });

    const retryDlqMutation = useMutation({
        mutationFn: retryDlqJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrichment_dlq'] });
            queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] });
        }
    });

    const archiveDlqMutation = useMutation({
        mutationFn: archiveDlqJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrichment_dlq'] });
            queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] });
        }
    });

    const archiveAllDlqMutation = useMutation({
        mutationFn: archiveAllDlq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrichment_dlq'] });
            queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] });
        }
    });

    return {
        metrics: metricsQuery.data,
        isMetricsLoading: metricsQuery.isLoading,
        isMetricsError: metricsQuery.isError,
        refetchMetrics: metricsQuery.refetch,

        dlq: dlqQuery.data,
        isDlqLoading: dlqQuery.isLoading,
        refetchDlq: dlqQuery.refetch,

        emergencyStop: emergencyStopMutation.mutateAsync,
        isStopping: emergencyStopMutation.isPending,

        resume: resumeMutation.mutateAsync,
        isResuming: resumeMutation.isPending,

        forceSingleRecord: forceSingleRecordMutation.mutateAsync,
        forceManualBatch: forceManualBatchMutation.mutateAsync,

        retryDlq: retryDlqMutation.mutateAsync,
        archiveDlq: archiveDlqMutation.mutateAsync,
        archiveAllDlq: archiveAllDlqMutation.mutateAsync,
    };
};
