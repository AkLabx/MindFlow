-- =====================================================================================
-- MindFlow Exam Intelligence & Rank Analytics Engine
-- Migration: 20261106130000_create_exam_analytics_engine.sql
-- =====================================================================================

-- 1. Exam Configuration & Rules Registry
CREATE TABLE IF NOT EXISTS public.exam_configs (
    id TEXT PRIMARY KEY, -- e.g. 'ssc_cgl_2024_tier1', 'ssc_chsl_2024_tier1'
    exam_name TEXT NOT NULL,
    organizing_body TEXT NOT NULL DEFAULT 'SSC',
    total_questions INTEGER NOT NULL DEFAULT 100,
    positive_marks NUMERIC(4,2) NOT NULL DEFAULT 2.0,
    negative_marks NUMERIC(4,2) NOT NULL DEFAULT 0.5,
    min_normalization_sample INTEGER NOT NULL DEFAULT 30,
    sections JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default configs for SSC CGL and CHSL Tier-1
INSERT INTO public.exam_configs (id, exam_name, organizing_body, total_questions, positive_marks, negative_marks, min_normalization_sample, sections)
VALUES 
(
    'ssc_cgl_tier1',
    'SSC CGL (Combined Graduate Level) Tier-1',
    'SSC',
    100,
    2.0,
    0.5,
    30,
    '[
        {"id": "reasoning", "name": "General Intelligence & Reasoning", "q_count": 25, "weight": 2.0},
        {"id": "gk", "name": "General Awareness", "q_count": 25, "weight": 2.0},
        {"id": "math", "name": "Quantitative Aptitude", "q_count": 25, "weight": 2.0},
        {"id": "english", "name": "English Comprehension", "q_count": 25, "weight": 2.0}
    ]'::jsonb
),
(
    'ssc_chsl_tier1',
    'SSC CHSL (Combined Higher Secondary Level) Tier-1',
    'SSC',
    100,
    2.0,
    0.5,
    30,
    '[
        {"id": "reasoning", "name": "General Intelligence & Reasoning", "q_count": 25, "weight": 2.0},
        {"id": "gk", "name": "General Awareness", "q_count": 25, "weight": 2.0},
        {"id": "math", "name": "Quantitative Aptitude", "q_count": 25, "weight": 2.0},
        {"id": "english", "name": "English Comprehension", "q_count": 25, "weight": 2.0}
    ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    exam_name = EXCLUDED.exam_name,
    sections = EXCLUDED.sections,
    updated_at = NOW();

-- 2. Core Exam Submissions Table
CREATE TABLE IF NOT EXISTS public.exam_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id TEXT NOT NULL REFERENCES public.exam_configs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Candidate Identifiers (PII masked in UI)
    roll_number TEXT NOT NULL,
    candidate_name TEXT,
    exam_date DATE NOT NULL,
    shift_name TEXT NOT NULL,
    shift_code TEXT NOT NULL, -- e.g. '2024-09-12_S1'
    venue_name TEXT,
    category TEXT NOT NULL CHECK (category IN ('UR', 'OBC', 'EWS', 'SC', 'ST', 'PwD', 'ESM')),
    horizontal_category TEXT DEFAULT 'NONE',
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    state TEXT,

    -- Explicit Rankable Numeric Columns (BTree Indexed for Sub-Millisecond Sorting)
    raw_score NUMERIC(6,2) NOT NULL,
    score_reasoning NUMERIC(5,2) NOT NULL DEFAULT 0,
    score_gk NUMERIC(5,2) NOT NULL DEFAULT 0,
    score_math NUMERIC(5,2) NOT NULL DEFAULT 0,
    score_english NUMERIC(5,2) NOT NULL DEFAULT 0,

    -- Accuracy & Counts
    total_correct INTEGER NOT NULL DEFAULT 0,
    total_wrong INTEGER NOT NULL DEFAULT 0,
    total_unattempted INTEGER NOT NULL DEFAULT 0,

    -- Audit Details & Question Review
    section_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    question_responses JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Parser Metadata
    parser_adapter TEXT NOT NULL DEFAULT 'tcs_ion',
    parser_version TEXT NOT NULL DEFAULT '1.0.0',
    parse_status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (parse_status IN ('SUCCESS', 'PARTIAL', 'FAILED')),
    url_hash TEXT NOT NULL, -- SHA-256 of URL (never store raw token URL)

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_exam_roll UNIQUE (exam_id, roll_number),
    CONSTRAINT uq_exam_user UNIQUE (exam_id, user_id)
);

-- Fast BTree Indexes for Instant Ranks
CREATE INDEX IF NOT EXISTS idx_sub_exam_raw ON public.exam_submissions (exam_id, raw_score DESC);
CREATE INDEX IF NOT EXISTS idx_sub_exam_shift ON public.exam_submissions (exam_id, shift_code, raw_score DESC);
CREATE INDEX IF NOT EXISTS idx_sub_exam_cat ON public.exam_submissions (exam_id, category, raw_score DESC);

CREATE INDEX IF NOT EXISTS idx_sub_reasoning ON public.exam_submissions (exam_id, score_reasoning DESC);
CREATE INDEX IF NOT EXISTS idx_sub_gk ON public.exam_submissions (exam_id, score_gk DESC);
CREATE INDEX IF NOT EXISTS idx_sub_math ON public.exam_submissions (exam_id, score_math DESC);
CREATE INDEX IF NOT EXISTS idx_sub_english ON public.exam_submissions (exam_id, score_english DESC);

CREATE INDEX IF NOT EXISTS idx_sub_user ON public.exam_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_sub_url_hash ON public.exam_submissions (url_hash);

-- 3. Asynchronous Statistical Snapshots Table
CREATE TABLE IF NOT EXISTS public.exam_stats_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id TEXT NOT NULL REFERENCES public.exam_configs(id) ON DELETE CASCADE,
    shift_code TEXT, -- NULL represents overall exam statistics
    category TEXT,   -- NULL represents all-category statistics
    sample_size INTEGER NOT NULL DEFAULT 0,
    
    mean_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    median_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    mode_score NUMERIC(6,2),
    stddev_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    topper_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    top_0_1_pct_avg NUMERIC(6,2) DEFAULT 0,
    
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_stats_slice UNIQUE NULLS NOT DISTINCT (exam_id, shift_code, category)
);

CREATE INDEX IF NOT EXISTS idx_stats_lookup ON public.exam_stats_snapshots (exam_id, shift_code, category);

-- 4. Official Answer Keys Verification Table
CREATE TABLE IF NOT EXISTS public.official_answer_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id TEXT NOT NULL REFERENCES public.exam_configs(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    correct_option_id TEXT NOT NULL,
    is_dropped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_official_q UNIQUE (exam_id, question_id)
);

-- 5. Row-Level Security (RLS)
ALTER TABLE public.exam_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for exam configs" ON public.exam_configs FOR SELECT TO authenticated, anon USING (is_active = TRUE);

ALTER TABLE public.exam_stats_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for exam snapshots" ON public.exam_stats_snapshots FOR SELECT TO authenticated, anon USING (TRUE);

ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own submissions"
ON public.exam_submissions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
ON public.exam_submissions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions"
ON public.exam_submissions FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own submissions"
ON public.exam_submissions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 6. Live Ranking RPC (SECURITY DEFINER with PII Protection)
CREATE OR REPLACE FUNCTION public.get_candidate_live_rankings(p_submission_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    -- 1. Identity Verification (Caller must own the submission)
    SELECT * INTO v_sub FROM public.exam_submissions WHERE id = p_submission_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found';
    END IF;
    
    IF v_sub.user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Access denied: You can only query your own rank.';
    END IF;

    -- 2. Indexed Counts (Sub-3ms using BTree Indexes)
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

    -- 3. Calculate Percentile
    IF v_total_candidates > 1 THEN
        v_percentile := ROUND(((1.0 - ((v_overall_rank - 1)::numeric / v_total_candidates::numeric)) * 100.0), 2);
    ELSE
        v_percentile := 100.00;
    END IF;

    -- 4. Fetch Precomputed Snapshots (Mean, Median, StdDev) from Snapshot Table
    SELECT * INTO v_stats FROM public.exam_stats_snapshots 
    WHERE exam_id = v_sub.exam_id AND shift_code IS NULL AND category IS NULL;

    -- 5. Return Aggregates Only (Zero individual candidate PII leaked)
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

-- 7. Snapshot Refresh Function (For Asynchronous Background Workers / pg_cron)
CREATE OR REPLACE FUNCTION public.refresh_exam_stats_snapshot(p_exam_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sample_size INT;
    v_mean NUMERIC(6,2);
    v_median NUMERIC(6,2);
    v_stddev NUMERIC(6,2);
    v_topper NUMERIC(6,2);
BEGIN
    SELECT 
        COUNT(*),
        COALESCE(ROUND(AVG(raw_score), 2), 0),
        COALESCE(ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY raw_score)::numeric, 2), 0),
        COALESCE(ROUND(STDDEV_POP(raw_score), 2), 0),
        COALESCE(MAX(raw_score), 0)
    INTO 
        v_sample_size, v_mean, v_median, v_stddev, v_topper
    FROM public.exam_submissions
    WHERE exam_id = p_exam_id;

    IF v_sample_size > 0 THEN
        INSERT INTO public.exam_stats_snapshots (
            exam_id, shift_code, category, sample_size,
            mean_score, median_score, stddev_score, topper_score, computed_at
        )
        VALUES (
            p_exam_id, NULL, NULL, v_sample_size,
            v_mean, v_median, v_stddev, v_topper, NOW()
        )
        ON CONFLICT (exam_id, shift_code, category)
        DO UPDATE SET
            sample_size = EXCLUDED.sample_size,
            mean_score = EXCLUDED.mean_score,
            median_score = EXCLUDED.median_score,
            stddev_score = EXCLUDED.stddev_score,
            topper_score = EXCLUDED.topper_score,
            computed_at = NOW();
    END IF;
END;
$$;
