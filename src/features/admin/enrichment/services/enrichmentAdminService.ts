import { supabase } from '@/lib/supabase';

export const getEnrichmentDashboardMetrics = async () => {
    const { data, error } = await supabase.rpc('get_enrichment_dashboard_metrics_v2');
    if (error) throw error;
    return data;
};

export const getEnrichmentDlq = async () => {
    const { data, error } = await supabase.rpc('get_enrichment_dlq');
    if (error) throw error;
    return data;
};

export const emergencyFreezePipeline = async () => {
    const { data, error } = await supabase.rpc('admin_freeze_pipeline');
    if (error) throw error;
    return data;
};

export const emergencyPurgeQueue = async () => {
    const { data, error } = await supabase.rpc('admin_purge_queue');
    if (error) throw error;
    return data;
};

export const emergencyNuclearReset = async () => {
    const { data, error } = await supabase.rpc('admin_nuclear_reset');
    if (error) throw error;
    return data;
};

export const resumePipeline = async () => {
    const { data, error } = await supabase.rpc('admin_resume_pipeline');
    if (error) throw error;
    return data;
};

export const enqueueManualJob = async (wordId: string, task: string, promptVersion?: string) => {
    const { data, error } = await supabase.rpc('admin_enqueue_manual_job', {
        p_word_id: wordId,
        p_task: task,
        p_prompt_version: promptVersion || null
    });
    if (error) throw error;
    return data;
};

export const getWordLineage = async (wordId: string) => {
    const { data, error } = await supabase.rpc('get_word_lineage', { p_word_id: wordId });
    if (error) throw error;
    return data;
};

export const retryDlqJob = async (dlqId: string) => {
    const { data, error } = await supabase.rpc('retry_dlq_job', { p_dlq_id: dlqId });
    if (error) throw error;
    return data;
};

export const archiveDlqJob = async (dlqId: string) => {
    const { data, error } = await supabase.rpc('archive_dlq_job', { p_dlq_id: dlqId });
    if (error) throw error;
    return data;
};

export const archiveAllDlq = async () => {
    const { data, error } = await supabase.rpc('archive_all_dlq');
    if (error) throw error;
    return data;
};

export const getPipelineTimeline = async () => {
    const { data, error } = await supabase.rpc('get_pipeline_timeline');
    if (error) throw error;
    return data;
};

export const getPromptRegistryMetrics = async () => {
    const { data, error } = await supabase.rpc('get_prompt_registry_metrics');
    if (error) throw error;
    return data;
};
