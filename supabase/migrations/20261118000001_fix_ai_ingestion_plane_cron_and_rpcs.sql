-- ====================================================================
-- Migration: Fix AI Ingestion Plane Cron Functions, Fallback Chains, & RPCs
-- Date: 2026-11-18
-- ====================================================================

-- 1. AI Task Fallback Chains: Strategically prioritize gemini-3.8-flash for high-value reasoning
UPDATE public.ai_task_config
SET model_chain = '["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemma-4-26b-a4b-it"]'::jsonb
WHERE task IN ('question_teacher_v1', 'question_research_v1', 'ask_ai_tutor', 'chat');

UPDATE public.ai_task_config
SET model_chain = '["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemma-4-26b-a4b-it"]'::jsonb
WHERE task IN ('question_extract_v1', 'question_translation_v1', 'question_taxonomy_v1');

-- 2. Process Extraction Queue
CREATE OR REPLACE FUNCTION public.process_extraction_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    url text := COALESCE(
        current_setting('app.settings.edge_function_url', true),
        'https://sjcfagpjstbfxuiwhlps.supabase.co/functions/v1'
    );
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.source_documents
        WHERE status IN ('QUEUED', 'PROCESSING')
    ) THEN
        PERFORM net.http_post(
            url := url || '/extract-questions',
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := '{}'::jsonb,
            timeout_milliseconds := 120000
        );
    END IF;
END;
$$;

-- 3. Process Question Enrichment Queue
CREATE OR REPLACE FUNCTION public.process_question_enrichment_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    url text := COALESCE(
        current_setting('app.settings.edge_function_url', true),
        'https://sjcfagpjstbfxuiwhlps.supabase.co/functions/v1'
    );
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.questions
        WHERE status = 'ENRICHMENT_PENDING'
    ) OR EXISTS (
        SELECT 1 FROM pgmq.q_question_ai_jobs
        WHERE vt <= now()
    ) THEN
        PERFORM net.http_post(
            url := url || '/enrich-questions',
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := '{}'::jsonb,
            timeout_milliseconds := 120000
        );
    END IF;
END;
$$;

-- 4. Process Taxonomy Queue
CREATE OR REPLACE FUNCTION public.process_taxonomy_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    url text := COALESCE(
        current_setting('app.settings.edge_function_url', true),
        'https://sjcfagpjstbfxuiwhlps.supabase.co/functions/v1'
    );
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.questions
        WHERE enrichment_progress->>'classification' = 'false'
           OR enrichment_progress->'classification' IS NULL
           OR NOT (enrichment_progress ? 'classification')
    ) THEN
        PERFORM net.http_post(
            url := url || '/enrich-taxonomy',
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := '{}'::jsonb,
            timeout_milliseconds := 120000
        );
    END IF;
END;
$$;

-- 5. Process Enrichment Queue
CREATE OR REPLACE FUNCTION public.process_enrichment_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    url text := COALESCE(
        current_setting('app.settings.edge_function_url', true),
        'https://sjcfagpjstbfxuiwhlps.supabase.co/functions/v1'
    );
BEGIN
    IF EXISTS (
        SELECT 1 FROM pgmq.q_enrichment_jobs
        WHERE vt <= now()
    ) THEN
        PERFORM net.http_post(
            url := url || '/enrich-synonyms',
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := '{}'::jsonb,
            timeout_milliseconds := 120000
        );
    END IF;
END;
$$;

-- 6. RPC: Trigger Extraction Worker
CREATE OR REPLACE FUNCTION public.trigger_extraction_worker()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    url text := COALESCE(
        current_setting('app.settings.edge_function_url', true),
        'https://sjcfagpjstbfxuiwhlps.supabase.co/functions/v1'
    );
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required.';
    END IF;

    PERFORM net.http_post(
        url := url || '/extract-questions',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );

    RETURN jsonb_build_object('success', true, 'message', 'Extraction worker triggered successfully.');
END;
$$;

-- 7. RPC: Trigger Enrichment Worker
CREATE OR REPLACE FUNCTION public.trigger_enrichment_worker()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    url text := COALESCE(
        current_setting('app.settings.edge_function_url', true),
        'https://sjcfagpjstbfxuiwhlps.supabase.co/functions/v1'
    );
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required.';
    END IF;

    PERFORM net.http_post(
        url := url || '/enrich-questions',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );

    RETURN jsonb_build_object('success', true, 'message', 'Enrichment worker triggered successfully.');
END;
$$;

-- 8. RPC: Retry Source Document
CREATE OR REPLACE FUNCTION public.retry_source_document(p_document_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    doc record;
    mq_payload jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required.';
    END IF;

    SELECT * INTO doc FROM public.source_documents WHERE id = p_document_id;
    IF doc IS NULL THEN
        RAISE EXCEPTION 'Document not found';
    END IF;

    UPDATE public.source_documents
    SET 
        status = 'QUEUED',
        error_message = NULL,
        failed_at = NULL,
        extraction_progress = jsonb_build_object(
            'phase', 'QUEUED',
            'retries', COALESCE((extraction_progress->>'retries')::int, 0) + 1,
            'current_batch', 1,
            'pages_completed', 0,
            'total_questions_extracted', 0
        )
    WHERE id = p_document_id;

    mq_payload := jsonb_build_object(
        'source_document_id', doc.id,
        'storage_bucket', doc.storage_bucket,
        'storage_path', doc.storage_path,
        'exam_name', doc.exam_name,
        'exam_year', doc.exam_year,
        'exam_date_shift', doc.exam_shift,
        'prompt_profile', doc.prompt_profile,
        'source_type', doc.source_type,
        'schema_version', 1
    );

    PERFORM pgmq.send('pre_phase_question_jobs', mq_payload);
    PERFORM public.trigger_extraction_worker();

    RETURN jsonb_build_object('success', true, 'message', 'Document re-queued and worker triggered.');
END;
$$;

-- 9. Grants
GRANT EXECUTE ON FUNCTION public.process_extraction_queue() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.process_question_enrichment_queue() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.process_taxonomy_queue() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.process_enrichment_queue() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.trigger_extraction_worker() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.trigger_enrichment_worker() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.retry_source_document(uuid) TO authenticated, service_role;

-- 11. Overload for character varying compatibility
CREATE OR REPLACE FUNCTION public.report_execution_result(
    p_model character varying, 
    p_api_key_name character varying, 
    p_status_code integer, 
    p_latency_ms integer, 
    p_error_classification character varying, 
    p_provider_message character varying, 
    p_retry_after_seconds integer DEFAULT 60
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM public.report_execution_result(
        p_model::text,
        p_api_key_name::text,
        p_status_code,
        p_latency_ms,
        p_error_classification::text,
        p_provider_message::text,
        p_retry_after_seconds
    );
END;
$$;

-- 12. Dynamic Per-Key Concurrency & Priority Waterfall in get_execution_plan
CREATE OR REPLACE FUNCTION public.get_execution_plan(p_task text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    task_cfg record;
    models jsonb;
    plan jsonb;
BEGIN
    -- 1. Fetch task configuration
    SELECT * INTO task_cfg FROM public.ai_task_config WHERE task = p_task AND is_enabled = true;
    
    IF task_cfg IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Task not found or disabled');
    END IF;

    -- 2. Fetch healthy models based on the task's allowed model_chain, filtering by per-key/model RPM limits
    WITH ranked_models AS (
        SELECT 
            amr.model,
            amr.api_key_name,
            amr.provider,
            amr.health_score,
            mc.ordinality AS priority_index
        FROM public.ai_model_runtime amr
        JOIN jsonb_array_elements_text(task_cfg.model_chain) WITH ORDINALITY AS mc(model_name, ordinality) 
          ON amr.model = mc.model_name
        WHERE amr.enabled = true
          AND amr.available_after <= now()
          AND amr.rpd_exhausted = false
          AND amr.maintenance_mode = false
          AND (amr.disabled_until IS NULL OR amr.disabled_until <= now())
          -- Intelligent RPM per-key filtering:
          AND (
              (amr.model = 'gemini-3.8-flash' AND amr.minute_requests < 4) OR
              (amr.model IN ('gemini-3.1-flash-lite', 'gemini-3.5-flash-lite') AND amr.minute_requests < 14) OR
              (amr.model LIKE 'gemma%' AND amr.minute_requests < 28) OR
              (amr.model NOT IN ('gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite') AND NOT amr.model LIKE 'gemma%' AND amr.minute_requests < 4)
          )
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'model', model,
            'api_key_name', api_key_name,
            'provider', provider
        ) ORDER BY priority_index ASC, health_score DESC, provider ASC, model ASC, api_key_name ASC
    ) INTO models
    FROM ranked_models;

    IF models IS NULL OR jsonb_array_length(models) = 0 THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'No healthy models currently available (RPM/RPD throttled or cooling down)',
            'task_cfg', jsonb_build_object(
                 'batch_size', task_cfg.batch_size,
                 'visibility_timeout', task_cfg.visibility_timeout
            )
        );
    END IF;

    -- 3. Construct and return the execution plan
    plan := jsonb_build_object(
        'success', true,
        'task', task_cfg.task,
        'batch_size', task_cfg.batch_size,
        'visibility_timeout', task_cfg.visibility_timeout,
        'max_attempts', task_cfg.max_attempts,
        'models', models
    );

    RETURN plan;
END;
$$;
CREATE OR REPLACE FUNCTION public.report_execution_result(
    p_model text,
    p_api_key_name text,
    p_status_code integer,
    p_latency_ms integer,
    p_error_classification text,
    p_provider_message text,
    p_retry_after_seconds integer DEFAULT 60
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record public.ai_model_runtime%ROWTYPE;
BEGIN
    SELECT * INTO v_record FROM public.ai_model_runtime 
    WHERE model = p_model AND api_key_name = p_api_key_name;

    IF v_record IS NULL THEN
        RETURN;
    END IF;

    IF p_status_code = 200 THEN
        UPDATE public.ai_model_runtime
        SET 
            consecutive_success = consecutive_success + 1,
            consecutive_failures = 0,
            consecutive_429 = 0,
            last_success = now(),
            last_http_status = 200,
            last_error = NULL,
            minute_requests = minute_requests + 1,
            daily_requests = daily_requests + 1,
            average_latency_ms = CASE WHEN average_latency_ms = 0 THEN p_latency_ms ELSE (average_latency_ms * 9 + p_latency_ms) / 10 END,
            health_score = LEAST(100, health_score + 2),
            updated_at = now()
        WHERE model = p_model AND api_key_name = p_api_key_name;

    ELSIF p_status_code = 429 OR p_error_classification = 'RPM_EXHAUSTED' THEN
        UPDATE public.ai_model_runtime
        SET 
            consecutive_429 = consecutive_429 + 1,
            consecutive_success = 0,
            last_failure = now(),
            last_error = COALESCE(p_provider_message, 'Rate Limited (429)'),
            last_http_status = 429,
            available_after = now() + (COALESCE(p_retry_after_seconds, 60) || ' seconds')::interval,
            rpd_exhausted = (p_provider_message ILIKE '%daily%' AND p_provider_message ILIKE '%quota%'),
            disabled_until = NULL,
            health_score = GREATEST(10, health_score - 10),
            updated_at = now()
        WHERE model = p_model AND api_key_name = p_api_key_name;

    ELSIF p_error_classification = 'RPD_EXHAUSTED' THEN
        UPDATE public.ai_model_runtime
        SET 
            consecutive_429 = consecutive_429 + 1,
            consecutive_success = 0,
            last_failure = now(),
            last_error = COALESCE(p_provider_message, 'Daily Quota Exhausted (RPD)'),
            last_http_status = 429,
            rpd_exhausted = true,
            available_after = now() + interval '1 hour',
            health_score = GREATEST(0, health_score - 50),
            updated_at = now()
        WHERE model = p_model AND api_key_name = p_api_key_name;

    ELSE
        UPDATE public.ai_model_runtime
        SET 
            consecutive_failures = consecutive_failures + 1,
            consecutive_success = 0,
            last_failure = now(),
            last_error = COALESCE(p_provider_message, 'Error (' || p_status_code || ')'),
            last_http_status = p_status_code,
            available_after = now() + interval '30 seconds',
            health_score = GREATEST(20, health_score - 15),
            updated_at = now()
        WHERE model = p_model AND api_key_name = p_api_key_name;
    END IF;
END;
$$;
