-- Migration: Add enrichment progress column to public.questions
-- Date: 2026-07-06

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS enrichment_progress JSONB DEFAULT '{"classification": false, "translation": false, "explanation": false}'::jsonb;
