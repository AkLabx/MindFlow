import { useQuery } from '@tanstack/react-query';
import { getEnrichmentDashboardMetrics } from '../services/enrichmentAdminService';

export const useEnrichmentMetrics = () => {
    return useQuery({
        queryKey: ['enrichment_metrics'],
        queryFn: getEnrichmentDashboardMetrics,
        refetchInterval: 30000,
    });
};
