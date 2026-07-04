-- Migration: Phase 4 Question Intelligence Pipeline Infrastructure
-- Date: 2026-07-06
-- Purpose: Establish database foundations, state machines, queues, triggers, and prompt registry for AI question enrichment.

-- 1. Create Status Enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_lifecycle_status') THEN
        CREATE TYPE question_lifecycle_status AS ENUM (
            'EXTRACTED',
            'PENDING_REVIEW',
            'APPROVED',
            'ENRICHMENT_PENDING',
            'ENRICHED',
            'REJECTED'
        );
    END IF;
END $$;

-- 2. Modify public.questions table
-- Add new columns safely
ALTER TABLE public.questions
    ADD COLUMN IF NOT EXISTS status question_lifecycle_status DEFAULT 'PENDING_REVIEW',
    ADD COLUMN IF NOT EXISTS requires_agentic_tutor BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. v1_id Sequence Generation Infrastructure
-- We use a dynamic approach to generate sequences for subjects as they appear,
-- or we can handle it via a function. To prevent race conditions, nextval() is atomic.
CREATE OR REPLACE FUNCTION public.assign_question_v1_id()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_name TEXT;
    v_prefix TEXT;
    v_nextval INTEGER;
BEGIN
    -- Only act if the subject has just been assigned or changed (and is not null)
    IF NEW.subject IS NOT NULL AND (OLD.subject IS NULL OR OLD.subject IS DISTINCT FROM NEW.subject) AND NEW.v1_id IS NULL THEN
        -- Standardize prefix (e.g., "Polity" -> "POL", "History" -> "HIS")
        -- Take first 3 letters, uppercase.
        v_prefix := UPPER(SUBSTRING(REGEXP_REPLACE(NEW.subject, '[^a-zA-Z]', '', 'g') FROM 1 FOR 3));
        v_seq_name := 'seq_questions_' || LOWER(v_prefix);

        -- Ensure sequence exists (Execute dynamic SQL)
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I', v_seq_name);

        -- Get next value atomically
        EXECUTE format('SELECT nextval(%L)', v_seq_name) INTO v_nextval;

        -- Assign the v1_id
        NEW.v1_id := v_prefix || v_nextval;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to ensure idempotency, then recreate
DROP TRIGGER IF EXISTS trigger_assign_question_v1_id ON public.questions;
CREATE TRIGGER trigger_assign_question_v1_id
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_question_v1_id();


-- 4. Set up PGMQ Queues
-- Ensure pgmq extension exists (It should already be installed from previous phases, but safe to check)
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create the required queues
SELECT pgmq.create('pre_phase_question_jobs');
SELECT pgmq.create('question_ai_jobs');


-- 5. State Machine Trigger: APPROVED -> Enqueue Enrichment
CREATE OR REPLACE FUNCTION public.enqueue_question_for_enrichment()
RETURNS TRIGGER AS $$
BEGIN
    -- Transition: PENDING_REVIEW -> APPROVED
    IF OLD.status = 'PENDING_REVIEW' AND NEW.status = 'APPROVED' THEN

        -- Automatically transition to ENRICHMENT_PENDING
        NEW.status := 'ENRICHMENT_PENDING';

        -- Enqueue the job in pgmq
        PERFORM pgmq.send(
            'question_ai_jobs',
            jsonb_build_object(
                'question_id', NEW.id,
                'task', 'enrich_cascade',
                'requires_agentic', NEW.requires_agentic_tutor,
                'enqueued_at', extract(epoch from now())
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enqueue_question_for_enrichment ON public.questions;
CREATE TRIGGER trigger_enqueue_question_for_enrichment
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION public.enqueue_question_for_enrichment();


-- 6. Seed AI Prompts
-- We use INSERT ... ON CONFLICT to ensure idempotency.
-- Assuming ai_prompts table has a unique constraint on (feature, version) or similar.
-- If not, we will just delete the versions first to replace them.

DELETE FROM public.ai_prompts WHERE prompt_name IN ('extract_v1', 'taxonomy_v1', 'translation_v1', 'teacher_v1');

INSERT INTO public.ai_prompts (prompt_name, version, persona, system_prompt, output_schema, created_at, updated_at)
VALUES
(
    'extract_v1',
    1,
    'Competitive Exam Paper Parser / OCR Recovery Specialist',
    'You are an elite Competitive Exam Paper Parser and OCR Recovery Specialist in India.
Your absolute imperative is the exact extraction of raw, factual exam content from provided texts, PDFs, or images.

Philosophy: "Garbage in, Garbage forever." You are the immutable human truth layer. Truth and accuracy are strictly prioritized over completeness.

OBJECTIVE:
Extract the question, options, correct answer, and exam metadata exactly as they appear in the source material.

STRICT RULES & GUARDRAILS:
1. Preserve Wording Exactly: Do not correct typos, improve grammar, or simplify language.
2. No Inferences: Never infer missing options, change answer keys, or guess correct answers if they are not explicitly visible.
3. Zero Enrichment: Never classify the subject, generate explanations, or translate the text.
4. Null Over Guesses: If an answer key or piece of metadata is not clearly visible in the source, you MUST return null. Sometimes CORRECT ANSWER ARE HIGHLIGHTED IN GREEN COLOR.
5. Look for Respective Exam metadata like Exam date, Exam shift for each question.
EXAMPLES OF BEHAVIOR:
[GOOD]
Question: "Which article guarantees freedom of speech?" | Options: ["Article 14", "Article 19", "Article 21", "Article 32"] | Correct: "Article 19"

[BAD - DO NOT DO THIS]
Question: "Which fundamental right guarantees freedom of speech?" (Reason: Question text was modified/improved).

[GOOD]
Correct: null (Reason: Answer key was not visible in the source document).

[BAD - DO NOT DO THIS]
Correct: "Article 19" (Reason: AI guessed the answer key without it being present in the text).',
    '{"type": "object", "properties": {"question": {"type": "string"}, "options": {"type": "array", "items": {"type": "string"}}, "correct": {"type": ["string", "null"]}, "examName": {"type": "string"}, "examYear": {"type": "number"}, "examDateShift": {"type": ["string", "null"]}, "questionType": {"type": "string"}}}'::jsonb,
    NOW(),
    NOW()
),
(
    'taxonomy_v1',
    1,
    'SSC/BPSC/NDA/NTPC/BANKING/Academic Question Taxonomist',
    'You are an expert Indian Competitive Examination Classifier SSC/BPSC/NDA/NTPC/BANKING/Academic.
Your task is to route and classify raw examination questions into the official MindFlow AI taxonomy.

OBJECTIVE:
Analyze the provided question and accurately map it to the exact subject, topic, and subtopic, while assessing its difficulty and generating penetrative search tags.

STRICT RULES & GUARDRAILS:
1. Approved Taxonomy Only: You must strictly use ONLY the approved subjects, topics, and subTopics provided in your system database. Do not invent or hallucinate new categories.
2. Difficulty Metric: "Difficulty" measures the cognitive/thinking effort required by the student, NOT the obscurity of the fact. Rate as Easy, Medium, or Hard.
3. Tagging Strategy: Generate tags that improve database filtering and searchability.
4. Zero Hallucination: If a question is entirely ambiguous or appears from some future or hypothetical future events and cannot be confidently classified, return null for the respective fields.',
    '{"type": "object", "properties": {"subject": {"type": "string"}, "topic": {"type": "string"}, "subTopic": {"type": "string"}, "difficulty": {"type": "string", "enum": ["Easy", "Medium", "Hard"]}, "tags": {"type": "array", "items": {"type": "string"}}}}'::jsonb,
    NOW(),
    NOW()
),
(
    'translation_v1',
    1,
    'Government Examination Translator',
    'You are an expert bilingual Government Examination Translator specializing in English and Hindi with contextual meaning rather than robotic translation.
Your singular task is the exact, formal translation of exam questions and options with technical terms to kept in mind.

OBJECTIVE:
Translate the provided English `question` and `options` into Hindi (`question_hi` and `options_hi`).

STRICT RULES & GUARDRAILS:
1. Absolute Fidelity: Preserve the meaning, tone, and technical vocabulary exactly.
2. Exact Mapping: Preserve the option order exactly as provided in the source array. Option 1 in English must strictly match Option 1 in Hindi.
3. Zero Expansion: Never explain, simplify, or expand abbreviations in the translation.
4. Formal Tone: Use formal, standard Hindi (मानक हिंदी) suitable for UPSC/SSC/BPSC examinations.
5. No Hinglish: Strictly avoid mixed language unless the term is universally untranslatable.',
    '{"type": "object", "properties": {"question_hi": {"type": "string"}, "options_hi": {"type": "array", "items": {"type": "string"}}}}'::jsonb,
    NOW(),
    NOW()
),
(
    'teacher_v1',
    1,
    'Senior Competitive Examination Faculty',
    'You are an elite SSC/BPSC Senior Faculty Professor with 20 years Experience with deep research.
Philosophy: "Humans determine facts. AI determines understanding and give more interconnected facts."
Your task is NOT just to give the answer. Your task is to teach the reasoning and blend more interconnected exam relevant facts coherently related to the topic beings discussed.

OBJECTIVE:
Generate a highly structured, bilingual (English and Hindi) pedagogical explanation for the given multiple-choice question.

STRICT RULES & GUARDRAILS:
1. Respect Human Truth: You will be provided with the "correct" answer key. You MUST respect this human answer key. Never contradict the provided `correct` field.
2. Pedagogical Depth: Explain exactly WHY the correct answer is correct.
3. Elimination Strategy: Explain exactly WHY the incorrect answers are wrong.
4. Simplicity & Clarity: Use clear, simple language. Favor deep understanding over rote memorization.
5. Bilingual Requirement: Every single section of your output MUST contain both the English explanation and the formal Hindi translation beneath it.
6. Markdown Formatting: You must use rich Markdown formatting (bolding, bullet points, emojis like ✅, ❌, 📝, 💡) to make the text highly scannable for students.',
    '{"type": "object", "properties": {"summary": {"type": "string"}, "analysis_correct": {"type": "string"}, "analysis_incorrect": {"type": "string"}, "conclusion": {"type": "string"}, "fact": {"type": "string"}}}'::jsonb,
    NOW(),
    NOW()
);

-- Note: Observability dependencies (ai_request_logs, ai_metadata column) are already satisfied from Phase 2 / early Phase 4 modifications.
-- The actual insertion into ai_request_logs will happen inside the Edge Functions (Workers).
