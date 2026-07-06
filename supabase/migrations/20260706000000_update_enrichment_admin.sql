-- Create new table ai_task_config
CREATE TABLE IF NOT EXISTS public.ai_task_config (
    task TEXT PRIMARY KEY,
    batch_size INTEGER NOT NULL DEFAULT 50,
    priority INTEGER NOT NULL DEFAULT 10,
    visibility_timeout INTEGER NOT NULL DEFAULT 600,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    cooldown_seconds INTEGER NOT NULL DEFAULT 30,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    model_chain JSONB NOT NULL DEFAULT '["gemini-2.5-flash"]'::jsonb
);

ALTER TABLE public.ai_task_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access to ai_task_config" ON public.ai_task_config
    FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'email'::text) = 'admin@mindflow.com'::text)
    WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@mindflow.com'::text);

-- Update ai_request_logs schema
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_request_logs' AND column_name='task') THEN
        ALTER TABLE public.ai_request_logs ADD COLUMN task TEXT;
        ALTER TABLE public.ai_request_logs ADD COLUMN requested_records INTEGER DEFAULT 0;
        ALTER TABLE public.ai_request_logs ADD COLUMN successful_records INTEGER DEFAULT 0;
        ALTER TABLE public.ai_request_logs ADD COLUMN pedagogical_failures INTEGER DEFAULT 0;
        ALTER TABLE public.ai_request_logs ADD COLUMN engineering_failures INTEGER DEFAULT 0;
        ALTER TABLE public.ai_request_logs ADD COLUMN phase_fetch_ms INTEGER DEFAULT 0;
        ALTER TABLE public.ai_request_logs ADD COLUMN phase_gemini_ms INTEGER DEFAULT 0;
        ALTER TABLE public.ai_request_logs ADD COLUMN phase_validation_ms INTEGER DEFAULT 0;
        ALTER TABLE public.ai_request_logs ADD COLUMN phase_db_write_ms INTEGER DEFAULT 0;
    END IF;
END $$;


-- Create get_enrichment_dashboard_metrics_v2
CREATE OR REPLACE FUNCTION public.get_enrichment_dashboard_metrics_v2()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_pipeline_active BOOLEAN;
    queue_depth_val INTEGER;
    dlq_count_val INTEGER;
    last_success_minutes_val INTEGER;
    gemini_requests_today_val INTEGER;
    edge_invocations_today_val INTEGER;
    model_dist_json JSONB;
    synonyms_total_val INTEGER;
    synonyms_complete_val INTEGER;
    examples_total_val INTEGER;
    examples_complete_val INTEGER;
    antonyms_total_val INTEGER;
    antonyms_complete_val INTEGER;
    confusables_total_val INTEGER;
    confusables_complete_val INTEGER;
    avg_runtime_examples_val INTEGER;
    avg_runtime_synonyms_val INTEGER;
    avg_tokens_per_request_val INTEGER;
    consecutive_failures_val INTEGER;
    queue_intelligence_json JSONB;
    phase_latency_json JSONB;
    success_rate_json JSONB;
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- 1. Pipeline Active Status
    SELECT active INTO is_pipeline_active FROM cron.job WHERE jobname = 'seed_enrichment_jobs' LIMIT 1;
    IF is_pipeline_active IS NULL THEN is_pipeline_active := false; END IF;

    -- 2. Queue Depth
    SELECT count(*) INTO queue_depth_val FROM pgmq.q_enrichment_jobs;

    -- 3. DLQ Count
    SELECT count(*) INTO dlq_count_val FROM public.enrichment_dlq;

    -- 4. Last Success Minutes
    SELECT EXTRACT(EPOCH FROM (NOW() - end_time))/60 INTO last_success_minutes_val
    FROM cron.job_run_details
    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process_enrichment_jobs')
    AND status = 'succeeded'
    ORDER BY start_time DESC LIMIT 1;

    IF last_success_minutes_val IS NULL THEN last_success_minutes_val := 0; END IF;

    -- 5. Today's AI Metrics
    SELECT COALESCE(SUM(successful_records), 0) INTO edge_invocations_today_val
    FROM public.ai_request_logs
    WHERE created_at >= CURRENT_DATE AND task IS NOT NULL;

    gemini_requests_today_val := edge_invocations_today_val;

    SELECT COALESCE(jsonb_object_agg(model, count_val), '{}'::jsonb) INTO model_dist_json
    FROM (
        SELECT COALESCE(model, 'unknown') as model, count(*) as count_val
        FROM public.ai_request_logs
        WHERE created_at >= CURRENT_DATE AND task IS NOT NULL
        GROUP BY model
    ) sub;

    SELECT COALESCE(AVG(latency_ms), 0) INTO avg_runtime_examples_val FROM public.ai_request_logs WHERE task = 'examples';
    SELECT COALESCE(AVG(latency_ms), 0) INTO avg_runtime_synonyms_val FROM public.ai_request_logs WHERE task = 'synonyms';
    SELECT COALESCE(AVG(input_tokens + output_tokens), 0) INTO avg_tokens_per_request_val FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND task IS NOT NULL;

    -- 6. Consecutive Failures (Simplistic: count how many failed runs happened since last success in cron)
    SELECT count(*) INTO consecutive_failures_val
    FROM cron.job_run_details
    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process_enrichment_jobs')
    AND status = 'failed'
    AND start_time > COALESCE(
        (SELECT end_time FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process_enrichment_jobs') AND status = 'succeeded' ORDER BY start_time DESC LIMIT 1),
        '1970-01-01'::timestamptz
    );

    -- 7. Progress Metrics
    SELECT count(*) INTO synonyms_total_val FROM public.synonym;

    SELECT count(*) INTO synonyms_complete_val FROM public.synonym WHERE jsonb_array_length(synonyms) > 0;
    SELECT count(*) INTO antonyms_complete_val FROM public.synonym WHERE jsonb_array_length(antonyms) > 0;
    SELECT count(*) INTO examples_complete_val FROM public.synonym WHERE jsonb_array_length(eg_eng) > 0;
    SELECT count(*) INTO confusables_complete_val FROM public.synonym WHERE jsonb_array_length(confusable_with) > 0;

    examples_total_val := synonyms_total_val;
    antonyms_total_val := synonyms_total_val;
    confusables_total_val := synonyms_total_val;

    -- 8. Queue Intelligence (Stubbed from ai_task_config)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'task', task,
        'pending', 0,
        'running', 0,
        'retry_pending', 0
    )), '[]'::jsonb) INTO queue_intelligence_json
    FROM public.ai_task_config;

    -- 9. Phase Latency
    SELECT COALESCE(jsonb_object_agg(task, jsonb_build_object(
        'phase_fetch_ms', COALESCE(AVG(phase_fetch_ms), 0),
        'phase_gemini_ms', COALESCE(AVG(phase_gemini_ms), 0),
        'phase_validation_ms', COALESCE(AVG(phase_validation_ms), 0),
        'phase_db_write_ms', COALESCE(AVG(phase_db_write_ms), 0),
        'latency_ms', COALESCE(AVG(latency_ms), 0)
    )), '{}'::jsonb) INTO phase_latency_json
    FROM public.ai_request_logs
    WHERE created_at >= CURRENT_DATE AND task IS NOT NULL
    GROUP BY task;

    -- 10. Success Rate
    SELECT COALESCE(jsonb_object_agg(task,
        CASE WHEN SUM(requested_records) > 0 THEN (SUM(successful_records)::FLOAT / SUM(requested_records)::FLOAT) * 100 ELSE 0 END
    ), '{}'::jsonb) INTO success_rate_json
    FROM public.ai_request_logs
    WHERE created_at >= CURRENT_DATE AND task IS NOT NULL
    GROUP BY task;

    RETURN jsonb_build_object(
        'pipeline_active', is_pipeline_active,
        'queue_depth', COALESCE(queue_depth_val, 0),
        'dlq_count', COALESCE(dlq_count_val, 0),
        'last_success_minutes', COALESCE(last_success_minutes_val, 0),
        'gemini_requests_today', COALESCE(gemini_requests_today_val, 0),
        'edge_invocations_today', COALESCE(edge_invocations_today_val, 0),
        'estimated_completion_days', 0,
        'examples_complete', COALESCE(examples_complete_val, 0),
        'examples_total', COALESCE(examples_total_val, 0),
        'synonyms_complete', COALESCE(synonyms_complete_val, 0),
        'synonyms_total', COALESCE(synonyms_total_val, 0),
        'antonyms_complete', COALESCE(antonyms_complete_val, 0),
        'antonyms_total', COALESCE(antonyms_total_val, 0),
        'confusables_complete', COALESCE(confusables_complete_val, 0),
        'confusables_total', COALESCE(confusables_total_val, 0),
        'avg_runtime_examples', COALESCE(avg_runtime_examples_val, 0),
        'avg_runtime_synonyms', COALESCE(avg_runtime_synonyms_val, 0),
        'avg_tokens_per_request', COALESCE(avg_tokens_per_request_val, 0),
        'consecutive_failures', COALESCE(consecutive_failures_val, 0),
        'model_distribution', model_dist_json,
        'queue_intelligence', queue_intelligence_json,
        'phase_latency', phase_latency_json,
        'success_rate', success_rate_json
    );
END;
$$;
