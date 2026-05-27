-- Create Enum for Explanation Status
CREATE TYPE explanation_status AS ENUM ('active', 'pending_review', 'needs_regeneration', 'trusted', 'moderated', 'overridden');

-- Create the ai_explanations_cache table
CREATE TABLE IF NOT EXISTS public.ai_explanations_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    locale TEXT NOT NULL DEFAULT 'en',
    prompt_version TEXT NOT NULL,
    model_version TEXT NOT NULL,
    content_hash TEXT NOT NULL, -- Deterministic hash of question content
    raw_response JSONB, -- The raw response from the AI provider
    explanation_data JSONB NOT NULL, -- The parsed, validated JSON payload
    status explanation_status NOT NULL DEFAULT 'trusted',
    generated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who triggered the generation (for analytics)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- We ensure only one canonical active explanation exists per exact configuration
    CONSTRAINT ai_explanations_cache_unique_combo UNIQUE (question_id, locale, prompt_version, model_version, content_hash)
);

-- Enable RLS
ALTER TABLE public.ai_explanations_cache ENABLE ROW LEVEL SECURITY;

-- Everyone can read explanations
CREATE POLICY "Public can read active explanations"
ON public.ai_explanations_cache
FOR SELECT
USING (status IN ('active', 'trusted', 'moderated', 'overridden'));

-- Only service role (Edge Function) or admins can insert/update
CREATE POLICY "Edge Function can insert/update explanations"
ON public.ai_explanations_cache
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_explanations_cache_modtime
BEFORE UPDATE ON public.ai_explanations_cache
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Add indexes for fast cache lookups
CREATE INDEX idx_ai_explanations_cache_lookup ON public.ai_explanations_cache (question_id, locale, prompt_version, model_version, content_hash);
