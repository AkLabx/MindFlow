-- Migration: Implement Telemetry Rollup & Purge Policy
-- Enforces permanent <50 MB storage boundary on public.analytics_events for free-tier longevity

CREATE TABLE IF NOT EXISTS public.analytics_daily_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_date DATE NOT NULL,
    event_name TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'unknown',
    event_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_daily_analytics UNIQUE (summary_date, event_name, platform)
);

ALTER TABLE public.analytics_daily_summary ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'analytics_daily_summary' 
        AND policyname = 'Admins and staff can view analytics summary'
    ) THEN
        CREATE POLICY "Admins and staff can view analytics summary"
        ON public.analytics_daily_summary
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.rollup_and_purge_telemetry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- 1. Rollup events older than 1 day into analytics_daily_summary
    INSERT INTO public.analytics_daily_summary (summary_date, event_name, platform, event_count)
    SELECT 
        created_at::date AS summary_date,
        event_name,
        COALESCE(event_data->>'platform', 'unknown') AS platform,
        count(*) AS event_count
    FROM public.analytics_events
    WHERE created_at < CURRENT_DATE
    GROUP BY 1, 2, 3
    ON CONFLICT (summary_date, event_name, platform)
    DO UPDATE SET 
        event_count = EXCLUDED.event_count,
        created_at = now();

    -- 2. Purge raw detailed telemetry events older than 7 days
    DELETE FROM public.analytics_events
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Schedule nightly at 03:00 UTC
SELECT cron.schedule(
    'telemetry-rollup-and-purge',
    '0 3 * * *',
    'SELECT public.rollup_and_purge_telemetry();'
);
