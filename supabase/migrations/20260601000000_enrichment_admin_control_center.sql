-- Migration for MindFlow Enrichment Control Center

-- 1. Create Archive Table for DLQ
CREATE TABLE IF NOT EXISTS public.enrichment_dlq_archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word_id UUID NOT NULL REFERENCES public.synonym(id),
    error_message TEXT NOT NULL,
    task TEXT NOT NULL DEFAULT 'unknown',
    failed_at TIMESTAMPTZ DEFAULT NOW(),
    attempt_count INTEGER DEFAULT 1,
    archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure task exists on the main DLQ table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='enrichment_dlq' AND column_name='task') THEN
        ALTER TABLE public.enrichment_dlq ADD COLUMN task TEXT NOT NULL DEFAULT 'unknown';
    END IF;
END $$;

-- 2. Add Missing Columns to ai_request_logs (from earlier Telemetry needs)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_request_logs' AND column_name='model') THEN
        ALTER TABLE public.ai_request_logs ADD COLUMN model TEXT;
        ALTER TABLE public.ai_request_logs ADD COLUMN feature TEXT;
        ALTER TABLE public.ai_request_logs ADD COLUMN input_tokens INTEGER DEFAULT 0;
        ALTER TABLE public.ai_request_logs ADD COLUMN output_tokens INTEGER DEFAULT 0;
        ALTER TABLE public.ai_request_logs ADD COLUMN estimated_cost_usd DECIMAL(10, 6) DEFAULT 0;
        ALTER TABLE public.ai_request_logs ADD COLUMN request_type TEXT;
        ALTER TABLE public.ai_request_logs ADD COLUMN response_status TEXT;
        ALTER TABLE public.ai_request_logs ADD COLUMN session_id TEXT;
        ALTER TABLE public.ai_request_logs ADD COLUMN provider TEXT;
    END IF;
END $$;

-- 3. Setup RLS for enrichment_dlq and enrichment_dlq_archive
ALTER TABLE public.enrichment_dlq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable ALL for admin on enrichment_dlq"
ON public.enrichment_dlq
FOR ALL
USING (auth.jwt()->>'email' = 'admin@mindflow.com');

ALTER TABLE public.enrichment_dlq_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable ALL for admin on enrichment_dlq_archive"
ON public.enrichment_dlq_archive
FOR ALL
USING (auth.jwt()->>'email' = 'admin@mindflow.com');

-- 4. RPCs for Pipeline Control (Cron Alteration)

CREATE OR REPLACE FUNCTION public.emergency_stop_pipeline()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Disable seed job
    PERFORM cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'seed_enrichment_jobs'), active := false);

    -- Disable process job
    PERFORM cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'process_enrichment_jobs'), active := false);

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.resume_pipeline()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Enable seed job
    PERFORM cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'seed_enrichment_jobs'), active := true);

    -- Enable process job
    PERFORM cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'process_enrichment_jobs'), active := true);

    RETURN TRUE;
END;
$$;


-- 5. RPC for Dashboard Metrics
CREATE OR REPLACE FUNCTION public.get_enrichment_dashboard_metrics()
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

    -- 5. Today's AI Metrics (Fallback to 0 if no records exist)
    SELECT count(*) INTO edge_invocations_today_val
    FROM public.ai_request_logs
    WHERE created_at >= CURRENT_DATE AND feature = 'enrichment';

    gemini_requests_today_val := edge_invocations_today_val;

    SELECT COALESCE(jsonb_object_agg(model, count_val), '{}'::jsonb) INTO model_dist_json
    FROM (
        SELECT COALESCE(model, 'unknown') as model, count(*) as count_val
        FROM public.ai_request_logs
        WHERE created_at >= CURRENT_DATE AND feature = 'enrichment'
        GROUP BY model
    ) sub;

    SELECT COALESCE(AVG(latency_ms), 0) INTO avg_runtime_examples_val FROM public.ai_request_logs WHERE feature = 'enrichment' AND request_type = 'examples';
    SELECT COALESCE(AVG(latency_ms), 0) INTO avg_runtime_synonyms_val FROM public.ai_request_logs WHERE feature = 'enrichment' AND request_type = 'synonyms';
    SELECT COALESCE(AVG(input_tokens + output_tokens), 0) INTO avg_tokens_per_request_val FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'enrichment';

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

    RETURN jsonb_build_object(
        'pipeline_active', is_pipeline_active,
        'queue_depth', COALESCE(queue_depth_val, 0),
        'dlq_count', COALESCE(dlq_count_val, 0),
        'last_success_minutes', COALESCE(last_success_minutes_val, 0),
        'gemini_requests_today', COALESCE(gemini_requests_today_val, 0),
        'edge_invocations_today', COALESCE(edge_invocations_today_val, 0),
        'estimated_completion_days', 0, -- Stub for now
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
        'model_distribution', model_dist_json
    );
END;
$$;


-- 6. DLQ Management RPCs

CREATE OR REPLACE FUNCTION public.get_enrichment_dlq()
RETURNS TABLE (
    id UUID,
    word_id UUID,
    error_message TEXT,
    task TEXT,
    failed_at TIMESTAMPTZ,
    attempt_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT d.id, d.word_id, d.error_message, d.task, d.failed_at, d.attempt_count
    FROM public.enrichment_dlq d
    ORDER BY d.failed_at DESC;
END;
$$;


CREATE OR REPLACE FUNCTION public.retry_dlq_job(p_dlq_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_word_id UUID;
    v_task TEXT;
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Get job details
    SELECT word_id, task INTO v_word_id, v_task FROM public.enrichment_dlq WHERE id = p_dlq_id;

    IF v_word_id IS NULL THEN
        RAISE EXCEPTION 'DLQ job not found';
    END IF;

    -- Insert into PGMQ
    PERFORM pgmq.send(
        queue_name => 'enrichment_jobs',
        msg => jsonb_build_object(
            'id', v_word_id,
            'task', v_task,
            'attempt', 1,
            'priority', 999
        )
    );

    -- Remove from DLQ
    DELETE FROM public.enrichment_dlq WHERE id = p_dlq_id;

    RETURN TRUE;
END;
$$;


CREATE OR REPLACE FUNCTION public.archive_dlq_job(p_dlq_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Move to archive
    INSERT INTO public.enrichment_dlq_archive (id, word_id, error_message, task, failed_at, attempt_count, archived_at)
    SELECT id, word_id, error_message, task, failed_at, attempt_count, NOW()
    FROM public.enrichment_dlq WHERE id = p_dlq_id;

    -- Delete from main dlq
    DELETE FROM public.enrichment_dlq WHERE id = p_dlq_id;

    RETURN TRUE;
END;
$$;


CREATE OR REPLACE FUNCTION public.archive_all_dlq()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Count rows to move
    SELECT count(*) INTO v_count FROM public.enrichment_dlq;

    -- Move to archive
    INSERT INTO public.enrichment_dlq_archive (id, word_id, error_message, task, failed_at, attempt_count, archived_at)
    SELECT id, word_id, error_message, task, failed_at, attempt_count, NOW()
    FROM public.enrichment_dlq;

    -- Delete all from main dlq
    DELETE FROM public.enrichment_dlq;

    RETURN v_count;
END;
$$;


-- 7. Trigger Manual Runs

CREATE OR REPLACE FUNCTION public.force_single_record(p_word_id UUID, p_task TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Insert into PGMQ
    PERFORM pgmq.send(
        queue_name => 'enrichment_jobs',
        msg => jsonb_build_object(
            'id', p_word_id,
            'task', p_task,
            'attempt', 1,
            'priority', 999
        )
    );

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.force_manual_batch()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- We assume seed_enrichment_queue is a function that does the queue injection logic
    -- (As identified in previous steps)
    PERFORM public.seed_enrichment_queue();

    RETURN TRUE;
END;
$$;
