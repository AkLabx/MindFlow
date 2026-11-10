-- Migration: 20261111000000_harden_create_quiz_session.sql
-- Enforce caller authentication, tenant validation, search_path, and role execution guards on create_quiz_session

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
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_id uuid := auth.uid();
    q public.quiz_question_input;
BEGIN
    -- Security guard: caller must be authenticated
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
    END IF;

    -- Security guard: caller can only create sessions for their own user_id
    IF p_user_id IS NOT NULL AND p_user_id <> v_caller_id THEN
        RAISE EXCEPTION 'Forbidden: Cannot create quiz sessions for another user';
    END IF;

    -- Insert into saved_quizzes bound to authenticated caller
    INSERT INTO public.saved_quizzes (
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

    -- Insert into bridge_saved_quiz_questions
    IF p_questions IS NOT NULL THEN
        FOREACH q IN ARRAY p_questions LOOP
            INSERT INTO public.bridge_saved_quiz_questions (
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
$$;

-- Revoke execute from public/anon, grant only to authenticated users
REVOKE EXECUTE ON FUNCTION public.create_quiz_session(uuid, uuid, text, bigint, jsonb, text, jsonb, public.quiz_question_input[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_quiz_session(uuid, uuid, text, bigint, jsonb, text, jsonb, public.quiz_question_input[]) TO authenticated;
