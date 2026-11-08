import { supabase } from '@/lib/supabase';
import { PipelineType } from '../constants/pipelineRegistry';
import { EnrichmentDashboardMetrics, EnrichmentDlqJob } from '../types/enrichmentAdmin';

const getDefaultMetrics = (pipeline: PipelineType): EnrichmentDashboardMetrics => ({
    pipeline,
    hero: {
        is_active: false,
        queue_depth: 0,
        dlq_count: 0,
        last_success_minutes: -1
    },
    queues: {
        intelligence: []
    },
    progress: {
        total_items: 0,
        tiers: {}
    },
    telemetry: {
        requests_today: 0,
        edge_invocations_today: 0,
        avg_input_tokens: 0,
        avg_output_tokens: 0,
        schema_failures: 0,
        prompt_drift: 0,
        consecutive_failures: 0
    },
    models: {
        distribution: {},
        phase_latency: {},
        success_rate: {}
    }
});

export const fetchPipelineMetrics = async (pipeline: PipelineType): Promise<EnrichmentDashboardMetrics> => {
    try {
        const { data, error } = await supabase.rpc('get_ai_pipeline_dashboard_metrics', { pipeline_name: pipeline });

        if (error) {
            console.warn(`[PipelineMetrics] RPC error for ${pipeline}, using safe defaults:`, error);
            return getDefaultMetrics(pipeline);
        }

        if (!data) {
            return getDefaultMetrics(pipeline);
        }

        const raw = data as any;
        const pipelineStatus = raw.pipeline_status || raw.hero || {};
        const telemetry = raw.metrics || raw.telemetry || {};
        const intelligence = raw.intelligence || raw.queues || {};

        return {
            pipeline,
            hero: {
                is_active: Boolean(pipelineStatus.is_active),
                queue_depth: Number(pipelineStatus.queue_pending ?? pipelineStatus.queue_depth ?? 0) + Number(pipelineStatus.queue_running ?? 0),
                dlq_count: Number(pipelineStatus.dlq_count ?? 0),
                last_success_minutes: Number(pipelineStatus.last_success_minutes ?? 0)
            },
            queues: {
                intelligence: intelligence.task_matrix || intelligence.intelligence || []
            },
            progress: {
                total_items: Number(intelligence.progress?.synonyms_total ?? intelligence.progress?.questions_total ?? intelligence.progress?.total_documents ?? intelligence.progress?.total_items ?? 0),
                tiers: intelligence.progress?.tiers || intelligence.progress || {}
            },
            telemetry: {
                requests_today: Number(telemetry.requests_today ?? 0),
                edge_invocations_today: Number(telemetry.edge_invocations_today ?? 0),
                avg_input_tokens: Number(telemetry.avg_tokens_input ?? telemetry.avg_input_tokens ?? 0),
                avg_output_tokens: Number(telemetry.avg_tokens_output ?? telemetry.avg_output_tokens ?? 0),
                schema_failures: Number(telemetry.schema_failures ?? 0),
                prompt_drift: Number(telemetry.prompt_drift ?? 0),
                consecutive_failures: Number(telemetry.consecutive_failures ?? 0)
            },
            models: {
                distribution: raw.models?.distribution || {},
                phase_latency: raw.models?.phase_latency || {},
                success_rate: raw.models?.success_rate || {}
            }
        };
    } catch (err) {
        console.warn(`[PipelineMetrics] Caught fetch error for ${pipeline}, using fallback:`, err);
        return getDefaultMetrics(pipeline);
    }
};

export const fetchPipelineDlq = async (pipeline: PipelineType): Promise<EnrichmentDlqJob[]> => {
    try {
        const { data, error } = await supabase.rpc('get_ai_pipeline_dlq', { pipeline_name: pipeline });

        if (error) {
            console.warn(`[PipelineDlq] RPC error for ${pipeline}:`, error);
            return [];
        }
        return (data as EnrichmentDlqJob[]) || [];
    } catch (err) {
        console.warn(`[PipelineDlq] Caught fetch error for ${pipeline}:`, err);
        return [];
    }
};
