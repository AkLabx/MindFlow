-- Migration: Add question_image_url to questions and ensure update policies
-- Description: Adds question_image_url column for question-level diagrams/maps alongside explanation_image_url.

-- 1. Add question_image_url column
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_image_url TEXT;
