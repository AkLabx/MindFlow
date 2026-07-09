import { supabase } from '@/lib/supabase';
import { PipelineType } from '../constants/pipelineRegistry';
import { EnrichmentDashboardMetrics, EnrichmentDlqJob } from '../types/enrichmentAdmin';

export const fetchPipelineMetrics = async (pipeline: PipelineType): Promise<EnrichmentDashboardMetrics> => {
    const { data, error } = await supabase.rpc('get_ai_pipeline_dashboard_metrics', { pipeline_name: pipeline });
    if (error) throw error;
    return data as EnrichmentDashboardMetrics;
};

export const fetchPipelineDlq = async (pipeline: PipelineType): Promise<EnrichmentDlqJob[]> => {
    const { data, error } = await supabase.rpc('get_ai_pipeline_dlq', { pipeline_name: pipeline });
    if (error) throw error;
    return data as EnrichmentDlqJob[];
};
