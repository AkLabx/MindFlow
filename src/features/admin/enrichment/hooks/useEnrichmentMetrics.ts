import { useQuery } from '@tanstack/react-query';
import { fetchPipelineMetrics } from '../services/pipelineMetricsService';
import { PipelineType } from '../constants/pipelineRegistry';
import { usePipelineStore } from '../stores/usePipelineStore';

export const useEnrichmentMetrics = () => {
    const selectedPipeline = usePipelineStore(s => s.selectedPipeline);

    return useQuery({
        queryKey: ['enrichment_metrics', selectedPipeline],
        queryFn: () => fetchPipelineMetrics(selectedPipeline),
        refetchInterval: 15000, // Poll every 15s
        retry: 2,
        staleTime: 5000
    });
};
