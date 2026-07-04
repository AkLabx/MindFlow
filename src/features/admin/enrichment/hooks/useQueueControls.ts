import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    emergencyFreezePipeline,
    emergencyPurgeQueue,
    emergencyNuclearReset,
    resumePipeline
} from '../services/enrichmentAdminService';

export const useQueueControls = () => {
    const queryClient = useQueryClient();

    const freezeMutation = useMutation({
        mutationFn: emergencyFreezePipeline,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] })
    });

    const purgeMutation = useMutation({
        mutationFn: emergencyPurgeQueue,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] })
    });

    const nuclearMutation = useMutation({
        mutationFn: emergencyNuclearReset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrichment_metrics'] });
            queryClient.invalidateQueries({ queryKey: ['enrichment_dlq'] });
        }
    });

    const resumeMutation = useMutation({
        mutationFn: resumePipeline,
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
