-- ============================================================================
-- Migration: 20261112000000_harden_db_privileges.sql
-- Description: Phase 4 Security Hardening:
--   1. Remove transitional 'admin@mindflow.com' fallback & harden RBAC functions
--   2. Move storage.objects app_assets admin policies to TO authenticated
--   3. Fix export_user_data variable shadowing & enforce auth guards on RPCs
--   4. Convert read / user-owned RPCs to SECURITY INVOKER with caller checks
--   5. Fix search_profiles_trgm PII leak & cap limit
--   6. Revoke PUBLIC/anon/authenticated EXECUTE across non-extension public functions
--      and apply explicit least-privilege GRANT allowlists
--   7. Add missing RLS policies on ai_model_runtime and deleted_question_logs
-- ============================================================================

SET statement_timeout = '30s';
SET lock_timeout = '5s';

-- ----------------------------------------------------------------------------
-- 1. Harden RBAC Functions (Remove transitional hardcoded email fallback)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = (SELECT auth.uid())
          AND role IN ('super_admin'::public.app_role, 'admin'::public.app_role)
    );
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = (SELECT auth.uid())
          AND (role = required_role OR role = 'super_admin'::public.app_role)
    );
$$;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT (
        has_role.user_id = (SELECT auth.uid())
        OR (SELECT current_user) IN ('postgres', 'service_role', 'supabase_admin')
        OR EXISTS (
            SELECT 1
            FROM public.user_roles admin_ur
            WHERE admin_ur.user_id = (SELECT auth.uid())
              AND admin_ur.role IN ('super_admin'::public.app_role, 'admin'::public.app_role)
        )
    )
    AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = has_role.user_id
          AND (ur.role = required_role OR ur.role = 'super_admin'::public.app_role)
    );
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.has_role(required_role::public.app_role);
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.has_role(user_id, required_role::public.app_role);
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS public.app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT coalesce(
        array_agg(role ORDER BY role),
        ARRAY[]::public.app_role[]
    )
    FROM public.user_roles
    WHERE user_id = (SELECT auth.uid());
$$;

-- ----------------------------------------------------------------------------
-- 2. Fix storage.objects app_assets policies (scope to authenticated, initplan)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin Insert Access for app_assets'
    ) THEN
        ALTER POLICY "Admin Insert Access for app_assets"
        ON storage.objects
        TO authenticated
        WITH CHECK (
            bucket_id = 'app_assets'::text AND (SELECT public.is_admin())
        );
    ELSE
        CREATE POLICY "Admin Insert Access for app_assets"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'app_assets'::text AND (SELECT public.is_admin())
        );
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin Update Access for app_assets'
    ) THEN
        ALTER POLICY "Admin Update Access for app_assets"
        ON storage.objects
        TO authenticated
        USING (
            bucket_id = 'app_assets'::text AND (SELECT public.is_admin())
        )
        WITH CHECK (
            bucket_id = 'app_assets'::text AND (SELECT public.is_admin())
        );
    ELSE
        CREATE POLICY "Admin Update Access for app_assets"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'app_assets'::text AND (SELECT public.is_admin())
        )
        WITH CHECK (
            bucket_id = 'app_assets'::text AND (SELECT public.is_admin())
        );
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin Delete Access for app_assets'
    ) THEN
        ALTER POLICY "Admin Delete Access for app_assets"
        ON storage.objects
        TO authenticated
        USING (
            bucket_id = 'app_assets'::text AND (SELECT public.is_admin())
        );
    ELSE
        CREATE POLICY "Admin Delete Access for app_assets"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'app_assets'::text AND (SELECT public.is_admin())
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Fix export_user_data() & harden remaining SECURITY DEFINER RPCs
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result jsonb;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT jsonb_build_object(
        'profile', (SELECT row_to_json(t) FROM (SELECT * FROM public.profiles WHERE id = v_user_id) t),
        'notification_preferences', (SELECT row_to_json(t) FROM (SELECT * FROM public.notification_preferences WHERE user_id = v_user_id) t),
        'posts', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.posts WHERE user_id = v_user_id) t),
        'post_likes', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.post_likes WHERE user_id = v_user_id) t),
        'post_comments', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.post_comments WHERE user_id = v_user_id) t),
        'reels', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.reels WHERE user_id = v_user_id) t),
        'reel_likes', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.reel_likes WHERE user_id = v_user_id) t),
        'reel_comments', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.reel_comments WHERE user_id = v_user_id) t),
        'quiz_history', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.quiz_history WHERE user_id = v_user_id) t),
        'saved_quizzes', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.saved_quizzes WHERE user_id = v_user_id) t),
        'user_answers', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_answers WHERE user_id = v_user_id) t),
        'user_bookmarks', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_bookmarks WHERE user_id = v_user_id) t),
        'user_exam_blueprints', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_exam_blueprints WHERE user_id = v_user_id) t),
        'user_ows_interactions', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_ows_interactions WHERE user_id = v_user_id) t),
        'user_idiom_interactions', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_idiom_interactions WHERE user_id = v_user_id) t),
        'following', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_followers WHERE follower_id = v_user_id) t),
        'followers', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_followers WHERE following_id = v_user_id) t),
        'chat_messages', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.chat_room_messages WHERE sender_id = v_user_id) t),
        'blocked_users', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_blocks WHERE blocker_id = v_user_id) t),
        'payments', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.payments WHERE user_id = v_user_id) t),
        'reports', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.reports WHERE reporter_id = v_user_id) t)
    ) INTO result;

    -- Replace null arrays with empty arrays
    result := (
        SELECT jsonb_object_agg(
            key,
            CASE
                WHEN value IS NULL AND key != 'profile' AND key != 'notification_preferences' THEN '[]'::jsonb
                ELSE value
            END
        )
        FROM jsonb_each(result)
    );

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
    END IF;

    UPDATE public.profiles
    SET status = 'pending_deletion',
        delete_requested_at = NOW()
    WHERE id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
    END IF;

    UPDATE public.profiles
    SET status = 'active',
        delete_requested_at = NULL
    WHERE id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.vote_explanation(p_explanation_id uuid, p_is_helpful boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
    END IF;

    IF p_is_helpful THEN
        UPDATE public.questions
        SET ask_ai_helpful_votes = COALESCE(ask_ai_helpful_votes, 0) + 1
        WHERE id = p_explanation_id;
    ELSE
        UPDATE public.questions
        SET ask_ai_unhelpful_votes = COALESCE(ask_ai_unhelpful_votes, 0) + 1
        WHERE id = p_explanation_id;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ai_ops_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_active_queue INT;
  v_waiting_capacity INT;
  v_infra_retries INT;
  v_permanent_failures INT;
  v_avg_retry_count NUMERIC;
  v_scheduler_health NUMERIC;
  v_throughput_hourly INT;
  v_avg_processing_ms INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Admin privilege required';
  END IF;

  -- 1. Active Queue Size (Jobs waiting in pgmq)
  SELECT count(*) INTO v_active_queue FROM pgmq.q_question_ai_jobs;

  -- 2. Waiting for Capacity / Infra Retries (Questions stuck in ENRICHING due to retries)
  SELECT
    count(*),
    COALESCE(ROUND(AVG((ai_metadata->>'enrichment_retries')::numeric), 2), 0)
  INTO v_waiting_capacity, v_avg_retry_count
  FROM public.questions
  WHERE status = 'ENRICHING'
    AND ai_metadata->>'enrichment_retries' IS NOT NULL;

  v_infra_retries := v_waiting_capacity;

  -- 3. Permanent Failures
  SELECT count(*) INTO v_permanent_failures
  FROM public.questions
  WHERE status = 'FAILED';

  -- 4. Scheduler Health (Average health score of active models)
  SELECT COALESCE(ROUND(AVG(health_score), 2), 0) INTO v_scheduler_health
  FROM public.ai_model_runtime
  WHERE enabled = true;

  -- 5. Throughput (Enriched questions in the last 1 hour)
  SELECT count(*) INTO v_throughput_hourly
  FROM public.questions
  WHERE status = 'ENRICHED'
    AND updated_at >= NOW() - INTERVAL '1 hour';

  -- 6. Average Processing Time (From ai_request_logs)
  SELECT COALESCE(ROUND(AVG(latency_ms)), 0) INTO v_avg_processing_ms
  FROM public.ai_request_logs
  WHERE feature = 'enrich-questions'
    AND created_at >= NOW() - INTERVAL '24 hours'
    AND status_code = 200;

  RETURN jsonb_build_object(
    'active_queue_size', v_active_queue,
    'waiting_for_capacity', v_waiting_capacity,
    'infrastructure_retries', v_infra_retries,
    'permanent_failures', v_permanent_failures,
    'avg_retry_count', v_avg_retry_count,
    'scheduler_health', v_scheduler_health,
    'throughput_per_hour', v_throughput_hourly,
    'avg_processing_ms', v_avg_processing_ms
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_candidate_live_rankings(p_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sub public.exam_submissions%ROWTYPE;
    v_total_candidates INT;
    v_overall_rank INT;
    v_cat_candidates INT;
    v_cat_rank INT;
    v_shift_candidates INT;
    v_shift_rank INT;
    v_reasoning_rank INT;
    v_gk_rank INT;
    v_math_rank INT;
    v_english_rank INT;
    v_percentile NUMERIC(5,2);
    v_stats RECORD;
BEGIN
    SELECT * INTO v_sub FROM public.exam_submissions WHERE id = p_submission_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found';
    END IF;

    -- Guard against NULL auth.uid() tri-state logic bypass
    IF auth.uid() IS NULL OR v_sub.user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Access denied: You can only query your own rank.';
    END IF;

    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE raw_score > v_sub.raw_score) + 1,
        COUNT(*) FILTER (WHERE category = v_sub.category),
        COUNT(*) FILTER (WHERE category = v_sub.category AND raw_score > v_sub.raw_score) + 1,
        COUNT(*) FILTER (WHERE shift_code = v_sub.shift_code),
        COUNT(*) FILTER (WHERE shift_code = v_sub.shift_code AND raw_score > v_sub.raw_score) + 1,
        COUNT(*) FILTER (WHERE score_reasoning > v_sub.score_reasoning) + 1,
        COUNT(*) FILTER (WHERE score_gk > v_sub.score_gk) + 1,
        COUNT(*) FILTER (WHERE score_math > v_sub.score_math) + 1,
        COUNT(*) FILTER (WHERE score_english > v_sub.score_english) + 1
    INTO
        v_total_candidates, v_overall_rank,
        v_cat_candidates, v_cat_rank,
        v_shift_candidates, v_shift_rank,
        v_reasoning_rank, v_gk_rank, v_math_rank, v_english_rank
    FROM public.exam_submissions
    WHERE exam_id = v_sub.exam_id;

    IF v_total_candidates > 1 THEN
        v_percentile := ROUND(((1.0 - ((v_overall_rank - 1)::numeric / v_total_candidates::numeric)) * 100.0), 2);
    ELSE
        v_percentile := 100.00;
    END IF;

    SELECT * INTO v_stats FROM public.exam_stats_snapshots
    WHERE exam_id = v_sub.exam_id AND shift_code IS NULL AND category IS NULL;

    RETURN jsonb_build_object(
        'overall', jsonb_build_object(
            'rank', v_overall_rank,
            'total_candidates', v_total_candidates,
            'percentile', v_percentile
        ),
        'category', jsonb_build_object(
            'category', v_sub.category,
            'rank', v_cat_rank,
            'total_candidates', v_cat_candidates
        ),
        'shift', jsonb_build_object(
            'shift_code', v_sub.shift_code,
            'shift_name', v_sub.shift_name,
            'rank', v_shift_rank,
            'total_candidates', v_shift_candidates
        ),
        'sections', jsonb_build_object(
            'reasoning_rank', v_reasoning_rank,
            'gk_rank', v_gk_rank,
            'math_rank', v_math_rank,
            'english_rank', v_english_rank
        ),
        'snapshots', jsonb_build_object(
            'mean', COALESCE(v_stats.mean_score, 0),
            'median', COALESCE(v_stats.median_score, 0),
            'stddev', COALESCE(v_stats.stddev_score, 0),
            'topper_score', COALESCE(v_stats.topper_score, 0),
            'sample_size', COALESCE(v_stats.sample_size, v_total_candidates)
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_filtered_quiz_metadata(p_last_sync_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS TABLE(id uuid, v1_id text, subject text, topic text, "subTopic" text, "examName" text, "examYear" integer, "examDateShift" text, difficulty text, "questionType" text, tags text[], updated_at timestamp with time zone, deleted_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
    END IF;

    IF p_last_sync_at IS NULL THEN
        RETURN QUERY
        SELECT
            q.id, q.v1_id, q.subject, q.topic, q."subTopic", q."examName", q."examYear", q."examDateShift", q.difficulty, q."questionType", q.tags, q.updated_at, q.deleted_at
        FROM public.questions q
        WHERE q.deleted_at IS NULL;
    ELSE
        RETURN QUERY
        SELECT
            q.id, q.v1_id, q.subject, q.topic, q."subTopic", q."examName", q."examYear", q."examDateShift", q.difficulty, q."questionType", q.tags, q.updated_at, q.deleted_at
        FROM public.questions q
        WHERE q.updated_at > p_last_sync_at

        UNION ALL

        SELECT
            t.id,
            NULL::TEXT AS v1_id,
            NULL::TEXT AS subject,
            NULL::TEXT AS topic,
            NULL::TEXT AS "subTopic",
            NULL::TEXT AS "examName",
            NULL::INTEGER AS "examYear",
            NULL::TEXT AS "examDateShift",
            NULL::TEXT AS difficulty,
            NULL::TEXT AS "questionType",
            NULL::TEXT[] AS tags,
            t.deleted_at AS updated_at,
            t.deleted_at
        FROM public.deleted_question_logs t
        WHERE t.deleted_at > p_last_sync_at;
    END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Convert Read / User-Owned RPCs to SECURITY INVOKER with caller scoping
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_blocked_users(user_uid uuid)
RETURNS TABLE(blocked_user_id uuid)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT blocked_id
    FROM public.user_blocks
    WHERE blocker_id = user_uid
      AND user_uid = (SELECT auth.uid())
    UNION
    SELECT blocker_id
    FROM public.user_blocks
    WHERE blocked_id = user_uid
      AND user_uid = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_subject_counts()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_object_agg(subject, cnt) INTO result
    FROM (
        SELECT subject, count(*) AS cnt
        FROM public.questions
        WHERE subject IS NOT NULL
          AND deleted_at IS NULL
        GROUP BY subject
    ) sub;

    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_subject_topics_summary(p_subject text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_object_agg(
    topic,
    jsonb_build_object(
      'total', total_count,
      'subtopics', subtopics_map
    )
  )
  INTO v_result
  FROM (
    SELECT
      topic,
      sum(cnt)::int AS total_count,
      jsonb_object_agg(COALESCE("subTopic", 'General'), cnt) AS subtopics_map
    FROM (
      SELECT
        topic,
        "subTopic",
        count(*)::int AS cnt
      FROM public.questions
      WHERE subject = p_subject
        AND deleted_at IS NULL
        AND topic IS NOT NULL
        AND trim(topic) <> ''
      GROUP BY topic, "subTopic"
    ) sub_counts
    GROUP BY topic
  ) topic_counts;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_subtopic_quiz_metadata(p_subject text, p_topic text, p_subtopic text)
RETURNS TABLE(id uuid, v1_id text, subject text, topic text, "subTopic" text, "examName" text, "examYear" integer, "examDateShift" text, difficulty text, "questionType" text, tags text[], updated_at timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.v1_id,
    q.subject,
    q.topic,
    q."subTopic",
    q."examName",
    q."examYear",
    q."examDateShift",
    q.difficulty,
    q."questionType",
    q.tags,
    q.updated_at
  FROM public.questions q
  WHERE q.subject = p_subject
    AND q.topic = p_topic
    AND (
      (p_subtopic IS NULL AND (q."subTopic" IS NULL OR q."subTopic" = ''))
      OR (p_subtopic IS NOT NULL AND (q."subTopic" = p_subtopic OR (p_subtopic = 'General' AND (q."subTopic" IS NULL OR q."subTopic" = ''))))
    )
    AND q.deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_marks_distribution(p_exam_id text, p_scope_type text DEFAULT 'overall'::text, p_scope_key text DEFAULT 'all'::text, p_section_id text DEFAULT 'total'::text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT jsonb_build_object(
        'exam_id', p_exam_id,
        'scope_type', p_scope_type,
        'scope_key', p_scope_key,
        'section_id', p_section_id,
        'bins', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'marks', (marks_x2::numeric / 2.0),
                        'cnt', cnt,
                        'cum_below', cumulative_below,
                        'cum_above', cumulative_above
                    ) ORDER BY marks_x2 ASC
                )
                FROM public.exam_score_distribution
                WHERE exam_id = p_exam_id
                  AND scope_type = p_scope_type
                  AND scope_key = p_scope_key
                  AND section_id = p_section_id
            ),
            '[]'::jsonb
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.get_shift_averages(p_exam_id text, p_dimension text DEFAULT 'shift'::text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_rows JSONB;
BEGIN
    IF p_dimension = 'shift' THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'shift_code', shift_code,
                'exam_date', exam_date,
                'shift_label', shift_label,
                'shift_time', shift_time,
                'n', n,
                'mean', mean,
                'difficulty_rank', difficulty_rank
            ) ORDER BY difficulty_rank ASC
        ) INTO v_rows
        FROM public.exam_shift_directory
        WHERE exam_id = p_exam_id;
    ELSIF p_dimension IN ('category', 'gender') THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'key', scope_key,
                'n', n,
                'mean', mean,
                'median', median,
                'max', max
            ) ORDER BY mean DESC
        ) INTO v_rows
        FROM public.exam_scope_stats
        WHERE exam_id = p_exam_id AND scope_type = p_dimension AND section_id = 'total';
    ELSE
        RAISE EXCEPTION 'Invalid dimension: %. Supported dimensions are shift, category, gender.', p_dimension;
    END IF;

    RETURN jsonb_build_object(
        'exam_id', p_exam_id,
        'dimension', p_dimension,
        'items', COALESCE(v_rows, '[]'::jsonb)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_filtered_idiom_metadata(p_user_id uuid)
RETURNS TABLE(id text, phrase text, source_pdf text, exam_year text, difficulty text, image_url text, is_read boolean, status text, next_review_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT
        i.id::TEXT AS id,
        i.phrase,
        i.source_pdf,
        i.exam_year::TEXT AS exam_year,
        i.difficulty,
        i.image_url,
        u.is_read,
        u.status::TEXT AS status,
        u.next_review_at
    FROM public.idiom i
    LEFT JOIN public.user_idiom_interactions u
      ON u.idiom_id = i.id::TEXT
     AND u.user_id = (SELECT auth.uid())
     AND (p_user_id IS NULL OR p_user_id = (SELECT auth.uid()))
    WHERE (SELECT auth.uid()) IS NOT NULL
      AND (p_user_id IS NULL OR p_user_id = (SELECT auth.uid()));
$$;

CREATE OR REPLACE FUNCTION public.get_filtered_idiom_metadata(p_user_id uuid, p_last_sync timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS TABLE(id text, phrase text, source_pdf text, exam_year text, difficulty text, image_url text, is_read boolean, status text, next_review_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT
        i.id::TEXT AS id,
        i.phrase,
        i.source_pdf,
        i.exam_year::TEXT AS exam_year,
        i.difficulty,
        i.image_url,
        u.is_read,
        u.status::TEXT AS status,
        u.next_review_at
    FROM public.idiom i
    LEFT JOIN public.user_idiom_interactions u
      ON u.idiom_id = i.id::TEXT
     AND u.user_id = (SELECT auth.uid())
     AND (p_user_id IS NULL OR p_user_id = (SELECT auth.uid()))
    WHERE (SELECT auth.uid()) IS NOT NULL
      AND (p_user_id IS NULL OR p_user_id = (SELECT auth.uid()))
      AND (
          (p_last_sync IS NULL)
          OR (i.updated_at > p_last_sync)
          OR (u.updated_at > p_last_sync)
      );
$$;

CREATE OR REPLACE FUNCTION public.get_filtered_ows_metadata(p_user_id uuid)
RETURNS TABLE(id text, word text, source_pdf text, exam_year text, difficulty text, theme text, image_url text, is_read boolean, status text, next_review_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT
        o.id::TEXT AS id,
        o.word,
        o.source_pdf,
        o.exam_year::TEXT AS exam_year,
        o.difficulty,
        o.theme,
        o.image_url,
        u.is_read,
        u.status::TEXT AS status,
        u.next_review_at
    FROM public.ows o
    LEFT JOIN public.user_ows_interactions u
      ON u.ows_id = o.id
     AND u.user_id = (SELECT auth.uid())
     AND (p_user_id IS NULL OR p_user_id = (SELECT auth.uid()))
    WHERE (SELECT auth.uid()) IS NOT NULL
      AND (p_user_id IS NULL OR p_user_id = (SELECT auth.uid()));
$$;

CREATE OR REPLACE FUNCTION public.get_filtered_ows_metadata(p_user_id uuid, p_last_sync timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS TABLE(id text, word text, source_pdf text, exam_year text, difficulty text, theme text, image_url text, is_read boolean, status text, next_review_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT
        o.id::TEXT AS id,
        o.word,
        o.source_pdf,
        o.exam_year::TEXT AS exam_year,
        o.difficulty,
        o.theme,
        o.image_url,
        u.is_read,
        u.status::TEXT AS status,
        u.next_review_at
    FROM public.ows o
    LEFT JOIN public.user_ows_interactions u
      ON u.ows_id = o.id
     AND u.user_id = (SELECT auth.uid())
     AND (p_user_id IS NULL OR p_user_id = (SELECT auth.uid()))
    WHERE (SELECT auth.uid()) IS NOT NULL
      AND (p_user_id IS NULL OR p_user_id = (SELECT auth.uid()))
      AND (
          (p_last_sync IS NULL)
          OR (o.updated_at > p_last_sync)
          OR (u.updated_at > p_last_sync)
      );
$$;

CREATE OR REPLACE FUNCTION public.get_filtered_synonym_metadata(p_user_id uuid, p_last_sync timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS TABLE(id text, word text, is_read boolean, status text, next_review_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT
        s.id::TEXT AS id,
        s.word,
        u.is_read,
        u.status::TEXT AS status,
        u.next_review_at
    FROM public.synonym s
    LEFT JOIN public.user_synonym_interactions u
      ON u.word_id = s.id
     AND u.user_id = (SELECT auth.uid())
     AND (p_user_id IS NULL OR p_user_id = (SELECT auth.uid()))
    WHERE (SELECT auth.uid()) IS NOT NULL
      AND (p_user_id IS NULL OR p_user_id = (SELECT auth.uid()))
      AND (
          (p_last_sync IS NULL)
          OR (s.updated_at > p_last_sync)
          OR (u.updated_at > p_last_sync)
      );
$$;

CREATE OR REPLACE FUNCTION public.get_user_performance_metrics()
RETURNS TABLE(total_quizzes bigint, total_correct bigint, total_incorrect bigint, total_skipped bigint, total_time_spent double precision, total_questions bigint, average_accuracy double precision, subject_stats jsonb)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
  END IF;

  RETURN QUERY
  WITH user_history AS (
    SELECT *
    FROM public.quiz_history
    WHERE user_id = v_user_id
      AND deleted_at IS NULL
  ),
  aggregated_metrics AS (
    SELECT
      COUNT(id)::BIGINT AS total_quizzes,
      COALESCE(SUM(total_correct), 0)::BIGINT AS total_correct,
      COALESCE(SUM(total_incorrect), 0)::BIGINT AS total_incorrect,
      COALESCE(SUM(total_skipped), 0)::BIGINT AS total_skipped,
      COALESCE(SUM(total_time_spent), 0)::FLOAT AS total_time_spent,
      COALESCE(SUM(total_questions), 0)::BIGINT AS total_questions
    FROM user_history
  ),
  unnested_stats AS (
    SELECT
      key AS subject_name,
      (value->>'attempted')::INT AS attempted,
      (value->>'correct')::INT AS correct,
      (value->>'incorrect')::INT AS incorrect,
      (value->>'skipped')::INT AS skipped
    FROM user_history, jsonb_each(subject_stats)
  ),
  merged_stats AS (
    SELECT
      subject_name,
      jsonb_build_object(
        'attempted', COALESCE(SUM(attempted), 0),
        'correct', COALESCE(SUM(correct), 0),
        'incorrect', COALESCE(SUM(incorrect), 0),
        'skipped', COALESCE(SUM(skipped), 0)
      ) AS stats
    FROM unnested_stats
    GROUP BY subject_name
  )
  SELECT
    am.total_quizzes,
    am.total_correct,
    am.total_incorrect,
    am.total_skipped,
    am.total_time_spent,
    am.total_questions,
    CASE
      WHEN am.total_questions > 0 THEN
        (am.total_correct::FLOAT / am.total_questions::FLOAT) * 100
      ELSE 0::FLOAT
    END AS average_accuracy,
    COALESCE(
      (SELECT jsonb_object_agg(subject_name, stats) FROM merged_stats),
      '{}'::jsonb
    ) AS subject_stats
  FROM aggregated_metrics am;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_user_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
  END IF;

  UPDATE public.quiz_history
  SET deleted_at = NOW()
  WHERE user_id = v_user_id
    AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_blueprint_questions(p_user_id uuid, p_blueprint_id uuid, p_queries jsonb)
RETURNS TABLE(question_id uuid, subject text, topic text, difficulty text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_id uuid := auth.uid();
    query_obj JSONB;
    v_subject TEXT;
    v_topic TEXT;
    v_subtopic TEXT;
    v_difficulty TEXT;
    v_limit INT;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
    END IF;

    IF p_user_id IS NOT NULL AND p_user_id <> v_caller_id THEN
        RAISE EXCEPTION 'Forbidden: Cannot query blueprint questions for another user';
    END IF;

    FOR query_obj IN SELECT * FROM jsonb_array_elements(p_queries)
    LOOP
        v_subject := query_obj->>'subject';
        v_topic := query_obj->>'topic';
        v_subtopic := query_obj->>'subTopic';
        v_difficulty := query_obj->>'difficulty';
        v_limit := LEAST(GREATEST(COALESCE((query_obj->>'limit')::INT, 10), 1), 200);

        RETURN QUERY
        SELECT
            q.id,
            q.subject,
            q.topic,
            q.difficulty
        FROM public.questions q
        WHERE
            q.deleted_at IS NULL
            AND (v_subject IS NULL OR q.subject = v_subject)
            AND (v_topic IS NULL OR q.topic = v_topic)
            AND (v_subtopic IS NULL OR q."subTopic" = v_subtopic)
            AND (v_difficulty IS NULL OR v_difficulty = 'All' OR q.difficulty = v_difficulty)
            AND q.id NOT IN (
                SELECT bsq.question_id
                FROM public.blueprint_seen_questions bsq
                WHERE bsq.user_id = v_caller_id
                  AND bsq.blueprint_id = p_blueprint_id
            )
        ORDER BY RANDOM()
        LIMIT v_limit;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_profiles_trgm(search_query text, limit_num integer DEFAULT 20)
RETURNS TABLE(id uuid, full_name text, username text, avatar_url text, similarity real)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT
        p.id,
        p.full_name,
        p.username,
        p.avatar_url,
        GREATEST(
            similarity(COALESCE(p.full_name, ''), search_query),
            similarity(COALESCE(p.username, ''), search_query)
        ) AS similarity
    FROM public.profiles p
    WHERE (p.full_name % search_query OR p.username % search_query)
    ORDER BY similarity DESC
    LIMIT LEAST(GREATEST(COALESCE(limit_num, 20), 1), 50);
$$;

CREATE OR REPLACE FUNCTION public.get_filtered_posts_for_user(p_user_id uuid, p_following_ids uuid[], p_limit integer, p_cursor timestamp with time zone)
RETURNS SETOF public.posts
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_id uuid := auth.uid();
    v_safe_limit integer := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
    END IF;

    IF array_length(p_following_ids, 1) > 0 THEN
        RETURN QUERY
        SELECT p.*
        FROM public.posts p
        WHERE p.user_id = ANY(p_following_ids)
          AND p.is_hidden_by_admin = FALSE
          AND (p_cursor IS NULL OR p.created_at < p_cursor)
          AND NOT EXISTS (
              SELECT 1 FROM public.reports r WHERE r.target_id = p.id AND r.reporter_id = v_caller_id
          )
        ORDER BY p.created_at DESC
        LIMIT v_safe_limit;
    ELSE
        RETURN QUERY
        SELECT p.*
        FROM public.posts p
        WHERE p.is_hidden_by_admin = FALSE
          AND (p_cursor IS NULL OR p.created_at < p_cursor)
          AND NOT EXISTS (
              SELECT 1 FROM public.reports r WHERE r.target_id = p.id AND r.reporter_id = v_caller_id
          )
        ORDER BY p.created_at DESC
        LIMIT v_safe_limit;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_filtered_reels_for_user(p_user_id uuid, p_limit integer, p_cursor timestamp with time zone)
RETURNS SETOF public.reels
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_id uuid := auth.uid();
    v_safe_limit integer := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
    END IF;

    RETURN QUERY
    SELECT r.*
    FROM public.reels r
    WHERE r.is_hidden_by_admin = FALSE
      AND (p_cursor IS NULL OR r.created_at < p_cursor)
      AND NOT EXISTS (
          SELECT 1 FROM public.reports rep WHERE rep.target_id = r.id AND rep.reporter_id = v_caller_id
      )
    ORDER BY r.created_at DESC
    LIMIT v_safe_limit;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Least-Privilege Function Execution ACLs across public schema
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_fn RECORD;
BEGIN
    FOR v_fn IN
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
        WHERE n.nspname = 'public'
          AND p.prokind = 'f'
          AND d.objid IS NULL
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated;', v_fn.sig);
    END LOOP;
END $$;

-- 5a. SECURITY INVOKER public catalog/analytics/RLS helpers (anon + authenticated)
GRANT EXECUTE ON FUNCTION public.get_blocked_users(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_subject_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_subject_topics_summary(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_subtopic_quiz_metadata(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marks_distribution(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shift_averages(text, text) TO anon, authenticated;

-- 5b. SECURITY INVOKER authenticated RPCs
GRANT EXECUTE ON FUNCTION public.get_filtered_idiom_metadata(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_filtered_idiom_metadata(uuid, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_filtered_ows_metadata(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_filtered_ows_metadata(uuid, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_filtered_synonym_metadata(uuid, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_performance_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_user_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_blueprint_questions(uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles_trgm(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_filtered_posts_for_user(uuid, uuid[], integer, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_filtered_reels_for_user(uuid, integer, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contextual_filter_counts(text[], text[], text[], text[], text[], text[], integer[], text[], text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contextual_filter_counts(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dependent_values(text, text[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_distinct_tags() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_distinct_values(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_random_questions(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reels_feed(integer, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_questions(extensions.vector, double precision, integer) TO authenticated;

-- 5c. RBAC helpers (authenticated only; never anon)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_roles() TO authenticated;

-- 5d. User transactional SECURITY DEFINER RPCs (authenticated only)
GRANT EXECUTE ON FUNCTION public.create_quiz_session(uuid, uuid, text, bigint, jsonb, text, jsonb, public.quiz_question_input[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_quiz_session(uuid, jsonb, integer, integer, integer, integer, double precision, double precision, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_question_interactions(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_user_question_mastery() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clone_shared_quiz(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_user_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.vote_explanation(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_filtered_quiz_metadata(timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_candidate_live_rankings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_result_dashboard(uuid) TO authenticated;

-- 5e. Admin-guarded SECURITY DEFINER RPCs (authenticated only; checked via is_admin() / has_role() inside body)
GRANT EXECUTE ON FUNCTION public.get_ai_ops_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_enqueue_manual_job(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_freeze_ai_pipeline(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_freeze_pipeline() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_freeze_pipeline(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_nuclear_reset() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_nuclear_reset(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_override_explanation(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_purge_ai_queue(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_purge_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_purge_queue(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resume_ai_pipeline(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resume_pipeline() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resume_pipeline(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_all_dlq() TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_dlq_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_content_by_admin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.emergency_stop_pipeline() TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_extraction_job(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_manual_batch() TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_single_record(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_pipeline_dashboard_metrics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_pipeline_dlq(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_enrichment_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_enrichment_dashboard_metrics_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_enrichment_dlq() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pipeline_timeline() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_prompt_registry_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_word_lineage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_content_by_admin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_pipeline() TO authenticated;
GRANT EXECUTE ON FUNCTION public.retry_dlq_job(uuid) TO authenticated;

-- 5f. Backend / Edge Function RPCs (service_role only)
GRANT EXECUTE ON FUNCTION public.bulk_enrich_synonyms(jsonb, bigint[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.bulk_queue_questions() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_quota(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_live_audio_quota(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_from_queue(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_scheduled_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.fix_question_sequences() TO service_role;
GRANT EXECUTE ON FUNCTION public.flush_live_audio_usage(uuid, integer, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_execution_plan(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_next_enrichment_batch() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_enrichment_queue() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_extraction_queue() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_question_enrichment_queue() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_taxonomy_queue() TO service_role;
GRANT EXECUTE ON FUNCTION public.read_from_queue(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_exam_stats_snapshot(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_result_dashboard_analytics(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.report_execution_result(text, text, integer, integer, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.report_execution_result(character varying, character varying, integer, integer, character varying, character varying, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_daily_ai_quotas() TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_daily_limits() TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_minute_ai_quotas() TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_enrichment_queue() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_cgl_questions(jsonb) TO service_role;

-- ----------------------------------------------------------------------------
-- 6. Add Missing RLS Policies on ai_model_runtime and deleted_question_logs
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_model_runtime') THEN
        ALTER TABLE public.ai_model_runtime ENABLE ROW LEVEL SECURITY;
        IF EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'ai_model_runtime' AND policyname = 'Admin manage ai_model_runtime'
        ) THEN
            ALTER POLICY "Admin manage ai_model_runtime" ON public.ai_model_runtime
            TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
        ELSE
            CREATE POLICY "Admin manage ai_model_runtime" ON public.ai_model_runtime
            FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deleted_question_logs') THEN
        ALTER TABLE public.deleted_question_logs ENABLE ROW LEVEL SECURITY;
        IF EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'deleted_question_logs' AND policyname = 'Admin view deleted_question_logs'
        ) THEN
            ALTER POLICY "Admin view deleted_question_logs" ON public.deleted_question_logs
            TO authenticated USING ((SELECT public.is_admin()));
        ELSE
            CREATE POLICY "Admin view deleted_question_logs" ON public.deleted_question_logs
            FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
        END IF;
    END IF;
END $$;
