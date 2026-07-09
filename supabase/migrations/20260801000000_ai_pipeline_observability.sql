-- Unified AI Operations Observability Migration
-- Creates a standardized, single-entrypoint architecture for all AI Pipelines

CREATE OR REPLACE FUNCTION public.get_ai_pipeline_dashboard_metrics(pipeline_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Generic standard output fields
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

    -- JSON blobs
    queue_intel JSONB := '[]'::jsonb;
    models_json JSONB := '{}'::jsonb;
    latency_json JSONB := '{}'::jsonb;
    success_json JSONB := '{}'::jsonb;
    progress_json JSONB := '{}'::jsonb;
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- =========================================================
    -- VOCABULARY PIPELINE
    -- =========================================================
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

        -- Models & Telemetry
        SELECT COALESCE(jsonb_object_agg(model, count_val), '{}'::jsonb) INTO models_json
        FROM (SELECT COALESCE(model, 'unknown') as model, count(*) as count_val FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'vocabulary' GROUP BY model) sub;

        -- Queue Intel
        SELECT COALESCE(jsonb_agg(jsonb_build_object('task', task, 'pending', 0, 'running', 0, 'retry_pending', 0)), '[]'::jsonb) INTO queue_intel
        FROM public.ai_task_config;

        -- Progress Matrix Calculation
        DECLARE
            t_syn INTEGER;
            c_syn INTEGER; c_ant INTEGER; c_eg INTEGER; c_conf INTEGER;
        BEGIN
            SELECT count(*) INTO t_syn FROM public.synonym;
            SELECT count(*) INTO c_syn FROM public.synonym WHERE jsonb_array_length(synonyms) > 0;
            SELECT count(*) INTO c_ant FROM public.synonym WHERE jsonb_array_length(antonyms) > 0;
            SELECT count(*) INTO c_eg FROM public.synonym WHERE jsonb_array_length(eg_eng) > 0;
            SELECT count(*) INTO c_conf FROM public.synonym WHERE jsonb_array_length(confusable_with) > 0;

            progress_json := jsonb_build_object(
                'total_items', COALESCE(t_syn, 0),
                'tiers', jsonb_build_object(
                    'examples_complete', c_eg, 'synonyms_complete', c_syn,
                    'antonyms_complete', c_ant, 'confusables_complete', c_conf,
                    'explanation_complete', 0, 'sense_complete', 0, 'usage_complete', 0, 'scope_complete', 0,
                    'mnemonic_complete', 0, 'collocations_complete', 0, 'etymology_complete', 0, 'pronunciation_complete', 0,
                    'grammar_complete', 0, 'register_complete', 0
                )
            );
        END;

    -- =========================================================
    -- QUESTION EXTRACTION PIPELINE
    -- =========================================================
    ELSIF pipeline_name = 'question_extraction' THEN
        SELECT active INTO is_active FROM cron.job WHERE jobname = 'process_question_extraction' LIMIT 1;
        SELECT count(*) INTO queue_pending FROM pgmq.q_pre_phase_question_jobs;

        SELECT count(*) INTO req_today
        FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'extract-questions';
        edge_today := req_today;

        SELECT COALESCE(AVG(input_tokens), 0), COALESCE(AVG(output_tokens), 0) INTO avg_in, avg_out
        FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'extract-questions';

        SELECT COALESCE(jsonb_object_agg(model, count_val), '{}'::jsonb) INTO models_json
        FROM (SELECT COALESCE(model, 'unknown') as model, count(*) as count_val FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'extract-questions' GROUP BY model) sub;

        DECLARE
            t_docs INTEGER; p_docs INTEGER; r_docs INTEGER; f_docs INTEGER;
            t_pages INTEGER; p_pages INTEGER;
            t_qs INTEGER;
        BEGIN
            SELECT count(*) INTO t_docs FROM public.source_documents;
            SELECT count(*) INTO p_docs FROM public.source_documents WHERE status IN ('QUEUED', 'PROCESSING');
            SELECT count(*) INTO r_docs FROM public.source_documents WHERE status = 'AWAITING_REVIEW';
            SELECT count(*) INTO f_docs FROM public.source_documents WHERE status = 'FAILED';

            SELECT COALESCE(SUM(page_count), 0), COALESCE(SUM((extraction_progress->>'pages_completed')::integer), 0), COALESCE(SUM((extraction_progress->>'total_questions_extracted')::integer), 0)
            INTO t_pages, p_pages, t_qs
            FROM public.source_documents;

            progress_json := jsonb_build_object(
                'total_items', COALESCE(t_docs, 0),
                'tiers', jsonb_build_object(
                    'processing_docs', p_docs,
                    'awaiting_review_docs', r_docs,
                    'failed_docs', f_docs,
                    'total_pages', t_pages,
                    'pages_completed', p_pages,
                    'total_extracted_questions', t_qs
                )
            );

            queue_running := p_docs;
            queue_retry := f_docs;
            dlq_count := f_docs;

            queue_intel := jsonb_build_array(
                jsonb_build_object('task', 'extract_pdf', 'pending', queue_pending, 'running', queue_running, 'retry_pending', queue_retry)
            );
        END;

    -- =========================================================
    -- QUESTION ENRICHMENT PIPELINE
    -- =========================================================
    ELSIF pipeline_name = 'question_enrichment' THEN
        SELECT active INTO is_active FROM cron.job WHERE jobname = 'process_question_enrichment' LIMIT 1;
        SELECT count(*) INTO queue_pending FROM pgmq.q_question_ai_jobs;
        SELECT count(*) INTO dlq_count FROM pgmq.a_question_ai_jobs;

        SELECT count(*) INTO req_today FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'enrich-questions';
        edge_today := req_today;

        SELECT count(*) INTO schema_failures FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'enrich-questions' AND status_code != 200 AND (error_message ILIKE '%SCHEMA%' OR error_message ILIKE '%JSON%');
        SELECT COALESCE(AVG(input_tokens), 0), COALESCE(AVG(output_tokens), 0) INTO avg_in, avg_out FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'enrich-questions';

        SELECT COALESCE(jsonb_object_agg(model, count_val), '{}'::jsonb) INTO models_json
        FROM (SELECT COALESCE(model, 'unknown') as model, count(*) as count_val FROM public.ai_request_logs WHERE created_at >= CURRENT_DATE AND feature = 'enrich-questions' GROUP BY model) sub;

        DECLARE
            t_qs INTEGER; p_rev_qs INTEGER; app_qs INTEGER; ering_qs INTEGER; ered_qs INTEGER; f_qs INTEGER;
            q_class INTEGER; q_subj INTEGER; q_top INTEGER; q_subtop INTEGER; q_diff INTEGER; q_tags INTEGER;
            q_trans INTEGER; q_qhi INTEGER; q_ophi INTEGER;
            q_exp INTEGER; q_agent INTEGER; q_grnd INTEGER;
        BEGIN
            SELECT count(*) INTO t_qs FROM public.questions;
            SELECT count(*) INTO p_rev_qs FROM public.questions WHERE status = 'PENDING_REVIEW';
            SELECT count(*) INTO app_qs FROM public.questions WHERE status = 'APPROVED';
            SELECT count(*) INTO ering_qs FROM public.questions WHERE status IN ('ENRICHMENT_PENDING', 'ENRICHING');
            SELECT count(*) INTO ered_qs FROM public.questions WHERE status = 'ENRICHED';
            SELECT count(*) INTO f_qs FROM public.questions WHERE status = 'FAILED';

            SELECT
                COUNT(CASE WHEN (enrichment_progress->>'classification')::boolean THEN 1 END),
                COUNT(CASE WHEN subject IS NOT NULL THEN 1 END),
                COUNT(CASE WHEN topic IS NOT NULL THEN 1 END),
                COUNT(CASE WHEN "subTopic" IS NOT NULL THEN 1 END),
                COUNT(CASE WHEN difficulty IS NOT NULL THEN 1 END),
                COUNT(CASE WHEN array_length(tags, 1) > 0 THEN 1 END),
                COUNT(CASE WHEN (enrichment_progress->>'translation')::boolean THEN 1 END),
                COUNT(CASE WHEN question_hi IS NOT NULL THEN 1 END),
                COUNT(CASE WHEN jsonb_array_length(options_hi) > 0 THEN 1 END),
                COUNT(CASE WHEN (enrichment_progress->>'explanation')::boolean THEN 1 END),
                COUNT(CASE WHEN status = 'ENRICHED' THEN 1 END),
                COUNT(CASE WHEN ai_metadata->'teacher'->>'research_model' IS NOT NULL THEN 1 END)
            INTO q_class, q_subj, q_top, q_subtop, q_diff, q_tags, q_trans, q_qhi, q_ophi, q_exp, q_agent, q_grnd
            FROM public.questions WHERE status != 'DRAFT';

            queue_running := ering_qs;
            queue_retry := f_qs;

            queue_intel := jsonb_build_array(
                jsonb_build_object('task', 'enrich_cascade', 'pending', queue_pending, 'running', queue_running, 'retry_pending', queue_retry)
            );

            progress_json := jsonb_build_object(
                'total_items', COALESCE(t_qs, 0),
                'tiers', jsonb_build_object(
                    'pending_review', p_rev_qs, 'approved', app_qs, 'enriching', ering_qs, 'enriched', ered_qs, 'failed', f_qs,
                    'classification_complete', q_class, 'subject_complete', q_subj, 'topic_complete', q_top, 'subtopic_complete', q_subtop, 'difficulty_complete', q_diff, 'tags_complete', q_tags,
                    'translation_complete', q_trans, 'question_hi_complete', q_qhi, 'options_hi_complete', q_ophi,
                    'explanation_complete', q_exp, 'agentic_tutor_usage', q_agent, 'grounded_search_usage', q_grnd
                )
            );
        END;

    END IF;

    -- Return the standardized object structure
    RETURN jsonb_build_object(
        'pipeline', pipeline_name,
        'hero', jsonb_build_object(
            'is_active', COALESCE(is_active, false),
            'queue_depth', COALESCE(queue_pending, 0),
            'dlq_count', COALESCE(dlq_count, 0),
            'last_success_minutes', 0
        ),
        'queues', jsonb_build_object(
            'intelligence', queue_intel
        ),
        'progress', progress_json,
        'telemetry', jsonb_build_object(
            'requests_today', COALESCE(req_today, 0),
            'edge_invocations_today', COALESCE(edge_today, 0),
            'avg_input_tokens', COALESCE(avg_in, 0),
            'avg_output_tokens', COALESCE(avg_out, 0),
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

-- Generic pipeline freezer
CREATE OR REPLACE FUNCTION public.admin_freeze_ai_pipeline(pipeline_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
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

-- Generic pipeline resumer
CREATE OR REPLACE FUNCTION public.admin_resume_ai_pipeline(pipeline_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
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

-- Generic queue purger
CREATE OR REPLACE FUNCTION public.admin_purge_ai_queue(pipeline_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    purged_count BIGINT := 0;
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
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

-- Generic DLQ Fetcher
CREATE OR REPLACE FUNCTION public.get_ai_pipeline_dlq(pipeline_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB := '[]'::jsonb;
BEGIN
    IF (auth.jwt()->>'email') != 'admin@mindflow.com' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF pipeline_name = 'vocabulary' THEN
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', id, 'word_id', word_id, 'error_message', error_message, 'task', task, 'failed_at', failed_at, 'attempt_count', attempt_count
        ) ORDER BY failed_at DESC), '[]'::jsonb) INTO result
        FROM public.enrichment_dlq LIMIT 50;
    ELSIF pipeline_name = 'question_enrichment' THEN
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', msg_id::text, 'word_id', COALESCE(message->>'question_id', 'Unknown'), 'error_message', 'Failed cascade (Check request logs)', 'task', COALESCE(message->>'task', 'enrich_cascade'), 'failed_at', archived_at, 'attempt_count', vt
        ) ORDER BY archived_at DESC), '[]'::jsonb) INTO result
        FROM pgmq.a_question_ai_jobs LIMIT 50;
    ELSIF pipeline_name = 'question_extraction' THEN
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', msg_id::text, 'word_id', COALESCE(message->>'source_document_id', 'Unknown'), 'error_message', 'Failed extraction (Check request logs)', 'task', COALESCE(message->>'task', 'extract_pdf'), 'failed_at', archived_at, 'attempt_count', vt
        ) ORDER BY archived_at DESC), '[]'::jsonb) INTO result
        FROM pgmq.a_pre_phase_question_jobs LIMIT 50;
    END IF;

    RETURN result;
END;
$$;
