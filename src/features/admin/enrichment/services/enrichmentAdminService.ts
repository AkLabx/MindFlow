import { supabase } from '@/lib/supabase';
import { PipelineType } from '../constants/pipelineRegistry';

export const emergencyFreezePipeline = async (pipeline_type: PipelineType) => {
    const { data, error } = await supabase.rpc('admin_freeze_ai_pipeline', { pipeline_name: pipeline_type });
    if (error) throw error;
    return data;
};

export const emergencyPurgeQueue = async (pipeline_type: PipelineType) => {
    const { data, error } = await supabase.rpc('admin_purge_ai_queue', { pipeline_name: pipeline_type });
    if (error) throw error;
    return data;
};

export const emergencyNuclearReset = async (pipeline_type: PipelineType) => {
    const { data, error } = await supabase.rpc('admin_nuclear_reset', { pipeline_type }); // Keep or deprecate this
    if (error) throw error;
    return data;
};

export const resumePipeline = async (pipeline_type: PipelineType) => {
    const { data, error } = await supabase.rpc('admin_resume_ai_pipeline', { pipeline_name: pipeline_type });
    if (error) throw error;
    return data;
};

export const enqueueManualJob = async (wordId: string, task: string, pipeline_type: string, promptVersion?: string) => {
    const { data, error } = await supabase.rpc('admin_enqueue_manual_job_v2', {
        p_id: wordId,
        p_task: task,
        p_pipeline: pipeline_type,
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
