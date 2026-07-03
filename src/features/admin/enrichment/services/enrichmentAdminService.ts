import { supabase } from '@/lib/supabase';
import type { EnrichmentDashboardMetrics, EnrichmentDlqJob } from '../types/enrichmentAdmin';

export const getEnrichmentDashboardMetrics = async (): Promise<EnrichmentDashboardMetrics> => {
    const { data, error } = await supabase.rpc('get_enrichment_dashboard_metrics');
    if (error) throw error;
    return data as EnrichmentDashboardMetrics;
};

export const getEnrichmentDlq = async (): Promise<EnrichmentDlqJob[]> => {
    const { data, error } = await supabase.rpc('get_enrichment_dlq');
    if (error) throw error;
    return data as EnrichmentDlqJob[];
};

export const emergencyStopPipeline = async (): Promise<void> => {
    const { error } = await supabase.rpc('emergency_stop_pipeline');
    if (error) throw error;
};

export const resumePipeline = async (): Promise<void> => {
    const { error } = await supabase.rpc('resume_pipeline');
    if (error) throw error;
};

export const forceSingleRecord = async (wordId: string, task: string): Promise<void> => {
    const { error } = await supabase.rpc('force_single_record', { p_word_id: wordId, p_task: task });
    if (error) throw error;
};

export const forceManualBatch = async (): Promise<void> => {
    const { error } = await supabase.rpc('force_manual_batch');
    if (error) throw error;
};

export const retryDlqJob = async (dlqId: string): Promise<void> => {
    const { error } = await supabase.rpc('retry_dlq_job', { p_dlq_id: dlqId });
    if (error) throw error;
};

export const archiveDlqJob = async (dlqId: string): Promise<void> => {
    const { error } = await supabase.rpc('archive_dlq_job', { p_dlq_id: dlqId });
    if (error) throw error;
};

export const archiveAllDlq = async (): Promise<number> => {
    const { data, error } = await supabase.rpc('archive_all_dlq');
    if (error) throw error;
    return data as number;
};
