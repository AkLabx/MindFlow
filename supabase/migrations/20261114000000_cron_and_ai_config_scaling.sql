-- ============================================================================
-- Phase 6: Cron Frequency Correction & AI Model Chain Ordering
-- 1. Updates pg_cron job 21 (reset_minute_ai_quotas) from */15 to every 1 minute
-- 2. Enforces gemini-3.1-flash-lite as primary model for question_taxonomy_v1
-- ============================================================================

SELECT cron.alter_job(
    job_id := 21,
    schedule := '* * * * *'
);

UPDATE public.ai_task_config
SET model_chain = '["gemini-3.1-flash-lite", "gemma-4-31b-it", "gemma-4-26b-a4b-it"]'::jsonb,
    batch_size = 1,
    updated_at = now()
WHERE task = 'question_taxonomy_v1';
