import { supabase } from '@/lib/supabase';
import { PipelineType, PIPELINE_REGISTRY } from '../constants/pipelineRegistry';
import { EnrichmentDashboardMetrics, EnrichmentDlqJob } from '../types/enrichmentAdmin';

export const fetchPipelineMetrics = async (pipeline: PipelineType): Promise<EnrichmentDashboardMetrics> => {
    const config = PIPELINE_REGISTRY[pipeline];

    if (config.metricsProvider === 'rpc') {
        // Vocabulary uses the existing RPC
        const { data, error } = await supabase.rpc('get_enrichment_dashboard_metrics_v2');
        if (error) throw error;
        return data as EnrichmentDashboardMetrics;
    } else {
        // Question Enrichment uses adapter logic
        return await fetchQuestionEnrichmentMetrics();
    }
};

const fetchQuestionEnrichmentMetrics = async (): Promise<EnrichmentDashboardMetrics> => {
    // 1. Fetch Question Stats
    const { data: qStats, error: qError } = await supabase
        .from('questions')
        .select('enrichment_progress, status')
        .not('enrichment_progress', 'is', null);

    if (qError) throw qError;

    let classificationComplete = 0;
    let translationComplete = 0;
    let explanationComplete = 0;

    qStats?.forEach(q => {
        const p = q.enrichment_progress as Record<string, boolean>;
        if (p?.classification) classificationComplete++;
        if (p?.translation) translationComplete++;
        if (p?.explanation) explanationComplete++;
    });

    const totalWords = qStats?.length || 0;

    // 2. Fetch Queue Stats (from pgmq metadata views if available, or fake it for now if we can't read directly)
    // For now, we will query the queue table directly if possible, or fallback.
    // Note: requires admin privileges to read pgmq tables directly.
    const { count: pendingCount } = await supabase.from('pgmq.question_ai_jobs').select('*', { count: 'exact', head: true });

    const { data: archiveData } = await supabase.from('pgmq.a_question_ai_jobs').select('message, enqueued_at').order('enqueued_at', { ascending: false }).limit(50);
    const dlqCount = archiveData?.length || 0;

    // 3. Fetch Request Logs for Token Economics & Quality Metrics
    // Getting today's stats for 'enrich-questions' feature
    const today = new Date();
    today.setUTCHours(0,0,0,0);

    const { data: logsData } = await supabase
        .from('ai_request_logs')
        .select('input_tokens, output_tokens, status_code, latency_ms, model, error_message')
        .eq('feature', 'enrich-questions')
        .gte('created_at', today.toISOString());

    let totalIn = 0, totalOut = 0;
    let successCount = 0;
    let schemaFailures = 0;
    let totalLatency = 0;
    const modelDist: Record<string, number> = {};

    logsData?.forEach(log => {
        totalIn += log.input_tokens || 0;
        totalOut += log.output_tokens || 0;
        if (log.status_code === 200) successCount++;
        else {
             if (log.error_message?.includes('SCHEMA') || log.error_message?.includes('JSON')) schemaFailures++;
        }
        totalLatency += log.latency_ms || 0;

        const m = log.model || 'unknown';
        modelDist[m] = (modelDist[m] || 0) + 1;
    });

    const totalLogs = logsData?.length || 0;
    const avgIn = totalLogs > 0 ? Math.round(totalIn / totalLogs) : 0;
    const avgOut = totalLogs > 0 ? Math.round(totalOut / totalLogs) : 0;

    // Fake timeline/last success for now
    const lastSuccessMinutes = totalLogs > 0 ? 0 : -1;

    return {
        pipeline_active: pendingCount !== null && pendingCount > 0,
        queue_intelligence: [
            { task: 'classification', pending: pendingCount || 0, running: 0, retry_pending: 0 },
            { task: 'translation', pending: pendingCount || 0, running: 0, retry_pending: 0 },
            { task: 'explanation', pending: pendingCount || 0, running: 0, retry_pending: 0 },
        ],
        dlq_count: dlqCount,
        last_success_minutes: lastSuccessMinutes,
        gemini_requests_today: totalLogs,
        edge_invocations_today: totalLogs,

        // Completion Matrix mappings
        examples_complete: classificationComplete, // Map Tier 1 to a field ProgressMatrix expects for now, or we refactor ProgressMatrix fully
        synonyms_complete: translationComplete,    // Map Tier 2
        antonyms_complete: explanationComplete,    // Map Tier 3

        // Leave unused fields as 0
        confusables_complete: 0, explanation_complete: 0, sense_complete: 0, usage_complete: 0,
        scope_complete: 0, mnemonic_complete: 0, collocations_complete: 0, etymology_complete: 0,
        pronunciation_complete: 0, grammar_complete: 0, register_complete: 0, total_words: totalWords,

        avg_input_tokens: avgIn,
        avg_output_tokens: avgOut,
        consecutive_failures: totalLogs - successCount, // Simplification
        model_distribution: modelDist,
        schema_failures: schemaFailures,
        prompt_drift_incidents: 0,
        queue_depth: pendingCount || 0,
        current_task: 'enrich_cascade',
        phase_latency: {},
        success_rate: { 'overall': totalLogs > 0 ? Math.round((successCount/totalLogs)*100) : 0 }
    };
};

export const fetchPipelineDlq = async (pipeline: PipelineType): Promise<EnrichmentDlqJob[]> => {
    const config = PIPELINE_REGISTRY[pipeline];

    if (config.dlqSource === 'enrichment_dlq') {
        const { data, error } = await supabase.rpc('get_enrichment_dlq');
        if (error) throw error;
        return data as EnrichmentDlqJob[];
    } else {
        // Fetch from pgmq.a_question_ai_jobs
        const { data, error } = await supabase
            .from('pgmq.a_question_ai_jobs')
            .select('msg_id, message, enqueued_at, archived_at, vt')
            .order('archived_at', { ascending: false })
            .limit(50);

        if (error) {
             console.error("Failed to fetch pgmq archive:", error);
             return [];
        }

        return (data || []).map(row => {
             const payload = typeof row.message === 'string' ? JSON.parse(row.message) : row.message;
             return {
                 id: row.msg_id.toString(),
                 word_id: payload?.question_id || 'Unknown',
                 error_message: 'Failed during cascade (Check AI request logs for detail)',
                 task: payload?.task || 'enrich_cascade',
                 failed_at: row.archived_at,
                 attempt_count: row.vt // using vt as proxy for attempts if applicable
             };
        });
    }
};
