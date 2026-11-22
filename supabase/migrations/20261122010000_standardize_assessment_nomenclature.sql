-- ============================================================================
-- Migration: 20261122010000_standardize_assessment_nomenclature.sql
-- Version:   v1.0.370.1 (Gen 1B Step 4B — Approved Option A)
-- Purpose:   1. Non-destructively rename Preset Mock Tests tables to mock_*
--               and Custom Student Quizzes tables to quiz_*.
--            2. Add self-documenting COMMENT ON TABLE metadata across all 18
--               assessment and adjacent tables.
--            3. Atomically update all 10 live PostgreSQL functions referencing
--               the renamed tables (plus get_mock_test_leaderboard alias) with
--               strict SECURITY DEFINER search_path and role ACL enforcement.
-- Note:      Zero DROP statements. All OIDs, data, indexes, FKs, triggers,
--            CHECK constraints, and RLS policies are preserved in-place.
-- ============================================================================

-- 1. Block A — Admin-Prepared Preset Mock Tests (mock_*)
ALTER TABLE IF EXISTS public.exam_categories RENAME TO mock_categories;
ALTER TABLE IF EXISTS public.test_series RENAME TO mock_series;
ALTER TABLE IF EXISTS public.tests RENAME TO mock_tests;
ALTER TABLE IF EXISTS public.user_test_attempts RENAME TO mock_test_attempts;

-- 2. Block B — Custom Student Quizzes (quiz_*)
ALTER TABLE IF EXISTS public.saved_quizzes RENAME TO quiz_sessions;
ALTER TABLE IF EXISTS public.bridge_saved_quiz_questions RENAME TO quiz_session_questions;
ALTER TABLE IF EXISTS public.quiz_history RENAME TO quiz_session_results;

-- 3. Self-Documenting Table Comments for Supabase Dashboard Table Editor
COMMENT ON TABLE public.mock_categories IS
  '[Mock Tests Block A] Top-level exam categories (e.g., BPSC, SSC CGL) managed via Admin Mock Tests CMS.';
COMMENT ON TABLE public.mock_series IS
  '[Mock Tests Block A] Admin-curated test series grouped under mock_categories.';
COMMENT ON TABLE public.mock_tests IS
  '[Mock Tests Block A] Admin-prepared preset timed mock tests containing curated question_ids, marking schemes, and schedule windows.';
COMMENT ON TABLE public.mock_test_attempts IS
  '[Mock Tests Block A] Student attempt lifecycle, scores, accuracy, time taken, and private answers JSONB for preset mock_tests.';

COMMENT ON TABLE public.quiz_sessions IS
  '[Custom Quizzes Block B] Student-generated custom practice and learning quiz sessions (active, paused, and completed state).';
COMMENT ON TABLE public.quiz_session_questions IS
  '[Custom Quizzes Block B] Ordered question mapping bridge (quiz_id, question_id, sort_order) for custom quiz_sessions.';
COMMENT ON TABLE public.quiz_session_results IS
  '[Custom Quizzes Block B] Completed custom quiz summary records, accuracy metrics, and per-subject performance breakdowns.';

COMMENT ON TABLE public.questions IS
  '[Core Question Bank] Master repository of bilingual MCQ questions powering both preset mock_tests and custom quiz_sessions.';
COMMENT ON TABLE public.user_question_mastery IS
  '[Adaptive Mastery Engine] Per-user, per-question spaced-repetition mastery tiers, vulnerability indices, and review schedules.';
COMMENT ON TABLE public.subject_metadata_cache IS
  '[Core Question Bank] Cached distinct subject, topic, sub-topic, and exam filter metadata for instant quiz & builder hydration.';

COMMENT ON TABLE public.user_exam_blueprints IS
  '[Exam Blueprints] Saved custom exam blueprint configurations for targeted multi-topic practice generation.';
COMMENT ON TABLE public.blueprint_seen_questions IS
  '[Exam Blueprints] Tracking ledger of questions already served to a user within an exam blueprint cycle.';

COMMENT ON TABLE public.exam_configs IS
  '[Answer Key & Ranker Engine] Official exam configuration schemas for OMR / response-sheet score evaluation.';
COMMENT ON TABLE public.exam_submissions IS
  '[Answer Key & Ranker Engine] User-submitted exam response sheets and calculated raw/normalized scores.';
COMMENT ON TABLE public.exam_section_results IS
  '[Answer Key & Ranker Engine] Section-wise score and accuracy breakdown for evaluated exam_submissions.';
COMMENT ON TABLE public.exam_stats_snapshots IS
  '[Answer Key & Ranker Engine] Aggregated percentile, rank, and cutoff statistical snapshots across exam_submissions.';
COMMENT ON TABLE public.official_answer_keys IS
  '[Answer Key & Ranker Engine] Official answer key mappings and objection metadata linked to exam_configs.';

COMMENT ON TABLE public.user_answers IS
  '[DEPRECATED - Legacy Unused] Historical per-answer log superseded by quiz_sessions.state, quiz_session_results, and mock_test_attempts.';

-- 4. Atomic Update of All 10 Live PostgreSQL Functions

-- 4.1 public.get_test_leaderboard
CREATE OR REPLACE FUNCTION public.get_test_leaderboard(p_test_id uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(
   rank bigint,
   user_id uuid,
   display_name text,
   avatar_url text,
   score numeric,
   accuracy numeric,
   time_taken_seconds integer,
   completed_at timestamp with time zone,
   is_current_user boolean
 )
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    FROM public.mock_tests t
    LEFT JOIN public.mock_series ts ON ts.id = t.series_id
    LEFT JOIN public.mock_categories ec ON ec.id = ts.category_id
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
    FROM public.mock_test_attempts uta
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
$function$;

REVOKE ALL ON FUNCTION public.get_test_leaderboard(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_test_leaderboard(uuid, integer) TO authenticated, service_role;

-- 4.1b Canonical alias public.get_mock_test_leaderboard
CREATE OR REPLACE FUNCTION public.get_mock_test_leaderboard(p_test_id uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(
   rank bigint,
   user_id uuid,
   display_name text,
   avatar_url text,
   score numeric,
   accuracy numeric,
   time_taken_seconds integer,
   completed_at timestamp with time zone,
   is_current_user boolean
 )
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT * FROM public.get_test_leaderboard(p_test_id, p_limit);
$function$;

REVOKE ALL ON FUNCTION public.get_mock_test_leaderboard(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mock_test_leaderboard(uuid, integer) TO authenticated, service_role;

-- 4.2 public.create_quiz_session
CREATE OR REPLACE FUNCTION public.create_quiz_session(
  p_quiz_id uuid,
  p_user_id uuid,
  p_name text,
  p_created_at bigint,
  p_filters jsonb,
  p_mode text,
  p_state jsonb,
  p_questions public.quiz_question_input[]
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_caller_id uuid := auth.uid();
    q public.quiz_question_input;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
    END IF;

    IF p_user_id IS NOT NULL AND p_user_id <> v_caller_id THEN
        RAISE EXCEPTION 'Forbidden: Cannot create quiz sessions for another user';
    END IF;

    INSERT INTO public.quiz_sessions (
        id,
        user_id,
        name,
        created_at,
        filters,
        mode,
        state
    ) VALUES (
        p_quiz_id,
        v_caller_id,
        p_name,
        p_created_at,
        p_filters,
        p_mode,
        p_state
    );

    IF p_questions IS NOT NULL THEN
        FOREACH q IN ARRAY p_questions LOOP
            INSERT INTO public.quiz_session_questions (
                quiz_id,
                question_id,
                user_id,
                sort_order
            ) VALUES (
                p_quiz_id,
                q.question_id,
                v_caller_id,
                q.sort_order
            );
        END LOOP;
    END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_quiz_session(uuid, uuid, text, bigint, jsonb, text, jsonb, public.quiz_question_input[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_quiz_session(uuid, uuid, text, bigint, jsonb, text, jsonb, public.quiz_question_input[]) TO authenticated, service_role;

-- 4.3 public.submit_quiz_session
CREATE OR REPLACE FUNCTION public.submit_quiz_session(
  p_quiz_id uuid,
  p_final_state jsonb,
  p_total_questions integer,
  p_total_correct integer,
  p_total_incorrect integer,
  p_total_skipped integer,
  p_time_taken double precision,
  p_overall_accuracy double precision,
  p_difficulty text,
  p_subject_stats jsonb
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_history_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to submit a quiz session';
    END IF;

    IF jsonb_typeof(p_final_state) != 'object' THEN
        RAISE EXCEPTION 'Invalid JSONB payload for final state';
    END IF;

    UPDATE public.quiz_sessions
    SET
        state = p_final_state,
        status = 'result',
        completed_at = now()
    WHERE
        id = p_quiz_id
        AND user_id = v_user_id
        AND status IS DISTINCT FROM 'result';

    v_history_id := gen_random_uuid();

    INSERT INTO public.quiz_session_results (
        id,
        quiz_id,
        user_id,
        date,
        total_questions,
        total_correct,
        total_incorrect,
        total_skipped,
        total_time_spent,
        overall_accuracy,
        difficulty,
        subject_stats
    ) VALUES (
        v_history_id,
        p_quiz_id,
        v_user_id,
        (extract(epoch from now()) * 1000)::bigint,
        p_total_questions,
        p_total_correct,
        p_total_incorrect,
        p_total_skipped,
        p_time_taken,
        p_overall_accuracy,
        p_difficulty,
        COALESCE(p_subject_stats, '{}'::jsonb)
    )
    ON CONFLICT (quiz_id, user_id)
    DO UPDATE SET
        date = (extract(epoch from now()) * 1000)::bigint,
        total_questions = EXCLUDED.total_questions,
        total_correct = EXCLUDED.total_correct,
        total_incorrect = EXCLUDED.total_incorrect,
        total_skipped = EXCLUDED.total_skipped,
        total_time_spent = EXCLUDED.total_time_spent,
        overall_accuracy = EXCLUDED.overall_accuracy,
        difficulty = EXCLUDED.difficulty,
        subject_stats = EXCLUDED.subject_stats
    RETURNING id INTO v_history_id;

    RETURN v_history_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_quiz_session(uuid, jsonb, integer, integer, integer, integer, double precision, double precision, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_quiz_session(uuid, jsonb, integer, integer, integer, integer, double precision, double precision, text, jsonb) TO authenticated, service_role;

-- 4.4 public.clone_shared_quiz
CREATE OR REPLACE FUNCTION public.clone_shared_quiz(
  p_original_quiz_id uuid,
  p_name_suffix text DEFAULT ' (Shared)'::text
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_new_quiz_id uuid;
    v_original_quiz public.quiz_sessions%ROWTYPE;
    v_user_id uuid := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to clone a quiz';
    END IF;

    SELECT * INTO v_original_quiz
    FROM public.quiz_sessions
    WHERE id = p_original_quiz_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Original quiz not found';
    END IF;

    IF v_original_quiz.user_id = v_user_id THEN
        RETURN json_build_object(
            'new_quiz_id', p_original_quiz_id,
            'mode', v_original_quiz.mode
        );
    END IF;

    v_new_quiz_id := gen_random_uuid();

    INSERT INTO public.quiz_sessions (
        id,
        user_id,
        name,
        created_at,
        filters,
        mode,
        state
    ) VALUES (
        v_new_quiz_id,
        v_user_id,
        v_original_quiz.name || p_name_suffix,
        (extract(epoch from now()) * 1000)::bigint,
        v_original_quiz.filters,
        v_original_quiz.mode,
        jsonb_build_object(
            'currentQuestionIndex', 0,
            'score', 0,
            'answers', '{}'::jsonb,
            'timeTaken', '{}'::jsonb,
            'remainingTimes', '{}'::jsonb,
            'quizTimeRemaining', 0,
            'bookmarks', '[]'::jsonb,
            'markedForReview', '[]'::jsonb,
            'hiddenOptions', '{}'::jsonb,
            'isPaused', false,
            'status', 'quiz',
            'mode', v_original_quiz.mode,
            'quizId', v_new_quiz_id
        )
    );

    INSERT INTO public.quiz_session_questions (
        quiz_id,
        question_id,
        user_id,
        sort_order
    )
    SELECT
        v_new_quiz_id,
        question_id,
        v_user_id,
        sort_order
    FROM public.quiz_session_questions
    WHERE quiz_id = p_original_quiz_id;

    RETURN json_build_object(
        'new_quiz_id', v_new_quiz_id,
        'mode', v_original_quiz.mode
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.clone_shared_quiz(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clone_shared_quiz(uuid, text) TO authenticated, service_role;

-- 4.5 public.export_user_data
CREATE OR REPLACE FUNCTION public.export_user_data()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
        'quiz_history', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.quiz_session_results WHERE user_id = v_user_id) t),
        'quiz_session_results', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.quiz_session_results WHERE user_id = v_user_id) t),
        'saved_quizzes', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.quiz_sessions WHERE user_id = v_user_id) t),
        'quiz_sessions', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.quiz_sessions WHERE user_id = v_user_id) t),
        'mock_test_attempts', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.mock_test_attempts WHERE user_id = v_user_id) t),
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
$function$;

REVOKE ALL ON FUNCTION public.export_user_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.export_user_data() TO authenticated, service_role;

-- 4.6 public.backfill_user_question_mastery
CREATE OR REPLACE FUNCTION public.backfill_user_question_mastery()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_quiz RECORD;
    v_state JSONB;
    v_answers JSONB;
    v_q_id_text TEXT;
    v_ans TEXT;
    v_q RECORD;
    v_interactions JSONB := '[]'::jsonb;
    v_is_correct BOOLEAN;
    v_total_backfilled INT := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to backfill mastery';
    END IF;

    FOR v_quiz IN
        SELECT sq.id, sq.state
        FROM public.quiz_sessions sq
        WHERE sq.user_id = v_user_id
          AND sq.state IS NOT NULL
          AND sq.state ? 'answers'
        ORDER BY sq.created_at ASC
    LOOP
        v_state := v_quiz.state;
        v_answers := v_state->'answers';

        FOR v_q_id_text, v_ans IN SELECT key, value FROM jsonb_each_text(v_answers)
        LOOP
            IF v_q_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                SELECT id, subject, topic, correct, difficulty INTO v_q
                FROM public.questions
                WHERE id = v_q_id_text::UUID;

                IF FOUND AND v_ans IS NOT NULL AND v_ans != '' THEN
                    v_is_correct := (v_ans = v_q.correct);
                    v_interactions := v_interactions || jsonb_build_object(
                        'question_id', v_q.id,
                        'subject', COALESCE(v_q.subject, 'General'),
                        'topic', v_q.topic,
                        'difficulty', COALESCE(v_q.difficulty, 'Medium'),
                        'is_correct', v_is_correct,
                        'selected_option', v_ans,
                        'correct_option', v_q.correct,
                        'quiz_id', v_quiz.id
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    IF jsonb_array_length(v_interactions) > 0 THEN
        PERFORM public.record_question_interactions(v_interactions);
        v_total_backfilled := jsonb_array_length(v_interactions);
    END IF;

    RETURN jsonb_build_object('success', true, 'backfilled_interactions', v_total_backfilled);
END;
$function$;

REVOKE ALL ON FUNCTION public.backfill_user_question_mastery() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.backfill_user_question_mastery() TO authenticated, service_role;

-- 4.7 public.cleanup_orphaned_bridge_rows
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_bridge_rows()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM public.quiz_session_questions
  WHERE quiz_id = NEW.id;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.cleanup_orphaned_bridge_rows() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_bridge_rows() TO service_role;

-- 4.8 public.get_user_performance_metrics
CREATE OR REPLACE FUNCTION public.get_user_performance_metrics()
 RETURNS TABLE(
   total_quizzes bigint,
   total_correct bigint,
   total_incorrect bigint,
   total_skipped bigint,
   total_time_spent double precision,
   total_questions bigint,
   average_accuracy double precision,
   subject_stats jsonb
 )
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
  END IF;

  RETURN QUERY
  WITH user_history AS (
    SELECT *
    FROM public.quiz_session_results
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
$function$;

REVOKE ALL ON FUNCTION public.get_user_performance_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_performance_metrics() TO authenticated, service_role;

-- 4.9 public.record_question_interactions
CREATE OR REPLACE FUNCTION public.record_question_interactions(p_interactions jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_now TIMESTAMPTZ := now();
    v_processed_count INT := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to record question interactions';
    END IF;

    IF p_interactions IS NULL OR jsonb_typeof(p_interactions) <> 'array' OR jsonb_array_length(p_interactions) = 0 THEN
        RETURN jsonb_build_object('success', true, 'processed', 0);
    END IF;

    WITH raw_items AS (
        SELECT
            r.question_id::uuid AS question_id,
            COALESCE(NULLIF(r.subject, ''), 'General') AS subject,
            r.topic,
            COALESCE(NULLIF(r.difficulty, ''), 'Medium') AS difficulty,
            COALESCE(r.is_correct, false) AS is_correct,
            r.selected_option,
            r.correct_option,
            CASE
                WHEN r.quiz_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                 AND EXISTS (SELECT 1 FROM public.quiz_sessions sq WHERE sq.id = r.quiz_id::uuid)
                    THEN r.quiz_id::uuid
                ELSE NULL
            END AS quiz_id,
            elem.ord::int AS seq
        FROM jsonb_array_elements(p_interactions) WITH ORDINALITY AS elem(val, ord)
        CROSS JOIN LATERAL jsonb_to_record(elem.val) AS r(
            question_id text,
            subject text,
            topic text,
            difficulty text,
            is_correct boolean,
            selected_option text,
            correct_option text,
            quiz_id text
        )
        JOIN public.questions q
          ON r.question_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         AND q.id = r.question_id::uuid
    ),
    annotated AS (
        SELECT
            ri.*,
            LAST_VALUE(ri.is_correct) OVER (
                PARTITION BY ri.question_id
                ORDER BY ri.seq
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS last_is_correct,
            MAX(ri.seq) OVER (PARTITION BY ri.question_id) AS max_seq
        FROM raw_items ri
    ),
    with_flip AS (
        SELECT
            a.*,
            COALESCE(
                MAX(CASE WHEN a.is_correct IS DISTINCT FROM a.last_is_correct THEN a.seq END)
                OVER (PARTITION BY a.question_id),
                0
            ) AS last_opposite_seq
        FROM annotated a
    ),
    folded AS (
        SELECT
            wf.question_id,
            (ARRAY_AGG(wf.subject ORDER BY wf.seq DESC))[1] AS subject,
            (ARRAY_AGG(wf.topic ORDER BY wf.seq DESC) FILTER (WHERE wf.topic IS NOT NULL))[1] AS topic,
            (ARRAY_AGG(wf.difficulty ORDER BY wf.seq DESC))[1] AS difficulty,
            BOOL_OR(wf.is_correct) FILTER (WHERE wf.seq = wf.max_seq) AS last_is_correct,
            (ARRAY_AGG(wf.selected_option ORDER BY wf.seq DESC) FILTER (WHERE wf.selected_option IS NOT NULL))[1] AS last_selected_option,
            (ARRAY_AGG(wf.correct_option ORDER BY wf.seq DESC) FILTER (WHERE wf.correct_option IS NOT NULL))[1] AS correct_option,
            (ARRAY_AGG(wf.quiz_id ORDER BY wf.seq DESC) FILTER (WHERE wf.quiz_id IS NOT NULL))[1] AS last_quiz_id,
            COUNT(*)::int AS batch_attempts,
            COUNT(*) FILTER (WHERE wf.is_correct)::int AS batch_correct,
            COUNT(*) FILTER (WHERE NOT wf.is_correct)::int AS batch_incorrect,
            COUNT(*) FILTER (WHERE wf.seq > wf.last_opposite_seq AND wf.is_correct)::int AS tail_c_correct,
            COUNT(*) FILTER (WHERE wf.seq > wf.last_opposite_seq AND NOT wf.is_correct)::int AS tail_c_incorrect
        FROM with_flip wf
        GROUP BY wf.question_id
    )
    INSERT INTO public.user_question_mastery (
        user_id,
        question_id,
        subject,
        topic,
        difficulty,
        times_attempted,
        times_correct,
        times_incorrect,
        consecutive_correct,
        consecutive_incorrect,
        last_status,
        vulnerability_index,
        mastery_tier,
        last_selected_option,
        correct_option,
        last_quiz_id,
        first_attempted_at,
        last_attempted_at,
        next_review_due_at,
        mastered_at
    )
    SELECT
        v_user_id,
        f.question_id,
        f.subject,
        f.topic,
        f.difficulty,
        f.batch_attempts,
        f.batch_correct,
        f.batch_incorrect,
        f.tail_c_correct,
        f.tail_c_incorrect,
        CASE WHEN f.last_is_correct THEN 'correct' ELSE 'incorrect' END,
        CASE
            WHEN f.batch_attempts = 1 AND f.last_is_correct THEN 30
            WHEN f.batch_attempts = 1 AND NOT f.last_is_correct THEN 50
            WHEN f.last_is_correct AND f.tail_c_correct >= 3 THEN 0
            WHEN f.last_is_correct AND f.tail_c_correct = 2 THEN 15
            WHEN f.last_is_correct AND f.batch_incorrect >= 3 THEN 65
            WHEN f.last_is_correct AND f.batch_incorrect = 2 THEN 40
            WHEN f.last_is_correct THEN 20
            WHEN f.batch_incorrect >= 3 THEN LEAST(100, 90 + (f.batch_incorrect * 2))
            WHEN f.batch_incorrect = 2 THEN 75
            ELSE 50
        END,
        CASE
            WHEN f.batch_attempts = 1 AND f.last_is_correct THEN 'UNVERIFIED_GUESS'
            WHEN f.batch_attempts = 1 AND NOT f.last_is_correct THEN 'FRESH_SLIP'
            WHEN f.last_is_correct AND f.tail_c_correct >= 3 THEN 'MASTERED'
            WHEN f.last_is_correct AND f.tail_c_correct = 2 THEN 'FAMILIAR'
            WHEN f.last_is_correct AND f.batch_incorrect >= 3 THEN 'REPEATED_ERROR'
            WHEN f.last_is_correct AND f.batch_incorrect = 2 THEN 'FRESH_SLIP'
            WHEN f.last_is_correct THEN 'FAMILIAR'
            WHEN f.batch_incorrect >= 3 THEN 'CRITICAL_ERROR'
            WHEN f.batch_incorrect = 2 THEN 'REPEATED_ERROR'
            ELSE 'FRESH_SLIP'
        END,
        f.last_selected_option,
        f.correct_option,
        f.last_quiz_id,
        v_now,
        v_now,
        v_now + CASE
            WHEN f.batch_attempts = 1 AND f.last_is_correct THEN INTERVAL '3 days'
            WHEN f.batch_attempts = 1 AND NOT f.last_is_correct THEN INTERVAL '1 day'
            WHEN f.last_is_correct AND f.tail_c_correct >= 3 THEN INTERVAL '30 days'
            WHEN f.last_is_correct AND f.tail_c_correct = 2 THEN INTERVAL '7 days'
            WHEN f.last_is_correct THEN INTERVAL '3 days'
            WHEN f.batch_incorrect >= 3 THEN INTERVAL '1 day'
            WHEN f.batch_incorrect = 2 THEN INTERVAL '2 days'
            ELSE INTERVAL '3 days'
        END,
        CASE
            WHEN f.last_is_correct AND f.tail_c_correct >= 3 THEN v_now
            ELSE NULL
        END
    FROM folded f
    ON CONFLICT (user_id, question_id) DO UPDATE SET
        times_attempted = user_question_mastery.times_attempted + EXCLUDED.times_attempted,
        times_correct = user_question_mastery.times_correct + EXCLUDED.times_correct,
        times_incorrect = user_question_mastery.times_incorrect + EXCLUDED.times_incorrect,
        consecutive_correct = CASE
            WHEN EXCLUDED.last_status = 'correct' THEN
                CASE
                    WHEN EXCLUDED.times_correct = EXCLUDED.times_attempted
                        THEN user_question_mastery.consecutive_correct + EXCLUDED.consecutive_correct
                    ELSE EXCLUDED.consecutive_correct
                END
            ELSE 0
        END,
        consecutive_incorrect = CASE
            WHEN EXCLUDED.last_status = 'incorrect' THEN
                CASE
                    WHEN EXCLUDED.times_incorrect = EXCLUDED.times_attempted
                        THEN user_question_mastery.consecutive_incorrect + EXCLUDED.consecutive_incorrect
                    ELSE EXCLUDED.consecutive_incorrect
                END
            ELSE 0
        END,
        last_status = EXCLUDED.last_status,
        vulnerability_index = CASE
            WHEN EXCLUDED.last_status = 'correct' THEN
                CASE
                    WHEN (CASE WHEN EXCLUDED.times_correct = EXCLUDED.times_attempted
                               THEN user_question_mastery.consecutive_correct + EXCLUDED.consecutive_correct
                               ELSE EXCLUDED.consecutive_correct END) >= 3 THEN 0
                    WHEN (CASE WHEN EXCLUDED.times_correct = EXCLUDED.times_attempted
                               THEN user_question_mastery.consecutive_correct + EXCLUDED.consecutive_correct
                               ELSE EXCLUDED.consecutive_correct END) = 2 THEN 15
                    WHEN (user_question_mastery.times_incorrect + EXCLUDED.times_incorrect) >= 3 THEN 65
                    WHEN (user_question_mastery.times_incorrect + EXCLUDED.times_incorrect) = 2 THEN 40
                    ELSE 20
                END
            ELSE
                CASE
                    WHEN (user_question_mastery.times_incorrect + EXCLUDED.times_incorrect) >= 3
                        THEN LEAST(100, 90 + ((user_question_mastery.times_incorrect + EXCLUDED.times_incorrect) * 2))
                    WHEN (user_question_mastery.times_incorrect + EXCLUDED.times_incorrect) = 2 THEN 75
                    ELSE 50
                END
        END,
        mastery_tier = CASE
            WHEN EXCLUDED.last_status = 'correct' THEN
                CASE
                    WHEN (CASE WHEN EXCLUDED.times_correct = EXCLUDED.times_attempted
                               THEN user_question_mastery.consecutive_correct + EXCLUDED.consecutive_correct
                               ELSE EXCLUDED.consecutive_correct END) >= 3 THEN 'MASTERED'
                    WHEN (CASE WHEN EXCLUDED.times_correct = EXCLUDED.times_attempted
                               THEN user_question_mastery.consecutive_correct + EXCLUDED.consecutive_correct
                               ELSE EXCLUDED.consecutive_correct END) = 2 THEN 'FAMILIAR'
                    WHEN (user_question_mastery.times_incorrect + EXCLUDED.times_incorrect) >= 3 THEN 'REPEATED_ERROR'
                    WHEN (user_question_mastery.times_incorrect + EXCLUDED.times_incorrect) = 2 THEN 'FRESH_SLIP'
                    ELSE 'FAMILIAR'
                END
            ELSE
                CASE
                    WHEN (user_question_mastery.times_incorrect + EXCLUDED.times_incorrect) >= 3 THEN 'CRITICAL_ERROR'
                    WHEN (user_question_mastery.times_incorrect + EXCLUDED.times_incorrect) = 2 THEN 'REPEATED_ERROR'
                    ELSE 'FRESH_SLIP'
                END
        END,
        last_selected_option = COALESCE(EXCLUDED.last_selected_option, user_question_mastery.last_selected_option),
        correct_option = COALESCE(EXCLUDED.correct_option, user_question_mastery.correct_option),
        last_quiz_id = COALESCE(EXCLUDED.last_quiz_id, user_question_mastery.last_quiz_id),
        last_attempted_at = v_now,
        next_review_due_at = v_now + CASE
            WHEN EXCLUDED.last_status = 'correct' THEN
                CASE
                    WHEN (CASE WHEN EXCLUDED.times_correct = EXCLUDED.times_attempted
                               THEN user_question_mastery.consecutive_correct + EXCLUDED.consecutive_correct
                               ELSE EXCLUDED.consecutive_correct END) >= 3 THEN INTERVAL '30 days'
                    WHEN (CASE WHEN EXCLUDED.times_correct = EXCLUDED.times_attempted
                               THEN user_question_mastery.consecutive_correct + EXCLUDED.consecutive_correct
                               ELSE EXCLUDED.consecutive_correct END) = 2 THEN INTERVAL '7 days'
                    ELSE INTERVAL '3 days'
                END
            ELSE
                CASE
                    WHEN (user_question_mastery.times_incorrect + EXCLUDED.times_incorrect) >= 3 THEN INTERVAL '1 day'
                    WHEN (user_question_mastery.times_incorrect + EXCLUDED.times_incorrect) = 2 THEN INTERVAL '2 days'
                    ELSE INTERVAL '3 days'
                END
        END,
        mastered_at = CASE
            WHEN EXCLUDED.last_status = 'correct'
             AND (CASE WHEN EXCLUDED.times_correct = EXCLUDED.times_attempted
                       THEN user_question_mastery.consecutive_correct + EXCLUDED.consecutive_correct
                       ELSE EXCLUDED.consecutive_correct END) >= 3
            THEN v_now
            ELSE user_question_mastery.mastered_at
        END;

    SELECT COUNT(*)::int
    INTO v_processed_count
    FROM jsonb_to_recordset(p_interactions) AS r(question_id text)
    WHERE r.question_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND EXISTS (SELECT 1 FROM public.questions q WHERE q.id = r.question_id::uuid);

    RETURN jsonb_build_object('success', true, 'processed', v_processed_count);
END;
$function$;

REVOKE ALL ON FUNCTION public.record_question_interactions(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_question_interactions(jsonb) TO authenticated, service_role;

-- 4.10 public.reset_user_analytics
CREATE OR REPLACE FUNCTION public.reset_user_analytics()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
  END IF;

  UPDATE public.quiz_session_results
  SET deleted_at = NOW()
  WHERE user_id = v_user_id
    AND deleted_at IS NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.reset_user_analytics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_user_analytics() TO authenticated, service_role;
