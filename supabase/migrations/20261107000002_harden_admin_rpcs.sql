-- ============================================================================
-- Phase 3: RPC Functions Hardening, Privilege Revocation & Search Path Lockdown
-- 1. Updates function bodies: replaces email check with IF NOT public.is_admin()
-- 2. Closes security hole on delete_content_by_admin, restore_content_by_admin, admin_override_explanation
-- 3. Sets search_path = public on all 30+ admin RPCs
-- 4. REVOKE EXECUTE FROM public, anon; GRANT EXECUTE TO authenticated;
-- 5. Hardens all 102 mutable search path functions from Security Advisor audit
-- ============================================================================

SET statement_timeout = '10s';
SET lock_timeout = '2s';

-- 1. Fix Critical Vulnerability: delete_content_by_admin
CREATE OR REPLACE FUNCTION public.delete_content_by_admin(p_target_id uuid, p_target_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() AND NOT public.has_role('moderator'::public.app_role) THEN
        RAISE EXCEPTION 'Forbidden: Administrator or Moderator role required';
    END IF;

    IF p_target_type = 'post' THEN
        DELETE FROM public.posts WHERE id = p_target_id;
    ELSIF p_target_type = 'reel' THEN
        DELETE FROM public.reels WHERE id = p_target_id;
    END IF;
END;
$$;

-- 2. Fix Critical Vulnerability: restore_content_by_admin
CREATE OR REPLACE FUNCTION public.restore_content_by_admin(p_target_id uuid, p_target_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() AND NOT public.has_role('moderator'::public.app_role) THEN
        RAISE EXCEPTION 'Forbidden: Administrator or Moderator role required';
    END IF;

    IF p_target_type = 'post' THEN
        UPDATE public.posts SET is_hidden_by_admin = FALSE WHERE id = p_target_id;
    ELSIF p_target_type = 'reel' THEN
        UPDATE public.reels SET is_hidden_by_admin = FALSE WHERE id = p_target_id;
    END IF;
END;
$$;

-- 3. Fix Critical Vulnerability: admin_override_explanation
CREATE OR REPLACE FUNCTION public.admin_override_explanation(p_explanation_id uuid, p_new_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() AND NOT public.has_role('content_creator'::public.app_role) THEN
        RAISE EXCEPTION 'Forbidden: Administrator or Content Creator role required';
    END IF;

    UPDATE public.questions 
    SET ask_ai_explanation = p_new_data, ask_ai_generated_at = now()
    WHERE id = p_explanation_id;
END;
$$;

-- 4. Pipeline & Cron Controls
CREATE OR REPLACE FUNCTION public.emergency_stop_pipeline()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    PERFORM cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'seed_enrichment_jobs'), active := false);
    PERFORM cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'process_enrichment_jobs'), active := false);
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.resume_pipeline()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    PERFORM cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'seed_enrichment_jobs'), active := true);
    PERFORM cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'process_enrichment_jobs'), active := true);
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_freeze_ai_pipeline(pipeline_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    IF pipeline_name = 'vocabulary' THEN
        UPDATE cron.job SET active = false WHERE jobname IN ('seed_enrichment_jobs', 'process_enrichment_jobs');
    ELSIF pipeline_name = 'question_enrichment' THEN
        UPDATE cron.job SET active = false WHERE jobname = 'process_question_enrichment';
    ELSIF pipeline_name = 'question_extraction' THEN
        UPDATE cron.job SET active = false WHERE jobname = 'process_question_extraction';
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_resume_ai_pipeline(pipeline_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    IF pipeline_name = 'vocabulary' THEN
        UPDATE cron.job SET active = true WHERE jobname IN ('seed_enrichment_jobs', 'process_enrichment_jobs');
    ELSIF pipeline_name = 'question_enrichment' THEN
        UPDATE cron.job SET active = true WHERE jobname = 'process_question_enrichment';
    ELSIF pipeline_name = 'question_extraction' THEN
        UPDATE cron.job SET active = true WHERE jobname = 'process_question_extraction';
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_purge_ai_queue(pipeline_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    purged_count BIGINT := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    IF pipeline_name = 'vocabulary' THEN
        SELECT count(*) INTO purged_count FROM pgmq.q_enrichment_jobs;
        PERFORM pgmq.purge_queue('enrichment_jobs');
    ELSIF pipeline_name = 'question_enrichment' THEN
        SELECT count(*) INTO purged_count FROM pgmq.q_question_ai_jobs;
        PERFORM pgmq.purge_queue('question_ai_jobs');
    ELSIF pipeline_name = 'question_extraction' THEN
        SELECT count(*) INTO purged_count FROM pgmq.q_pre_phase_question_jobs;
        PERFORM pgmq.purge_queue('pre_phase_question_jobs');
    END IF;

    RETURN jsonb_build_object('success', true, 'purged', purged_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_freeze_pipeline()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    UPDATE cron.job SET active = false WHERE jobname IN ('seed_enrichment_jobs', 'process_enrichment_jobs');
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_freeze_pipeline(pipeline_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    IF pipeline_type = 'vocabulary' THEN
        UPDATE cron.job SET active = false WHERE jobname IN ('seed_enrichment_jobs', 'process_enrichment_jobs');
    ELSIF pipeline_type = 'question_enrichment' THEN
        UPDATE cron.job SET active = false WHERE jobname IN ('process_question_enrichment_jobs', 'process_extraction_jobs');
    END IF;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_resume_pipeline()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    UPDATE cron.job SET active = true WHERE jobname IN ('seed_enrichment_jobs', 'process_enrichment_jobs');
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_resume_pipeline(pipeline_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    IF pipeline_type = 'vocabulary' THEN
        UPDATE cron.job SET active = true WHERE jobname IN ('seed_enrichment_jobs', 'process_enrichment_jobs');
    ELSIF pipeline_type = 'question_enrichment' THEN
        UPDATE cron.job SET active = true WHERE jobname IN ('process_question_enrichment_jobs', 'process_extraction_jobs');
    END IF;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_purge_queue()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    PERFORM pgmq.drop_queue('enrichment_jobs');
    PERFORM pgmq.create('enrichment_jobs');
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_purge_queue(pipeline_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    IF pipeline_type = 'vocabulary' THEN
        DELETE FROM pgmq.q_enrichment_jobs;
    ELSIF pipeline_type = 'question_enrichment' THEN
        DELETE FROM pgmq.q_question_ai_jobs;
        DELETE FROM pgmq.q_pre_phase_question_jobs;
    END IF;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_nuclear_reset()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    UPDATE cron.job SET active = false WHERE jobname IN ('seed_enrichment_jobs', 'process_enrichment_jobs');
    PERFORM pgmq.drop_queue('enrichment_jobs');
    PERFORM pgmq.create('enrichment_jobs');
    
    INSERT INTO public.enrichment_dlq_archive (id, word_id, error_message, task, failed_at, attempt_count, archived_at)
    SELECT id, word_id, error_message, task, failed_at, attempt_count, NOW()
    FROM public.enrichment_dlq;
    
    DELETE FROM public.enrichment_dlq;
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_nuclear_reset(pipeline_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    IF pipeline_type = 'vocabulary' THEN
        UPDATE cron.job SET active = false WHERE jobname IN ('seed_enrichment_jobs', 'process_enrichment_jobs');
        DELETE FROM pgmq.q_enrichment_jobs;
        DELETE FROM public.enrichment_dlq;
    ELSIF pipeline_type = 'question_enrichment' THEN
        UPDATE cron.job SET active = false WHERE jobname IN ('process_question_enrichment_jobs', 'process_extraction_jobs');
        DELETE FROM pgmq.q_question_ai_jobs;
        DELETE FROM pgmq.q_pre_phase_question_jobs;
    END IF;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_enqueue_manual_job(p_word_id uuid, p_task text, p_prompt_version text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    PERFORM pgmq.send(
        queue_name => 'enrichment_jobs',
        msg => jsonb_build_object(
            'id', p_word_id,
            'task', p_task,
            'attempt', 1,
            'source', 'MANUAL_ADMIN',
            'prompt_version', p_prompt_version
        )
    );

    RETURN TRUE;
END;
$$;

-- 5. DLQ & Queue Management
CREATE OR REPLACE FUNCTION public.retry_dlq_job(p_dlq_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_word_id UUID;
    v_task TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    SELECT word_id, task INTO v_word_id, v_task FROM public.enrichment_dlq WHERE id = p_dlq_id;

    IF v_word_id IS NULL THEN
        RAISE EXCEPTION 'DLQ job not found';
    END IF;

    PERFORM pgmq.send(
        queue_name => 'enrichment_jobs',
        msg => jsonb_build_object(
            'id', v_word_id,
            'task', v_task,
            'attempt', 1,
            'priority', 999
        )
    );

    DELETE FROM public.enrichment_dlq WHERE id = p_dlq_id;
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_dlq_job(p_dlq_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    INSERT INTO public.enrichment_dlq_archive (id, word_id, error_message, task, failed_at, attempt_count, archived_at)
    SELECT id, word_id, error_message, task, failed_at, attempt_count, NOW()
    FROM public.enrichment_dlq WHERE id = p_dlq_id;

    DELETE FROM public.enrichment_dlq WHERE id = p_dlq_id;
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_all_dlq()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    SELECT count(*) INTO v_count FROM public.enrichment_dlq;

    INSERT INTO public.enrichment_dlq_archive (id, word_id, error_message, task, failed_at, attempt_count, archived_at)
    SELECT id, word_id, error_message, task, failed_at, attempt_count, NOW()
    FROM public.enrichment_dlq;

    DELETE FROM public.enrichment_dlq;
    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.force_single_record(p_word_id UUID, p_task TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

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
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    PERFORM public.seed_enrichment_queue();
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_extraction_job(p_source_document_id uuid, p_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required.';
    END IF;

    p_payload := p_payload || '{"schema_version": 1}'::jsonb;
    PERFORM pgmq.send('pre_phase_question_jobs', p_payload);
END;
$$;

-- 6. Observability & Dashboard Metrics RPCs
CREATE OR REPLACE FUNCTION public.get_ai_pipeline_dashboard_metrics(pipeline_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_active BOOLEAN := false;
    queue_pending INTEGER := 0;
    queue_running INTEGER := 0;
    queue_retry INTEGER := 0;
    dlq_count INTEGER := 0;
    req_today INTEGER := 0;
    edge_today INTEGER := 0;
    avg_in INTEGER := 0;
    avg_out INTEGER := 0;
    schema_failures INTEGER := 0;
    prompt_drift INTEGER := 0;
    consecutive_fail INTEGER := 0;
    queue_intel JSONB := '[]'::jsonb;
    models_json JSONB := '{}'::jsonb;
    latency_json JSONB := '{}'::jsonb;
    success_json JSONB := '{}'::jsonb;
    progress_json JSONB := '{}'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    IF pipeline_name = 'vocabulary' THEN
        SELECT active INTO is_active FROM cron.job WHERE jobname = 'seed_enrichment_jobs' LIMIT 1;
        SELECT count(*) INTO queue_pending FROM pgmq.q_enrichment_jobs;
        SELECT count(*) INTO dlq_count FROM public.enrichment_dlq;

        SELECT COALESCE(SUM(successful_records), 0) INTO edge_today
        FROM public.ai_request_logs
        WHERE created_at >= CURRENT_DATE AND feature = 'vocabulary';
        req_today := edge_today;

        SELECT COALESCE(AVG(input_tokens + output_tokens), 0) INTO avg_in
        FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'vocabulary';

        SELECT COALESCE(jsonb_object_agg(model, count_val), '{}'::jsonb) INTO models_json
        FROM (SELECT COALESCE(model, 'unknown') as model, count(*) as count_val FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'vocabulary' GROUP BY model) sub;

        SELECT COALESCE(jsonb_agg(jsonb_build_object('task', task, 'pending', 0, 'running', 0, 'retry_pending', 0)), '[]'::jsonb) INTO queue_intel
        FROM public.ai_task_config;

        SELECT jsonb_build_object(
            'synonyms_total', (SELECT count(*) FROM public.synonym),
            'synonyms_complete', (SELECT count(*) FROM public.synonym WHERE ai_metadata IS NOT NULL)
        ) INTO progress_json;

    ELSIF pipeline_name = 'question_enrichment' THEN
        SELECT active INTO is_active FROM cron.job WHERE jobname = 'process_question_enrichment' LIMIT 1;
        SELECT count(*) INTO queue_pending FROM pgmq.q_question_ai_jobs;
        SELECT count(*) INTO dlq_count FROM pgmq.a_question_ai_jobs;

        SELECT COALESCE(SUM(successful_records), 0) INTO edge_today
        FROM public.ai_request_logs
        WHERE created_at >= CURRENT_DATE AND feature = 'question_enrichment';
        req_today := edge_today;

        SELECT COALESCE(AVG(input_tokens + output_tokens), 0) INTO avg_in
        FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'question_enrichment';

        SELECT COALESCE(jsonb_object_agg(model, count_val), '{}'::jsonb) INTO models_json
        FROM (SELECT COALESCE(model, 'unknown') as model, count(*) as count_val FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'question_enrichment' GROUP BY model) sub;

        SELECT jsonb_build_object(
            'questions_total', (SELECT count(*) FROM public.questions),
            'questions_complete', (SELECT count(*) FROM public.questions WHERE ask_ai_explanation IS NOT NULL)
        ) INTO progress_json;

    ELSIF pipeline_name = 'question_extraction' THEN
        SELECT active INTO is_active FROM cron.job WHERE jobname = 'process_question_extraction' LIMIT 1;
        SELECT count(*) INTO queue_pending FROM pgmq.q_pre_phase_question_jobs;
        SELECT count(*) INTO dlq_count FROM pgmq.a_pre_phase_question_jobs;

        SELECT COALESCE(SUM(successful_records), 0) INTO edge_today
        FROM public.ai_request_logs
        WHERE created_at >= CURRENT_DATE AND feature = 'question_extraction';
        req_today := edge_today;

        SELECT jsonb_build_object(
            'total_documents', (SELECT count(*) FROM public.source_documents),
            'processed_documents', (SELECT count(*) FROM public.source_documents WHERE status = 'COMPLETED')
        ) INTO progress_json;
    END IF;

    RETURN jsonb_build_object(
        'pipeline_status', jsonb_build_object(
            'is_active', COALESCE(is_active, false),
            'queue_pending', COALESCE(queue_pending, 0),
            'queue_running', COALESCE(queue_running, 0),
            'queue_retry', COALESCE(queue_retry, 0),
            'dlq_count', COALESCE(dlq_count, 0)
        ),
        'intelligence', jsonb_build_object(
            'task_matrix', queue_intel,
            'progress', progress_json
        ),
        'metrics', jsonb_build_object(
            'requests_today', COALESCE(req_today, 0),
            'edge_invocations_today', COALESCE(edge_today, 0),
            'avg_tokens_input', COALESCE(avg_in, 0),
            'avg_tokens_output', COALESCE(avg_out, 0),
            'schema_failures', COALESCE(schema_failures, 0),
            'prompt_drift', COALESCE(prompt_drift, 0),
            'consecutive_failures', COALESCE(consecutive_fail, 0)
        ),
        'models', jsonb_build_object(
            'distribution', models_json,
            'phase_latency', latency_json,
            'success_rate', success_json
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ai_pipeline_dlq(pipeline_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    IF pipeline_name = 'vocabulary' THEN
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', id, 'word_id', word_id, 'error_message', error_message, 'task', task, 'failed_at', failed_at, 'attempt_count', attempt_count
        ) ORDER BY failed_at DESC), '[]'::jsonb) INTO result
        FROM public.enrichment_dlq LIMIT 50;
    ELSIF pipeline_name = 'question_enrichment' THEN
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', msg_id::text, 'word_id', COALESCE(message->>'question_id', 'Unknown'), 'error_message', 'Failed cascade', 'task', COALESCE(message->>'task', 'enrich_cascade'), 'failed_at', archived_at, 'attempt_count', vt
        ) ORDER BY archived_at DESC), '[]'::jsonb) INTO result
        FROM pgmq.a_question_ai_jobs LIMIT 50;
    ELSIF pipeline_name = 'question_extraction' THEN
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', msg_id::text, 'word_id', COALESCE(message->>'source_document_id', 'Unknown'), 'error_message', 'Failed extraction', 'task', COALESCE(message->>'task', 'extract_pdf'), 'failed_at', archived_at, 'attempt_count', vt
        ) ORDER BY archived_at DESC), '[]'::jsonb) INTO result
        FROM pgmq.a_pre_phase_question_jobs LIMIT 50;
    END IF;

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_enrichment_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_pipeline_active BOOLEAN;
    queue_depth_val INTEGER;
    dlq_count_val INTEGER;
    last_success_minutes_val INTEGER;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    SELECT active INTO is_pipeline_active FROM cron.job WHERE jobname = 'seed_enrichment_jobs' LIMIT 1;
    IF is_pipeline_active IS NULL THEN is_pipeline_active := false; END IF;

    SELECT count(*) INTO queue_depth_val FROM pgmq.q_enrichment_jobs;
    SELECT count(*) INTO dlq_count_val FROM public.enrichment_dlq;

    SELECT EXTRACT(EPOCH FROM (NOW() - end_time))/60 INTO last_success_minutes_val
    FROM cron.job_run_details
    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process_enrichment_jobs')
    AND status = 'succeeded'
    ORDER BY start_time DESC LIMIT 1;

    IF last_success_minutes_val IS NULL THEN last_success_minutes_val := 0; END IF;

    RETURN jsonb_build_object(
        'is_pipeline_active', is_pipeline_active,
        'queue_depth', queue_depth_val,
        'dlq_count', dlq_count_val,
        'last_success_minutes', last_success_minutes_val
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_enrichment_dashboard_metrics_v2()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    RETURN public.get_ai_pipeline_dashboard_metrics('vocabulary');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_enrichment_dlq()
RETURNS TABLE(id uuid, word_id uuid, error_message text, task text, failed_at timestamp with time zone, attempt_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    RETURN QUERY
    SELECT d.id, d.word_id, d.error_message, d.task, d.failed_at, d.attempt_count
    FROM public.enrichment_dlq d
    ORDER BY d.failed_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pipeline_timeline()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    timeline jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'time', created_at,
            'task', feature,
            'model', model,
            'duration', latency_ms,
            'result', CASE WHEN session_success THEN 'Success' WHEN session_success = false AND error_type = 'pedagogical' THEN 'Pedagogical Failure' ELSE 'Fallback/Failure' END
        )
    ), '[]'::jsonb) INTO timeline
    FROM (
        SELECT created_at, feature, model, latency_ms, session_success, error_type
        FROM public.ai_request_logs
        WHERE feature = 'enrichment' OR request_source = 'enrichment'
        ORDER BY created_at DESC
        LIMIT 50
    ) sub;

    RETURN timeline;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_prompt_registry_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    registry jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'task', task,
            'version', version,
            'active', active,
            'success_rate', COALESCE(100.0, 0)
        )
    ), '[]'::jsonb) INTO registry
    FROM public.ai_prompts
    ORDER BY task, active DESC, version DESC;

    RETURN registry;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_word_lineage(p_word_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_word record;
    v_logs jsonb;
    v_dlq jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privilege required';
    END IF;

    SELECT word, ai_metadata INTO v_word FROM public.synonym WHERE id = p_word_id;
    
    IF v_word IS NULL THEN
        RAISE EXCEPTION 'Word not found';
    END IF;

    SELECT COALESCE(jsonb_agg(row_to_json(l)), '[]'::jsonb) INTO v_logs
    FROM (
        SELECT id, created_at, model, feature as task, session_success, error_type, latency_ms, input_tokens, output_tokens
        FROM public.ai_request_logs
        WHERE feature = 'enrichment' AND message->>'word_id' = p_word_id::text
        ORDER BY created_at DESC LIMIT 50
    ) l;

    SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::jsonb) INTO v_dlq
    FROM (
        SELECT id, task, error_message, failed_at, attempt_count
        FROM public.enrichment_dlq
        WHERE word_id = p_word_id
        ORDER BY failed_at DESC
    ) d;

    RETURN jsonb_build_object(
        'word_id', p_word_id,
        'word', v_word.word,
        'ai_metadata', v_word.ai_metadata,
        'history', v_logs,
        'dlq', v_dlq
    );
END;
$$;

-- 7. Revoke Anon Execution and Restrict to Authenticated on Sensitive Admin RPCs
REVOKE EXECUTE ON FUNCTION public.delete_content_by_admin(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_content_by_admin(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.restore_content_by_admin(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_content_by_admin(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_override_explanation(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_override_explanation(uuid, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.emergency_stop_pipeline() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.emergency_stop_pipeline() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.resume_pipeline() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resume_pipeline() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_freeze_ai_pipeline(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_freeze_ai_pipeline(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_resume_ai_pipeline(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resume_ai_pipeline(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_purge_ai_queue(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_purge_ai_queue(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_freeze_pipeline() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_freeze_pipeline() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_freeze_pipeline(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_freeze_pipeline(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_resume_pipeline() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resume_pipeline() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_resume_pipeline(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resume_pipeline(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_purge_queue() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_purge_queue() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_purge_queue(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_purge_queue(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_nuclear_reset() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_nuclear_reset() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_nuclear_reset(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_nuclear_reset(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_enqueue_manual_job(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_enqueue_manual_job(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.retry_dlq_job(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.retry_dlq_job(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.archive_dlq_job(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.archive_dlq_job(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.archive_all_dlq() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.archive_all_dlq() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.force_single_record(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.force_single_record(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.force_manual_batch() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.force_manual_batch() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.enqueue_extraction_job(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_extraction_job(uuid, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_ai_pipeline_dashboard_metrics(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_pipeline_dashboard_metrics(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_ai_pipeline_dlq(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_pipeline_dlq(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_enrichment_dashboard_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_enrichment_dashboard_metrics() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_enrichment_dashboard_metrics_v2() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_enrichment_dashboard_metrics_v2() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_enrichment_dlq() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_enrichment_dlq() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_pipeline_timeline() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pipeline_timeline() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_prompt_registry_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_prompt_registry_metrics() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_word_lineage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_word_lineage(uuid) TO authenticated;

-- 8. Fix Search Path on All Remaining Functions Flagged by Security Advisor
ALTER FUNCTION public.assign_question_v1_id() SET search_path = public;
ALTER FUNCTION public.backfill_user_question_mastery() SET search_path = public;
ALTER FUNCTION public.bulk_enrich_synonyms(jsonb, bigint[]) SET search_path = public;
ALTER FUNCTION public.bulk_queue_questions() SET search_path = public;
ALTER FUNCTION public.calculate_ows_importance_score() SET search_path = public;
ALTER FUNCTION public.check_and_increment_ai_quota(uuid, text) SET search_path = public;
ALTER FUNCTION public.check_and_shadow_flag_user() SET search_path = public;
ALTER FUNCTION public.check_and_update_enriched_status() SET search_path = public;
ALTER FUNCTION public.check_live_audio_quota(uuid) SET search_path = public;
ALTER FUNCTION public.cleanup_orphaned_bridge_rows() SET search_path = public;
ALTER FUNCTION public.clone_shared_quiz(uuid, text) SET search_path = public;
ALTER FUNCTION public.create_quiz_session(uuid, uuid, text, bigint, jsonb, text, jsonb, quiz_question_input[]) SET search_path = public;
ALTER FUNCTION public.delete_chat_media() SET search_path = public;
ALTER FUNCTION public.delete_from_queue(text, bigint) SET search_path = public;
ALTER FUNCTION public.delete_scheduled_users() SET search_path = public;
ALTER FUNCTION public.enqueue_question_for_enrichment() SET search_path = public;
ALTER FUNCTION public.export_user_data() SET search_path = public;
ALTER FUNCTION public.fix_question_sequences() SET search_path = public;
ALTER FUNCTION public.flush_live_audio_usage(uuid, integer, integer, integer) SET search_path = public;
ALTER FUNCTION public.get_ai_ops_metrics() SET search_path = public;
ALTER FUNCTION public.get_blocked_users(uuid) SET search_path = public;
ALTER FUNCTION public.get_blueprint_questions(uuid, uuid, jsonb) SET search_path = public;
ALTER FUNCTION public.get_contextual_filter_counts(text[], text[], text[], text[], text[], text[], integer[], text[], text[]) SET search_path = public;
ALTER FUNCTION public.get_contextual_filter_counts(jsonb) SET search_path = public;
ALTER FUNCTION public.get_dashboard_subject_counts() SET search_path = public;
ALTER FUNCTION public.get_dependent_values(text, text[], text) SET search_path = public;
ALTER FUNCTION public.get_distinct_tags() SET search_path = public;
ALTER FUNCTION public.get_distinct_values(text) SET search_path = public;
ALTER FUNCTION public.get_execution_plan(text) SET search_path = public;
ALTER FUNCTION public.get_filtered_idiom_metadata(uuid) SET search_path = public;
ALTER FUNCTION public.get_filtered_idiom_metadata(uuid, timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.get_filtered_ows_metadata(uuid) SET search_path = public;
ALTER FUNCTION public.get_filtered_ows_metadata(uuid, timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.get_filtered_posts_for_user(uuid, uuid[], integer, timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.get_filtered_quiz_metadata(timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.get_filtered_reels_for_user(uuid, integer, timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.get_filtered_synonym_metadata(uuid, timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.get_next_enrichment_batch() SET search_path = public;
ALTER FUNCTION public.get_random_questions(text, integer) SET search_path = public;
ALTER FUNCTION public.get_reels_feed(integer, timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.get_subject_topics_summary(text) SET search_path = public;
ALTER FUNCTION public.get_subtopic_quiz_metadata(text, text, text) SET search_path = public;
ALTER FUNCTION public.handle_app_ui_config_update() SET search_path = public;
ALTER FUNCTION public.handle_content_reports_trigger() SET search_path = public;
ALTER FUNCTION public.handle_new_user_preferences() SET search_path = public;
ALTER FUNCTION public.log_deleted_question() SET search_path = public;
ALTER FUNCTION public.match_questions(vector, double precision, integer) SET search_path = public;
ALTER FUNCTION public.prevent_mass_delete() SET search_path = public;
ALTER FUNCTION public.process_enrichment_queue() SET search_path = public;
ALTER FUNCTION public.process_extraction_queue() SET search_path = public;
ALTER FUNCTION public.process_question_enrichment_queue() SET search_path = public;
ALTER FUNCTION public.process_taxonomy_queue() SET search_path = public;
ALTER FUNCTION public.protect_custom_avatar() SET search_path = public;
ALTER FUNCTION public.read_from_queue(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.record_question_interactions(jsonb) SET search_path = public;
ALTER FUNCTION public.report_execution_result(character varying, character varying, integer, integer, character varying, character varying, integer) SET search_path = public;
ALTER FUNCTION public.report_execution_result(text, text, integer, integer, text, text) SET search_path = public;
ALTER FUNCTION public.reset_daily_ai_quotas() SET search_path = public;
ALTER FUNCTION public.reset_daily_limits() SET search_path = public;
ALTER FUNCTION public.reset_minute_ai_quotas() SET search_path = public;
ALTER FUNCTION public.search_profiles_trgm(text, integer) SET search_path = public;
ALTER FUNCTION public.seed_enrichment_queue() SET search_path = public;
ALTER FUNCTION public.set_current_timestamp_updated_at() SET search_path = public;
ALTER FUNCTION public.sever_follows_on_block() SET search_path = public;
ALTER FUNCTION public.sync_user_profile() SET search_path = public;
ALTER FUNCTION public.trigger_push_notification() SET search_path = public;
ALTER FUNCTION public.update_ai_user_usage_daily() SET search_path = public;
ALTER FUNCTION public.update_cgl_questions(jsonb) SET search_path = public;
ALTER FUNCTION public.update_modified_column() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.vote_explanation(uuid, boolean) SET search_path = public;
ALTER FUNCTION maintenance.prune_system_logs(integer, integer, integer) SET search_path = maintenance;
