-- Migration: 20261115000000_optimize_mastery_and_metadata.sql
-- Phase 7: Set-based mastery upsert, covering metadata indexes, subject_metadata_cache, and keyset metadata RPC

-- ----------------------------------------------------------------------------
-- 1. Covering & Keyset Partial Indexes on questions and deleted_question_logs
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_questions_subject_examname_active
    ON public.questions (subject, "examName")
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_questions_active_updated_id
    ON public.questions (updated_at ASC, id ASC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_deleted_question_logs_deleted_at
    ON public.deleted_question_logs (deleted_at ASC, id ASC);

-- ----------------------------------------------------------------------------
-- 2. Materialized Active Question Counts Cache (subject_metadata_cache)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subject_metadata_cache (
    subject TEXT PRIMARY KEY,
    active_count INTEGER NOT NULL DEFAULT 0,
    exam_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subject_metadata_cache ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.subject_metadata_cache FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.subject_metadata_cache TO anon, authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'subject_metadata_cache'
          AND policyname = 'Allow public read access to subject_metadata_cache'
    ) THEN
        CREATE POLICY "Allow public read access to subject_metadata_cache"
            ON public.subject_metadata_cache
            FOR SELECT
            TO anon, authenticated
            USING (true);
    END IF;
END $$;

-- Initial seed / full reconciliation of subject_metadata_cache
INSERT INTO public.subject_metadata_cache (subject, active_count, exam_counts, updated_at)
SELECT
    sub.subject,
    COALESCE(SUM(sub.cnt), 0)::integer AS active_count,
    COALESCE(jsonb_object_agg(sub.exam_key, sub.cnt), '{}'::jsonb) AS exam_counts,
    now() AS updated_at
FROM (
    SELECT
        subject,
        COALESCE(NULLIF(trim("examName"), ''), 'Other') AS exam_key,
        COUNT(*)::integer AS cnt
    FROM public.questions
    WHERE deleted_at IS NULL
      AND subject IS NOT NULL
      AND trim(subject) <> ''
    GROUP BY subject, COALESCE(NULLIF(trim("examName"), ''), 'Other')
) sub
GROUP BY sub.subject
ON CONFLICT (subject) DO UPDATE
SET active_count = EXCLUDED.active_count,
    exam_counts = EXCLUDED.exam_counts,
    updated_at = now();

-- Incremental single-subject cache refresh helper (internal trigger use only)
CREATE OR REPLACE FUNCTION public.refresh_subject_metadata_for(p_subject text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total integer := 0;
    v_exam_counts jsonb := '{}'::jsonb;
BEGIN
    IF p_subject IS NULL OR trim(p_subject) = '' THEN
        RETURN;
    END IF;

    SELECT
        COALESCE(SUM(cnt), 0)::integer,
        COALESCE(jsonb_object_agg(exam_key, cnt), '{}'::jsonb)
    INTO v_total, v_exam_counts
    FROM (
        SELECT
            COALESCE(NULLIF(trim("examName"), ''), 'Other') AS exam_key,
            COUNT(*)::integer AS cnt
        FROM public.questions
        WHERE subject = p_subject
          AND deleted_at IS NULL
        GROUP BY COALESCE(NULLIF(trim("examName"), ''), 'Other')
    ) sub;

    INSERT INTO public.subject_metadata_cache (subject, active_count, exam_counts, updated_at)
    VALUES (p_subject, v_total, v_exam_counts, now())
    ON CONFLICT (subject) DO UPDATE
    SET active_count = EXCLUDED.active_count,
        exam_counts = EXCLUDED.exam_counts,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_subject_metadata_for(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_questions_subject_metadata_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.refresh_subject_metadata_for(OLD.subject);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.subject IS DISTINCT FROM NEW.subject THEN
            PERFORM public.refresh_subject_metadata_for(OLD.subject);
            PERFORM public.refresh_subject_metadata_for(NEW.subject);
        ELSIF OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
           OR OLD."examName" IS DISTINCT FROM NEW."examName" THEN
            PERFORM public.refresh_subject_metadata_for(NEW.subject);
        END IF;
        RETURN NEW;
    ELSE
        PERFORM public.refresh_subject_metadata_for(NEW.subject);
        RETURN NEW;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_questions_subject_metadata_cache() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_questions_refresh_subject_metadata_cache'
          AND tgrelid = 'public.questions'::regclass
    ) THEN
        CREATE TRIGGER trg_questions_refresh_subject_metadata_cache
            AFTER INSERT OR UPDATE OF subject, "examName", deleted_at OR DELETE
            ON public.questions
            FOR EACH ROW
            EXECUTE FUNCTION public.trg_questions_subject_metadata_cache();
    END IF;
END $$;

-- Serve dashboard subject counts from materialized cache in O(subjects)
CREATE OR REPLACE FUNCTION public.get_dashboard_subject_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        (
            SELECT jsonb_object_agg(subject, active_count)
            FROM public.subject_metadata_cache
            WHERE active_count > 0
        ),
        '{}'::jsonb
    );
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_subject_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_subject_counts() TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Set-Based Upsert in record_question_interactions (Eliminates FOR Loop)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_question_interactions(p_interactions jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
                 AND EXISTS (SELECT 1 FROM public.saved_quizzes sq WHERE sq.id = r.quiz_id::uuid)
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
$$;

REVOKE ALL ON FUNCTION public.record_question_interactions(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_question_interactions(jsonb) TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. Keyset-Paginated get_filtered_quiz_metadata Overload (+ Ordered 1-Arg)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_filtered_quiz_metadata(p_last_sync_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS TABLE(
    id uuid,
    v1_id text,
    subject text,
    topic text,
    "subTopic" text,
    "examName" text,
    "examYear" integer,
    "examDateShift" text,
    difficulty text,
    "questionType" text,
    tags text[],
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
)
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
            q.id, q.v1_id, q.subject, q.topic, q."subTopic",
            q."examName", q."examYear", q."examDateShift",
            q.difficulty, q."questionType", q.tags, q.updated_at, q.deleted_at
        FROM public.questions q
        WHERE q.deleted_at IS NULL
        ORDER BY q.updated_at ASC, q.id ASC;
    ELSE
        RETURN QUERY
        SELECT
            sub.id, sub.v1_id, sub.subject, sub.topic, sub."subTopic",
            sub."examName", sub."examYear", sub."examDateShift",
            sub.difficulty, sub."questionType", sub.tags, sub.updated_at, sub.deleted_at
        FROM (
            SELECT
                q.id, q.v1_id, q.subject, q.topic, q."subTopic",
                q."examName", q."examYear", q."examDateShift",
                q.difficulty, q."questionType", q.tags, q.updated_at, q.deleted_at
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
            WHERE t.deleted_at > p_last_sync_at
        ) sub
        ORDER BY sub.updated_at ASC, sub.id ASC;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_filtered_quiz_metadata(timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_filtered_quiz_metadata(timestamp with time zone) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_filtered_quiz_metadata(
    p_last_sync_at timestamp with time zone,
    p_after_updated_at timestamp with time zone,
    p_after_id uuid,
    p_limit integer DEFAULT 1000
)
RETURNS TABLE(
    id uuid,
    v1_id text,
    subject text,
    topic text,
    "subTopic" text,
    "examName" text,
    "examYear" integer,
    "examDateShift" text,
    difficulty text,
    "questionType" text,
    tags text[],
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 1000), 1), 2000);
    v_after_id uuid := COALESCE(p_after_id, '00000000-0000-0000-0000-000000000000'::uuid);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
    END IF;

    IF p_last_sync_at IS NULL THEN
        IF p_after_updated_at IS NULL THEN
            RETURN QUERY
            SELECT
                q.id, q.v1_id, q.subject, q.topic, q."subTopic",
                q."examName", q."examYear", q."examDateShift",
                q.difficulty, q."questionType", q.tags, q.updated_at, q.deleted_at
            FROM public.questions q
            WHERE q.deleted_at IS NULL
            ORDER BY q.updated_at ASC, q.id ASC
            LIMIT v_limit;
        ELSE
            RETURN QUERY
            SELECT
                q.id, q.v1_id, q.subject, q.topic, q."subTopic",
                q."examName", q."examYear", q."examDateShift",
                q.difficulty, q."questionType", q.tags, q.updated_at, q.deleted_at
            FROM public.questions q
            WHERE q.deleted_at IS NULL
              AND (q.updated_at, q.id) > (p_after_updated_at, v_after_id)
            ORDER BY q.updated_at ASC, q.id ASC
            LIMIT v_limit;
        END IF;
    ELSE
        IF p_after_updated_at IS NULL THEN
            RETURN QUERY
            SELECT
                sub.id, sub.v1_id, sub.subject, sub.topic, sub."subTopic",
                sub."examName", sub."examYear", sub."examDateShift",
                sub.difficulty, sub."questionType", sub.tags, sub.updated_at, sub.deleted_at
            FROM (
                SELECT
                    q.id, q.v1_id, q.subject, q.topic, q."subTopic",
                    q."examName", q."examYear", q."examDateShift",
                    q.difficulty, q."questionType", q.tags, q.updated_at, q.deleted_at
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
                WHERE t.deleted_at > p_last_sync_at
            ) sub
            ORDER BY sub.updated_at ASC, sub.id ASC
            LIMIT v_limit;
        ELSE
            RETURN QUERY
            SELECT
                sub.id, sub.v1_id, sub.subject, sub.topic, sub."subTopic",
                sub."examName", sub."examYear", sub."examDateShift",
                sub.difficulty, sub."questionType", sub.tags, sub.updated_at, sub.deleted_at
            FROM (
                SELECT
                    q.id, q.v1_id, q.subject, q.topic, q."subTopic",
                    q."examName", q."examYear", q."examDateShift",
                    q.difficulty, q."questionType", q.tags, q.updated_at, q.deleted_at
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
                WHERE t.deleted_at > p_last_sync_at
            ) sub
            WHERE (sub.updated_at, sub.id) > (p_after_updated_at, v_after_id)
            ORDER BY sub.updated_at ASC, sub.id ASC
            LIMIT v_limit;
        END IF;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_filtered_quiz_metadata(timestamp with time zone, timestamp with time zone, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_filtered_quiz_metadata(timestamp with time zone, timestamp with time zone, uuid, integer) TO authenticated;
