import { supabase } from '@/lib/supabase';
import { PipelineType } from '../constants/pipelineRegistry';

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

export const emergencyFreezePipeline = async (pipeline_type: PipelineType = 'vocabulary') => {
    const { data, error } = await supabase.rpc('admin_freeze_pipeline', { pipeline_type });
    if (error) throw error;
    return data;
};

export const emergencyPurgeQueue = async (pipeline_type: PipelineType = 'vocabulary') => {
    const { data, error } = await supabase.rpc('admin_purge_queue', { pipeline_type });
    if (error) throw error;
    return data;
};

export const emergencyNuclearReset = async (pipeline_type: PipelineType = 'vocabulary') => {
    const { data, error } = await supabase.rpc('admin_nuclear_reset', { pipeline_type });
    if (error) throw error;
    return data;
};

export const resumePipeline = async (pipeline_type: PipelineType = 'vocabulary') => {
    const { data, error } = await supabase.rpc('admin_resume_pipeline', { pipeline_type });
    if (error) throw error;
    return data;
};

export const enqueueManualJob = async (wordId: string, task: string, promptVersion?: string) => {
    // If it's a question task, we send it to question_ai_jobs. Otherwise, enrichment_jobs.
    // However, the admin_enqueue_manual_job RPC currently only supports enrichment_jobs.
    // For now, we will handle the manual enqueue branching here or in the hook.

    // We will update the RPC or handle it appropriately.
    // Assuming admin_enqueue_manual_job handles both based on task prefix or we dispatch it.
    if (task.startsWith('question_')) {
        const { data, error } = await supabase.rpc('pgmq_send', {
            queue_name: 'question_ai_jobs',
            message: { question_id: wordId, task, source: 'MANUAL_ADMIN', prompt_version: promptVersion || null }
        });
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase.rpc('admin_enqueue_manual_job', {
            p_word_id: wordId,
            p_task: task,
            p_prompt_version: promptVersion || null
        });
        if (error) throw error;
        return data;
    }
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

export const getAiTaskConfig = async () => {
    const { data, error } = await supabase
        .from('ai_task_config')
        .select('*')
        .order('priority', { ascending: true });

    if (error) throw error;
    return data;
};

export const updateAiTaskConfig = async (task: string, updates: any) => {
    const { data, error } = await supabase
        .from('ai_task_config')
        .update(updates)
        .eq('task', task)
        .select()
        .single();

    if (error) throw error;
    return data;
};
