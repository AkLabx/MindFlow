-- ====================================================================
-- Centralized Mastery & Memory Engine (CMME) - Migration
-- Table: public.user_question_mastery
-- Functions: record_question_interactions, backfill_user_question_mastery
-- ====================================================================

-- 1. Create the Universal Question Mastery Table
CREATE TABLE IF NOT EXISTS public.user_question_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    
    -- Universal Taxonomy & Routing
    subject TEXT NOT NULL,
    topic TEXT,
    sub_topic TEXT,
    difficulty TEXT DEFAULT 'Medium',
    
    -- Interaction Counts
    times_attempted INT NOT NULL DEFAULT 1,
    times_correct INT NOT NULL DEFAULT 0,
    times_incorrect INT NOT NULL DEFAULT 0,
    times_skipped INT NOT NULL DEFAULT 0,
    
    -- Streak Tracking
    consecutive_correct INT NOT NULL DEFAULT 0,
    consecutive_incorrect INT NOT NULL DEFAULT 0,
    last_status TEXT NOT NULL, -- 'correct' | 'incorrect' | 'skipped'
    
    -- Algorithmic Vulnerability & Tier
    -- Tier values: 'CRITICAL_ERROR' | 'REPEATED_ERROR' | 'FRESH_SLIP' | 'UNVERIFIED_GUESS' | 'FAMILIAR' | 'MASTERED'
    vulnerability_index INT NOT NULL DEFAULT 50, -- 0 to 100
    mastery_tier TEXT NOT NULL DEFAULT 'FRESH_SLIP',
    
    -- Contextual Error Memory & Notes
    last_selected_option TEXT,
    correct_option TEXT,
    user_note TEXT,
    last_quiz_id UUID REFERENCES public.saved_quizzes(id) ON DELETE SET NULL,
    
    -- Spaced Repetition Scheduling
    first_attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    next_review_due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    mastered_at TIMESTAMPTZ,
    
    -- Ensure single master record per user + question
    CONSTRAINT uq_user_question_mastery UNIQUE (user_id, question_id)
);

-- 2. Performance Indexes (Covering & Filtered)
CREATE INDEX IF NOT EXISTS idx_user_mastery_lookup 
ON public.user_question_mastery (user_id, mastery_tier, subject);

CREATE INDEX IF NOT EXISTS idx_user_mastery_due 
ON public.user_question_mastery (user_id, next_review_due_at);

CREATE INDEX IF NOT EXISTS idx_user_mastery_vulnerability 
ON public.user_question_mastery (user_id, vulnerability_index DESC);

CREATE INDEX IF NOT EXISTS idx_user_mastery_question_id 
ON public.user_question_mastery (question_id);

-- 3. Row Level Security Policies
ALTER TABLE public.user_question_mastery ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read own mastery" ON public.user_question_mastery;
    DROP POLICY IF EXISTS "Users can insert own mastery" ON public.user_question_mastery;
    DROP POLICY IF EXISTS "Users can update own mastery" ON public.user_question_mastery;
    DROP POLICY IF EXISTS "Users can delete own mastery" ON public.user_question_mastery;
END $$;

CREATE POLICY "Users can read own mastery" 
ON public.user_question_mastery FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own mastery" 
ON public.user_question_mastery FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own mastery" 
ON public.user_question_mastery FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own mastery" 
ON public.user_question_mastery FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

-- 4. Centralized Batch Interaction Processing RPC
CREATE OR REPLACE FUNCTION public.record_question_interactions(p_interactions JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_item JSONB;
    v_q_id UUID;
    v_subject TEXT;
    v_topic TEXT;
    v_difficulty TEXT;
    v_is_correct BOOLEAN;
    v_selected_opt TEXT;
    v_correct_opt TEXT;
    v_quiz_id UUID;
    v_existing public.user_question_mastery%ROWTYPE;
    
    v_new_attempts INT;
    v_new_correct INT;
    v_new_incorrect INT;
    v_new_c_correct INT;
    v_new_c_incorrect INT;
    v_new_vulnerability INT;
    v_new_tier TEXT;
    v_due_interval INTERVAL;
    v_processed_count INT := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to record question interactions';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_interactions)
    LOOP
        v_q_id := (v_item->>'question_id')::UUID;
        v_subject := COALESCE(v_item->>'subject', 'General');
        v_topic := v_item->>'topic';
        v_difficulty := COALESCE(v_item->>'difficulty', 'Medium');
        v_is_correct := COALESCE((v_item->>'is_correct')::BOOLEAN, false);
        v_selected_opt := v_item->>'selected_option';
        v_correct_opt := v_item->>'correct_option';
        v_quiz_id := (v_item->>'quiz_id')::UUID;

        -- Fetch existing record if any
        SELECT * INTO v_existing 
        FROM public.user_question_mastery 
        WHERE user_id = v_user_id AND question_id = v_q_id;

        IF FOUND THEN
            v_new_attempts := v_existing.times_attempted + 1;
            IF v_is_correct THEN
                v_new_correct := v_existing.times_correct + 1;
                v_new_incorrect := v_existing.times_incorrect;
                v_new_c_correct := v_existing.consecutive_correct + 1;
                v_new_c_incorrect := 0;
                
                -- Progression logic
                IF v_new_c_correct >= 3 THEN
                    v_new_tier := 'MASTERED';
                    v_new_vulnerability := 0;
                    v_due_interval := INTERVAL '30 days';
                ELSIF v_new_c_correct = 2 THEN
                    v_new_tier := 'FAMILIAR';
                    v_new_vulnerability := 15;
                    v_due_interval := INTERVAL '7 days';
                ELSE
                    -- 1st time correct after previous errors: de-escalate tier
                    IF v_existing.times_incorrect >= 3 THEN
                        v_new_tier := 'REPEATED_ERROR';
                        v_new_vulnerability := 65;
                    ELSIF v_existing.times_incorrect = 2 THEN
                        v_new_tier := 'FRESH_SLIP';
                        v_new_vulnerability := 40;
                    ELSE
                        v_new_tier := 'FAMILIAR';
                        v_new_vulnerability := 20;
                    END IF;
                    v_due_interval := INTERVAL '3 days';
                END IF;
            ELSE
                v_new_correct := v_existing.times_correct;
                v_new_incorrect := v_existing.times_incorrect + 1;
                v_new_c_correct := 0;
                v_new_c_incorrect := v_existing.consecutive_incorrect + 1;
                
                -- Error escalation logic
                IF v_new_incorrect >= 3 THEN
                    v_new_tier := 'CRITICAL_ERROR';
                    v_new_vulnerability := LEAST(100, 90 + (v_new_incorrect * 2));
                    v_due_interval := INTERVAL '1 day';
                ELSIF v_new_incorrect = 2 THEN
                    v_new_tier := 'REPEATED_ERROR';
                    v_new_vulnerability := 75;
                    v_due_interval := INTERVAL '2 days';
                ELSE
                    v_new_tier := 'FRESH_SLIP';
                    v_new_vulnerability := 50;
                    v_due_interval := INTERVAL '3 days';
                END IF;
            END IF;

            UPDATE public.user_question_mastery
            SET times_attempted = v_new_attempts,
                times_correct = v_new_correct,
                times_incorrect = v_new_incorrect,
                consecutive_correct = v_new_c_correct,
                consecutive_incorrect = v_new_c_incorrect,
                last_status = CASE WHEN v_is_correct THEN 'correct' ELSE 'incorrect' END,
                vulnerability_index = v_new_vulnerability,
                mastery_tier = v_new_tier,
                last_selected_option = COALESCE(v_selected_opt, last_selected_option),
                correct_option = COALESCE(v_correct_opt, correct_option),
                last_quiz_id = COALESCE(v_quiz_id, last_quiz_id),
                last_attempted_at = now(),
                next_review_due_at = now() + v_due_interval,
                mastered_at = CASE WHEN v_new_tier = 'MASTERED' THEN now() ELSE mastered_at END
            WHERE id = v_existing.id;
        ELSE
            -- First-ever attempt
            IF v_is_correct THEN
                -- Single correct answer on first try: flag as UNVERIFIED_GUESS!
                v_new_tier := 'UNVERIFIED_GUESS';
                v_new_vulnerability := 30;
                v_due_interval := INTERVAL '3 days';
            ELSE
                -- First mistake: FRESH_SLIP
                v_new_tier := 'FRESH_SLIP';
                v_new_vulnerability := 50;
                v_due_interval := INTERVAL '1 day';
            END IF;

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
                next_review_due_at
            ) VALUES (
                v_user_id,
                v_q_id,
                v_subject,
                v_topic,
                v_difficulty,
                1,
                CASE WHEN v_is_correct THEN 1 ELSE 0 END,
                CASE WHEN v_is_correct THEN 0 ELSE 1 END,
                CASE WHEN v_is_correct THEN 1 ELSE 0 END,
                CASE WHEN v_is_correct THEN 0 ELSE 1 END,
                CASE WHEN v_is_correct THEN 'correct' ELSE 'incorrect' END,
                v_new_vulnerability,
                v_new_tier,
                v_selected_opt,
                v_correct_opt,
                v_quiz_id,
                now(),
                now(),
                now() + v_due_interval
            );
        END IF;

        v_processed_count := v_processed_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'processed', v_processed_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_question_interactions TO authenticated;

-- 5. Historical Backfill RPC
CREATE OR REPLACE FUNCTION public.backfill_user_question_mastery()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        FROM public.saved_quizzes sq
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

                    IF FOUND AND v_ans IS NOT NULL THEN
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
        END IF;
    END LOOP;

    IF jsonb_array_length(v_interactions) > 0 THEN
        PERFORM public.record_question_interactions(v_interactions);
        v_total_backfilled := jsonb_array_length(v_interactions);
    END IF;

    RETURN jsonb_build_object('success', true, 'backfilled_interactions', v_total_backfilled);
END;
$$;

GRANT EXECUTE ON FUNCTION public.backfill_user_question_mastery TO authenticated;
