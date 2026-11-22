-- ============================================================================
-- Migration: 20261122000000_harden_mock_tests_rls_and_leaderboard.sql
-- Purpose:   Gen 1B Step 4 (v1.0.370) — Mock Tests & Admin RBAC Database
--            Security, Schedule-Window RLS, Publish Integrity & Privacy-Safe
--            Leaderboard RPC.
-- ============================================================================

BEGIN;

-- 1. Ensure RLS is enabled on all 4 Mock Test tables
ALTER TABLE public.exam_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_attempts ENABLE ROW LEVEL SECURITY;

-- 2. Add accuracy column & status constraint on public.user_test_attempts
ALTER TABLE public.user_test_attempts
  ADD COLUMN IF NOT EXISTS accuracy NUMERIC(5,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_test_attempts_status_check'
      AND conrelid = 'public.user_test_attempts'::regclass
  ) THEN
    ALTER TABLE public.user_test_attempts
      ADD CONSTRAINT user_test_attempts_status_check
      CHECK (status IN ('in_progress', 'completed', 'abandoned'));
  END IF;
END $$;

-- 3. Add publish & schedule integrity CHECK constraints on public.tests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tests_published_requires_questions_check'
      AND conrelid = 'public.tests'::regclass
  ) THEN
    ALTER TABLE public.tests
      ADD CONSTRAINT tests_published_requires_questions_check
      CHECK (
        NOT COALESCE(is_published, false)
        OR (jsonb_typeof(question_ids) = 'array' AND jsonb_array_length(question_ids) > 0)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tests_schedule_window_check'
      AND conrelid = 'public.tests'::regclass
  ) THEN
    ALTER TABLE public.tests
      ADD CONSTRAINT tests_schedule_window_check
      CHECK (
        release_date IS NULL
        OR expiry_date IS NULL
        OR expiry_date > release_date
      );
  END IF;
END $$;

-- 4. Re-assert Admin RBAC policies on all 4 tables using (SELECT public.is_admin())
ALTER POLICY "Allow admin all exam categories"
  ON public.exam_categories
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

ALTER POLICY "Allow admin all test series"
  ON public.test_series
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

ALTER POLICY "Allow admin all tests"
  ON public.tests
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

ALTER POLICY "Allow admin all user attempts"
  ON public.user_test_attempts
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 5. Harden student SELECT policies on exam_categories, test_series, and tests (DEC-0006: TO authenticated)
ALTER POLICY "Allow public read for active categories"
  ON public.exam_categories
  TO authenticated
  USING (is_active = true);

ALTER POLICY "Allow public read for published series"
  ON public.test_series
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1
      FROM public.exam_categories ec
      WHERE ec.id = test_series.category_id
        AND ec.is_active = true
    )
  );

ALTER POLICY "Allow public read for published tests"
  ON public.tests
  TO authenticated
  USING (
    is_published = true
    AND (release_date IS NULL OR release_date <= now())
    AND (expiry_date IS NULL OR expiry_date > now())
    AND EXISTS (
      SELECT 1
      FROM public.test_series ts
      JOIN public.exam_categories ec ON ec.id = ts.category_id
      WHERE ts.id = tests.series_id
        AND ts.is_published = true
        AND ec.is_active = true
    )
  );

-- 6. Remediate user_test_attempts answers JSONB leak & scope own-attempt policies TO authenticated
ALTER POLICY "Public read for leaderboard if completed"
  ON public.user_test_attempts
  TO authenticated
  USING (false);

ALTER POLICY "Users can view their own attempts"
  ON public.user_test_attempts
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert their own attempts"
  ON public.user_test_attempts
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update their own attempts"
  ON public.user_test_attempts
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 7. Privacy-Safe Leaderboard RPC (never exposes answers JSONB)
CREATE OR REPLACE FUNCTION public.get_test_leaderboard(
  p_test_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  score numeric,
  accuracy numeric,
  time_taken_seconds integer,
  completed_at timestamptz,
  is_current_user boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid := (SELECT auth.uid());
  v_is_admin boolean := COALESCE((SELECT public.is_admin()), false);
  v_safe_limit integer := GREATEST(1, LEAST(COALESCE(p_limit, 50), 100));
  v_test_visible boolean := false;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to view leaderboard';
  END IF;

  IF p_test_id IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.tests t
    LEFT JOIN public.test_series ts ON ts.id = t.series_id
    LEFT JOIN public.exam_categories ec ON ec.id = ts.category_id
    WHERE t.id = p_test_id
      AND (
        v_is_admin
        OR (
          t.is_published = true
          AND (t.release_date IS NULL OR t.release_date <= now())
          AND (t.expiry_date IS NULL OR t.expiry_date > now())
          AND ts.is_published = true
          AND ec.is_active = true
        )
      )
  ) INTO v_test_visible;

  IF NOT v_test_visible THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH best_attempts AS (
    SELECT DISTINCT ON (uta.user_id)
      uta.user_id,
      COALESCE(uta.score, 0) AS score,
      COALESCE(uta.accuracy, 0) AS accuracy,
      uta.time_taken_seconds,
      COALESCE(uta.end_time, uta.updated_at, uta.created_at) AS completed_at
    FROM public.user_test_attempts uta
    WHERE uta.test_id = p_test_id
      AND uta.status = 'completed'
      AND uta.user_id IS NOT NULL
    ORDER BY
      uta.user_id,
      COALESCE(uta.score, 0) DESC,
      uta.time_taken_seconds ASC NULLS LAST,
      COALESCE(uta.end_time, uta.updated_at, uta.created_at) ASC NULLS LAST
  )
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY
        ba.score DESC,
        ba.time_taken_seconds ASC NULLS LAST,
        ba.completed_at ASC NULLS LAST,
        ba.user_id ASC
    ) AS rank,
    ba.user_id,
    COALESCE(
      NULLIF(btrim(p.full_name), ''),
      NULLIF(btrim(p.username), ''),
      'MindFlow Aspirant'
    ) AS display_name,
    p.avatar_url,
    ba.score,
    ba.accuracy,
    ba.time_taken_seconds,
    ba.completed_at,
    (ba.user_id = v_caller_id) AS is_current_user
  FROM best_attempts ba
  LEFT JOIN public.profiles p ON p.id = ba.user_id
  ORDER BY
    ba.score DESC,
    ba.time_taken_seconds ASC NULLS LAST,
    ba.completed_at ASC NULLS LAST,
    ba.user_id ASC
  LIMIT v_safe_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_test_leaderboard(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_test_leaderboard(uuid, integer) TO authenticated;

COMMIT;
