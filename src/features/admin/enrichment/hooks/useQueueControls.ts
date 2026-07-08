import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    emergencyFreezePipeline,
    emergencyPurgeQueue,
    emergencyNuclearReset,
    resumePipeline
} from '../services/enrichmentAdminService';
import { usePipelineStore } from '../stores/usePipelineStore';

export const useQueueControls = () => {
    const queryClient = useQueryClient();
    const { selectedPipeline } = usePipelineStore();

    const freezeMutation = useMutation({
        mutationFn: () => emergencyFreezePipeline(selectedPipeline),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] })
    });

    const purgeMutation = useMutation({
        mutationFn: () => emergencyPurgeQueue(selectedPipeline),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] })
    });

    const nuclearMutation = useMutation({
        mutationFn: () => emergencyNuclearReset(selectedPipeline),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] });
            queryClient.invalidateQueries({ queryKey: ['enrichment_dlq'] });
        }
    });

    const resumeMutation = useMutation({
        mutationFn: () => resumePipeline(selectedPipeline),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] })
    });

    return {
        freeze: freezeMutation.mutateAsync,
        isFreezing: freezeMutation.isPending,
        purge: purgeMutation.mutateAsync,
        isPurging: purgeMutation.isPending,
        nuclear: nuclearMutation.mutateAsync,
        isNuclear: nuclearMutation.isPending,
        resume: resumeMutation.mutateAsync,
        isResuming: resumeMutation.isPending,
    };
};
